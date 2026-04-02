"""
LED Status Panel — Home Assistant integration.

Config via Integrations menu (config entries). Loads JSON config,
listens to entity state changes, evaluates rules, and calls the
ESPHome set_led service for each assignment.
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, Event, callback
from homeassistant.exceptions import ServiceNotFound
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    BEHAVIOR_TO_INT,
    CONF_CONFIG_FILE,
    CONF_ENTITY_ID,
    CONF_FLIP_H,
    CONF_FLIP_V,
    CONF_LAYOUT,
    CONF_PANEL_OPTIONS,
    CONF_PANELS,
    DEFAULT_LAYOUT,
    DEFAULT_PANELS,
    DOMAIN,
    ENTITY_OBJECT_ID_SUFFIX,
    IMPORTANCE_BRIGHTNESS,
    SERVICE_SET_LED_SUFFIX,
)
from .http_api import async_register_http_views

_LOGGER = logging.getLogger(__name__)

# Max retries when ESPHome service is not yet available at startup
SET_LED_RETRY_COUNT = 5
SET_LED_RETRY_DELAY = 5.0

SERVICE_DOMAIN_ESPHOME = "esphome"


def _entity_id_to_set_led_service_name(entity_id: str) -> str:
    """Derive ESPHome set_led service name from panel light entity_id.
    ESPHome registers esphome.<device_name>_set_led per device; entity_id is
    typically light.<device_name>_led_status_panel."""
    if "." in entity_id:
        object_id = entity_id.split(".", 1)[1]
    else:
        object_id = entity_id
    suffix = "_" + ENTITY_OBJECT_ID_SUFFIX
    if object_id.endswith(suffix):
        device_name = object_id[: -len(suffix)].rstrip("_")
    else:
        device_name = object_id
    return device_name + "_" + SERVICE_SET_LED_SUFFIX


def _load_config_sync(path: Path) -> dict[str, Any] | None:
    """Load JSON from path (run in executor to avoid blocking)."""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        _LOGGER.exception("Failed to load config: %s", e)
        return None


def _write_json_sync(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
        f.flush()
    tmp.replace(path)


def _write_minimal_config_sync(path: Path) -> None:
    minimal = {
        "panels": 1,
        "panel_options": [{"flip_h": False, "flip_v": False, "layout": "zigzag_h"}],
        "assignments": [],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(minimal, f, ensure_ascii=False, indent=2)
        f.write("\n")
        f.flush()
    tmp.replace(path)


async def _load_config(config_path: str, hass: HomeAssistant) -> dict[str, Any] | None:
    """Load JSON config from path (relative to HA config dir or absolute)."""
    path = Path(config_path)
    if not path.is_absolute():
        path = Path(hass.config.config_dir) / path
    if not path.exists():
        _LOGGER.error("Config file not found: %s", path)
        return None
    return await hass.async_add_executor_job(_load_config_sync, path)


def _get_panel_option(panel_options: list[dict] | None, panel: int, key: str, default: Any) -> Any:
    """Get option for a panel; panel_options is a list of dicts (flip_h, flip_v, layout)."""
    if not panel_options or panel >= len(panel_options):
        return default
    return panel_options[panel].get(key, default)


def _panel_layout_to_index(
    panel: int,
    row: int,
    col: int,
    panels: int,
    layout: str,
    panel_options: list[dict] | None = None,
) -> int:
    """
    Map (panel, row, col) to linear LED index. One panel = 8x8 = 64 LEDs.
    panel_options: list of { flip_h, flip_v, layout } per panel.
    """
    if panel < 0 or row < 0 or row > 7 or col < 0 or col > 7:
        return -1
    flip_h = _get_panel_option(panel_options, panel, CONF_FLIP_H, False)
    flip_v = _get_panel_option(panel_options, panel, CONF_FLIP_V, False)
    panel_layout = _get_panel_option(panel_options, panel, CONF_LAYOUT, layout)
    if flip_h:
        col = 7 - col
    if flip_v:
        row = 7 - row
    if panel_layout == "zigzag_h":
        if row % 2 == 0:
            idx = row * 8 + col
        else:
            idx = row * 8 + (7 - col)
    elif panel_layout == "zigzag_v":
        if col % 2 == 0:
            idx = col * 8 + row
        else:
            idx = col * 8 + (7 - row)
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
                key = rest.strip()
                if key and attr.get(key) is not None:
                    return rule
            continue
        s = cond.strip()
        if s.startswith("state"):
            s = s[len("state") :].strip()
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
    """Integration is set up only via config entries (Integrations menu)."""
    # Register our scoped HTTP API once at startup.
    try:
        await async_register_http_views(hass)
    except Exception as err:
        _LOGGER.exception("Failed to register HTTP views: %s", err)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up LED Status Panel from a config entry."""
    config_file = entry.data.get(CONF_CONFIG_FILE)
    panel_entity_id = entry.data.get(CONF_ENTITY_ID)
    if not config_file or not panel_entity_id:
        _LOGGER.error("LED Status Panel: config entry missing config_file or entity_id")
        return False

    path = Path(config_file)
    if not path.is_absolute():
        path = Path(hass.config.config_dir) / path
    if not path.exists():
        try:
            await hass.async_add_executor_job(_write_minimal_config_sync, path)
            _LOGGER.warning("LED Status Panel: config missing; created minimal JSON at %s", path)
        except OSError as err:
            _LOGGER.error("LED Status Panel: cannot create config file %s: %s", path, err)

    data = await _load_config(config_file, hass)
    if not data:
        _LOGGER.error(
            "LED Status Panel: cannot start without config. Check config_file path: %s",
            config_file,
        )
        return False

    # Sync panel configuration from config entry into JSON (config entry is the source of truth)
    entry_panels = entry.data.get(CONF_PANELS)
    entry_panel_options = entry.data.get(CONF_PANEL_OPTIONS)
    if entry_panels is not None or entry_panel_options is not None:
        changed = False
        if entry_panels is not None and data.get("panels") != entry_panels:
            data["panels"] = entry_panels
            changed = True
        if entry_panel_options is not None and data.get(CONF_PANEL_OPTIONS) != entry_panel_options:
            data[CONF_PANEL_OPTIONS] = entry_panel_options
            changed = True
        if changed:
            config_path = Path(config_file)
            if not config_path.is_absolute():
                config_path = Path(hass.config.config_dir) / config_path
            try:
                await hass.async_add_executor_job(_write_json_sync, config_path, data)
                _LOGGER.info("LED Status Panel: panel_options synchronisées dans %s", config_file)
            except OSError as err:
                _LOGGER.warning("LED Status Panel: impossible de synchroniser panel_options: %s", err)

    panels = data.get("panels", DEFAULT_PANELS)
    layout = data.get("panel_layout", DEFAULT_LAYOUT)
    panel_options = data.get(CONF_PANEL_OPTIONS)  # list of { flip_h, flip_v, layout } per panel
    assignments = data.get("assignments", [])
    assignments_with_leds = [a for a in assignments if (a.get("leds") or [])]
    _LOGGER.info(
        "LED Status Panel: config chargée (%s) — %d assignations, %d avec LEDs",
        config_file,
        len(assignments),
        len(assignments_with_leds),
    )

    # Un seul device : 1 ou 2 panneaux physiques en chaîne sur le même ESP → même service
    service_name = _entity_id_to_set_led_service_name(panel_entity_id)

    if hass.states.get(panel_entity_id) is None:
        _LOGGER.warning(
            "LED Status Panel: entité '%s' pas encore disponible. Les LEDs se mettront à jour à la connexion.",
            panel_entity_id,
        )

    service_not_found_logged = [False]
    unsubs: list[Any] = []
    panel_unsub: Any = None

    async def _call_set_led_with_retry(service_data: dict, led_idx: int, service_name: str) -> None:
        """Call set_led with retries when ESPHome starts after the integration.
        service_name is the per-device name (e.g. led_status_panel_2_set_led)."""
        from homeassistant.exceptions import HomeAssistantError  # noqa: PLC0415

        for attempt in range(SET_LED_RETRY_COUNT):
            try:
                await hass.services.async_call(
                    SERVICE_DOMAIN_ESPHOME,
                    service_name,
                    service_data,
                    blocking=True,
                )
                return
            except ServiceNotFound:
                if attempt < SET_LED_RETRY_COUNT - 1:
                    await asyncio.sleep(SET_LED_RETRY_DELAY)
                else:
                    if not service_not_found_logged[0]:
                        service_not_found_logged[0] = True
                        _LOGGER.warning(
                            "LED Status Panel: service %s non trouvé (ESPHome pas prêt ?). "
                            "Les LEDs se mettront à jour au prochain changement d'état ou après reconnexion.",
                            service_name,
                        )
            except HomeAssistantError as err:
                # ESPHome connection not ready yet (e.g. after integration reload)
                if attempt < SET_LED_RETRY_COUNT - 1:
                    _LOGGER.debug(
                        "LED Status Panel: connexion ESPHome pas prête, retry %d/%d (led_index=%s)",
                        attempt + 1,
                        SET_LED_RETRY_COUNT,
                        led_idx,
                    )
                    await asyncio.sleep(SET_LED_RETRY_DELAY)
                else:
                    _LOGGER.warning(
                        "LED Status Panel: échec set_led après %d tentatives (led_index=%s): %s",
                        SET_LED_RETRY_COUNT,
                        led_idx,
                        err,
                    )
            except Exception as err:
                _LOGGER.exception(
                    "LED Status Panel: échec set_led (led_index=%s): %s",
                    led_idx,
                    err,
                )
                return

    @callback
    def _on_state_changed(event: Event) -> None:
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
                    entity_id,
                    state_str,
                )
                continue
            led_list = assignment.get("leds", [])
            _LOGGER.info(
                "LED Status Panel: %s = %s → règle « %s » → %d LED(s)",
                entity_id,
                state_str,
                rule_result.get("condition", ""),
                len(led_list),
            )
            color_hex = rule_result.get("color", "#000000")
            behavior_str = rule_result.get("behavior", "solid")
            behavior_int = BEHAVIOR_TO_INT.get(behavior_str, 1)
            importance = assignment.get("importance", "medium")
            brightness = IMPORTANCE_BRIGHTNESS.get(importance, 30)
            r, g, b = _hex_to_rgb(color_hex)
            if behavior_str == "off":
                r, g, b, brightness = 0, 0, 0, 0

            for led_spec in led_list:
                panel = led_spec.get("panel", 0)
                row = led_spec.get("row", 0)
                col = led_spec.get("col", 0)
                idx = _panel_layout_to_index(
                    panel, row, col, panels, layout, panel_options
                )
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
                hass.async_create_task(_call_set_led_with_retry(service_data, idx, service_name))

    def _apply_initial_states() -> None:
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

    @callback
    def _panel_became_available(event: Event) -> None:
        """Re-apply all entity states whenever the ESPHome panel reconnects.

        ESPHome resets all LEDs to off when it reconnects. We need to re-send
        every LED state so the panel reflects the current HA entity states.
        This fires every time the panel goes unavailable → available, which covers:
        - Initial HA boot (ESPHome connects after integration loads)
        - ESPHome reboot / network reconnection
        - Integration reload
        """
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")
        old_str = old_state.state if old_state else "unavailable"
        new_str = new_state.state if new_state else "unavailable"
        if old_str == "unavailable" and new_str != "unavailable":
            _LOGGER.info(
                "LED Status Panel: panneau '%s' de nouveau disponible — ré-application de tous les états",
                panel_entity_id,
            )
            _apply_initial_states()

    for assignment in assignments:
        entity_id = assignment.get("entity_id")
        if entity_id:
            unsubs.append(
                async_track_state_change_event(hass, entity_id, _on_state_changed)
            )
    unsubs.append(
        async_track_state_change_event(hass, panel_entity_id, _panel_became_available)
    )

    # Fallback: also apply after a delay in case the panel was already available
    # when the integration loaded (no state change event would have fired).
    async def _apply_initial_states_delayed() -> None:
        await asyncio.sleep(10)
        _apply_initial_states()

    hass.async_create_task(_apply_initial_states_delayed())

    entity_ids = list({a.get("entity_id") for a in assignments if a.get("entity_id")})
    _LOGGER.info(
        "LED Status Panel: prêt — écoute %s entité(s): %s",
        len(entity_ids),
        ", ".join(entity_ids) if entity_ids else "(aucune)",
    )

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"unsubs": unsubs}
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    data = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if not data:
        return True
    for unsub in data.get("unsubs", []):
        if callable(unsub):
            try:
                unsub()
            except ValueError:
                # Listener already removed (e.g. panel became available and self-unsubbed)
                pass
    return True
