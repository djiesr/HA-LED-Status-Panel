"""
LED Status Panel — Home Assistant integration.

Loads JSON config, listens to entity state changes, evaluates rules,
and calls the ESPHome set_led service for each assignment.
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceNotFound
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    BEHAVIOR_TO_INT,
    CONF_CONFIG_FILE,
    CONF_ENTITY_ID,
    DEFAULT_LAYOUT,
    DEFAULT_PANELS,
    DOMAIN,
    IMPORTANCE_BRIGHTNESS,
    SERVICE_SET_LED,
)

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = vol.Schema(
    {
        DOMAIN: vol.Schema(
            {
                vol.Required(CONF_CONFIG_FILE): cv.string,
                vol.Required(CONF_ENTITY_ID): cv.entity_id,
            }
        )
    },
    extra=vol.ALLOW_EXTRA,
)


def _load_config_sync(path: Path) -> dict[str, Any] | None:
    """Load JSON from path (run in executor to avoid blocking)."""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        _LOGGER.exception("Failed to load config: %s", e)
        return None


async def _load_config(config_path: str, hass: HomeAssistant) -> dict[str, Any] | None:
    """Load JSON config from path (relative to HA config dir or absolute)."""
    path = Path(config_path)
    if not path.is_absolute():
        path = Path(hass.config.config_dir) / path
    if not path.exists():
        _LOGGER.error("Config file not found: %s", path)
        return None
    return await hass.async_add_executor_job(_load_config_sync, path)


def _panel_layout_to_index(
    panel: int, row: int, col: int, panels: int, layout: str
) -> int:
    """Map (panel, row, col) to linear LED index. One panel = 8x8 = 64 LEDs."""
    if panel < 0 or row < 0 or row > 7 or col < 0 or col > 7:
        return -1
    # Single panel: zigzag horizontal (row 0 L->R, row 1 R->L, ...)
    if layout == "zigzag_h":
        if row % 2 == 0:
            idx = row * 8 + col
        else:
            idx = row * 8 + (7 - col)
    else:
        idx = row * 8 + col
    return panel * 64 + idx


def _evaluate_rules(state: str, attr: dict, rules: list[dict]) -> dict | None:
    """Return first matching rule (color, behavior, brightness). state is 'unavailable' or value."""
    def _try_float(v: Any) -> float | None:
        try:
            if v is None:
                return None
            if isinstance(v, (int, float)):
                return float(v)
            s = str(v).strip()
            if s == "":
                return None
            return float(s)
        except (TypeError, ValueError):
            return None

    def _cmp(lhs: Any, op: str, rhs_raw: str) -> bool:
        rhs_raw = (rhs_raw or "").strip()
        lhs_num = _try_float(lhs)
        rhs_num = _try_float(rhs_raw)

        # If both sides are numeric, do numeric compare
        if lhs_num is not None and rhs_num is not None:
            if op == "==":
                return lhs_num == rhs_num
            if op == "!=":
                return lhs_num != rhs_num
            if op == "<":
                return lhs_num < rhs_num
            if op == "<=":
                return lhs_num <= rhs_num
            if op == ">":
                return lhs_num > rhs_num
            if op == ">=":
                return lhs_num >= rhs_num
            return False

        # Fallback to string compare (only == / != make sense)
        lhs_s = "" if lhs is None else str(lhs).strip()
        if op == "==":
            return lhs_s == rhs_raw
        if op == "!=":
            return lhs_s != rhs_raw
        return False

    for rule in rules:
        cond = rule.get("condition", "")
        if cond == "unavailable" and state == "unavailable":
            return rule
        if cond == "default":
            return rule
        if state == "unavailable":
            continue

        # attribute.xxx [op rhs] OR attribute.xxx (exists)
        if cond.startswith("attribute."):
            rest = cond[len("attribute.") :].strip()
            for op in ("<=", ">=", "==", "!=", "<", ">", "="):
                if op in rest:
                    key, rhs = rest.split(op, 1)
                    key = key.strip()
                    rhs = rhs.strip()
                    if not key:
                        break
                    if key not in attr:
                        break
                    op_cmp = "==" if op == "=" else op
                    if _cmp(attr.get(key), op_cmp, rhs):
                        return rule
                    break
            else:
                # No operator: match if attribute exists (and not None)
                key = rest.strip()
                if key and attr.get(key) is not None:
                    return rule
            continue

        # state [op rhs] (supports "state == on", "state = on", "state <= 10")
        s = cond.strip()
        if s.startswith("state"):
            s = s[len("state") :].strip()
        # accepter "=" comme égalité (en plus de "==")
        for op in ("<=", ">=", "==", "!=", "<", ">", "="):
            if op in s:
                _, rhs = s.split(op, 1)
                rhs = rhs.strip()
                op_cmp = "==" if op == "=" else op
                if _cmp(state, op_cmp, rhs):
                    return rule
                break
    return None


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert #RRGGBB to (r, g, b) 0-255."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        return (0, 0, 0)
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
    )


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up LED Status Panel from configuration.yaml."""
    if DOMAIN not in config:
        _LOGGER.warning(
            "LED Status Panel: aucun bloc 'led_status_panel' dans configuration.yaml — "
            "ajoute le bloc puis redémarre HA."
        )
        return True

    _LOGGER.info("LED Status Panel: démarrage (configuration détectée)...")
    conf = config[DOMAIN]
    config_file = conf[CONF_CONFIG_FILE]
    panel_entity_id = conf[CONF_ENTITY_ID]

    data = await _load_config(config_file, hass)
    if not data:
        _LOGGER.error("LED Status Panel: cannot start without config. Check config_file path: %s", config_file)
        return False

    panels = data.get("panels", DEFAULT_PANELS)
    layout = data.get("panel_layout", DEFAULT_LAYOUT)
    assignments = data.get("assignments", [])
    assignments_with_leds = [a for a in assignments if (a.get("leds") or [])]
    _LOGGER.info(
        "LED Status Panel: config chargée (%s) — %d assignations, %d avec LEDs",
        config_file, len(assignments), len(assignments_with_leds),
    )

    # Au démarrage le panneau ESPHome peut ne pas être connecté (entité pas encore dans hass.states).
    # On ne bloque pas le setup : l'intégration démarre, les appels set_led marcheront une fois connecté.
    if hass.states.get(panel_entity_id) is None:
        _LOGGER.warning(
            "LED Status Panel: entité '%s' pas encore disponible (panneau déconnecté ?). L'intégration démarre ; les LEDs se mettront à jour à la connexion.",
            panel_entity_id,
        )

    service_domain = "esphome"
    _service_not_found_logged = [False]  # pour ne loguer qu'une fois

    @callback
    def _on_state_changed(event):
        new_state = event.data.get("new_state")
        entity_id = event.data.get("entity_id")
        if not new_state:
            state_str = "unavailable"
            attr = {}
        else:
            state_str = new_state.state
            attr = new_state.attributes or {}

        for assignment in assignments:
            if assignment.get("entity_id") != entity_id:
                continue
            rule_result = _evaluate_rules(state_str, attr, assignment.get("rules", []))
            if not rule_result:
                _LOGGER.debug(
                    "LED Status Panel: %s = %s (aucune règle ne correspond)",
                    entity_id, state_str,
                )
                continue
            led_list = assignment.get("leds", [])
            _LOGGER.info(
                "LED Status Panel: %s = %s → règle « %s » → %d LED(s)",
                entity_id, state_str, rule_result.get("condition", ""), len(led_list),
            )
            color_hex = rule_result.get("color", "#000000")
            behavior_str = rule_result.get("behavior", "solid")
            behavior_int = BEHAVIOR_TO_INT.get(behavior_str, 1)  # 1=solid default
            importance = assignment.get("importance", "medium")
            brightness = IMPORTANCE_BRIGHTNESS.get(importance, 30)  # 0-100 for API
            r, g, b = _hex_to_rgb(color_hex)
            if behavior_str == "off":
                r, g, b, brightness = 0, 0, 0, 0

            for led_spec in led_list:
                panel = led_spec.get("panel", 0)
                row = led_spec.get("row", 0)
                col = led_spec.get("col", 0)
                idx = _panel_layout_to_index(panel, row, col, panels, layout)
                if idx < 0:
                    continue
                service_data = {
                    "led_index": idx,
                    "red": r,
                    "green": g,
                    "blue": b,
                    "brightness": brightness,
                    "behavior": behavior_int,
                }

                async def _call_set_led(
                    sd=service_data,
                    led_idx=idx,
                ):
                    try:
                        await hass.services.async_call(
                            service_domain,
                            SERVICE_SET_LED,
                            sd,
                            blocking=True,
                        )
                    except ServiceNotFound:
                        if not _service_not_found_logged[0]:
                            _service_not_found_logged[0] = True
                            _LOGGER.warning(
                                "LED Status Panel: service set_led non trouvé (ESPHome pas prêt ou plusieurs panneaux ?). Les LEDs se mettront à jour au prochain changement d'état ou après reconnexion."
                            )
                    except Exception as err:
                        _LOGGER.exception(
                            "LED Status Panel: échec set_led (led_index=%s): %s",
                            led_idx,
                            err,
                        )

                hass.create_task(_call_set_led())

    for assignment in assignments:
        entity_id = assignment.get("entity_id")
        if entity_id:
            async_track_state_change_event(hass, entity_id, _on_state_changed)

    # Appliquer l'état actuel des entités après un délai (laisser ESPHome s'authentifier)
    from homeassistant.core import Event

    async def _apply_initial_states_delayed() -> None:
        await asyncio.sleep(45)  # laisser le temps à ESPHome de s'authentifier et d'enregistrer le service
        for assignment in assignments:
            entity_id = assignment.get("entity_id")
            if not entity_id:
                continue
            state = hass.states.get(entity_id)
            if not state:
                continue
            fake_event = Event(
                "state_changed",
                data={
                    "entity_id": entity_id,
                    "old_state": None,
                    "new_state": state,
                },
            )
            _on_state_changed(fake_event)

    hass.async_create_task(_apply_initial_states_delayed())

    entity_ids = list({a.get("entity_id") for a in assignments if a.get("entity_id")})
    _LOGGER.info(
        "LED Status Panel: prêt — écoute %s entité(s): %s",
        len(entity_ids),
        ", ".join(entity_ids) if entity_ids else "(aucune)",
    )
    return True