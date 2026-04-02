"""
Config flow for LED Status Panel integration.
Multi-step: config file → number of panels → per-panel orientation.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector

from .const import (
    CONF_CONFIG_FILE,
    CONF_ENTITY_ID,
    CONF_PANEL_OPTIONS,
    CONF_PANELS,
    DOMAIN,
    panel_options_to_ui,
    panel_ui_to_options,
)

_LOGGER = logging.getLogger(__name__)

DIRECTIONS = [
    selector.SelectOptionDict(value="zigzag_h", label="Horizontal (rangées)"),
    selector.SelectOptionDict(value="zigzag_v", label="Vertical (colonnes)"),
]

START_CORNERS = [
    selector.SelectOptionDict(value="top_left",     label="↘ Haut-gauche"),
    selector.SelectOptionDict(value="top_right",    label="↙ Haut-droite"),
    selector.SelectOptionDict(value="bottom_left",  label="↗ Bas-gauche"),
    selector.SelectOptionDict(value="bottom_right", label="↖ Bas-droite"),
]


def _panel_schema(start_default: str = "top_left", dir_default: str = "zigzag_h") -> vol.Schema:
    return vol.Schema({
        vol.Required("start", default=start_default): selector.SelectSelector(
            selector.SelectSelectorConfig(options=START_CORNERS, mode=selector.SelectSelectorMode.LIST)
        ),
        vol.Required("direction", default=dir_default): selector.SelectSelector(
            selector.SelectSelectorConfig(options=DIRECTIONS, mode=selector.SelectSelectorMode.LIST)
        ),
    })


async def _ensure_config_file(hass: HomeAssistant, path: str) -> bool:
    """Ensure config file exists and is valid JSON; create minimal file if missing."""
    p = Path(path) if Path(path).is_absolute() else Path(hass.config.config_dir) / path
    if not p.exists():
        try:
            minimal = {"panels": 1, "panel_options": [{"flip_h": False, "flip_v": False, "layout": "zigzag_h"}], "assignments": []}
            await hass.async_add_executor_job(_write_json, p, minimal)
            return True
        except OSError:
            return False
    try:
        return await hass.async_add_executor_job(_validate_json, p)
    except Exception:
        return False


def _write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    tmp.replace(path)


def _validate_json(path: Path) -> bool:
    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
        return True
    except (json.JSONDecodeError, OSError):
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Config flow (initial setup)
# ─────────────────────────────────────────────────────────────────────────────

class LedStatusPanelConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self._current_panel: int = 0

    async def async_step_user(self, user_input: dict | None = None) -> FlowResult:
        """Step 1: config file + ESPHome entity."""
        errors: dict[str, str] = {}
        if user_input is not None:
            config_file = user_input.get(CONF_CONFIG_FILE, "").strip()
            entity_id = _extract_entity_id(user_input.get(CONF_ENTITY_ID))
            if not config_file:
                errors["base"] = "config_file_required"
            elif not entity_id:
                errors["base"] = "entity_required"
            elif not await _ensure_config_file(self.hass, config_file):
                errors["base"] = "config_file_invalid"
            else:
                await self.async_set_unique_id(f"{DOMAIN}_{entity_id}")
                self._abort_if_unique_id_configured()
                self._data = {CONF_CONFIG_FILE: config_file, CONF_ENTITY_ID: entity_id}
                return await self.async_step_panels()

        schema = vol.Schema({
            vol.Required(CONF_CONFIG_FILE, default=self._data.get(CONF_CONFIG_FILE, "led_panel_config.json")): str,
            vol.Required(CONF_ENTITY_ID): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["light"])
            ),
        })
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def async_step_panels(self, user_input: dict | None = None) -> FlowResult:
        """Step 2: number of panels."""
        if user_input is not None:
            self._data[CONF_PANELS] = int(user_input[CONF_PANELS])
            self._data[CONF_PANEL_OPTIONS] = []
            self._current_panel = 0
            return await self.async_step_panel_config()

        schema = vol.Schema({
            vol.Required(CONF_PANELS, default=1): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[
                        selector.SelectOptionDict(value="1", label="1 panneau (8×8)"),
                        selector.SelectOptionDict(value="2", label="2 panneaux (16×8)"),
                        selector.SelectOptionDict(value="3", label="3 panneaux (24×8)"),
                    ],
                    mode=selector.SelectSelectorMode.LIST,
                )
            ),
        })
        return self.async_show_form(step_id="panels", data_schema=schema)

    async def async_step_panel_config(self, user_input: dict | None = None) -> FlowResult:
        """Step 3+: orientation for each panel."""
        if user_input is not None:
            opts = panel_ui_to_options(user_input["start"], user_input["direction"])
            self._data[CONF_PANEL_OPTIONS].append(opts)
            self._current_panel += 1
            if self._current_panel < self._data[CONF_PANELS]:
                return await self.async_step_panel_config()
            return self.async_create_entry(
                title=f"LED Panel ({self._data[CONF_ENTITY_ID]})",
                data=self._data,
            )

        panel_num = self._current_panel + 1
        total = self._data.get(CONF_PANELS, 1)
        schema = _panel_schema()
        return self.async_show_form(
            step_id="panel_config",
            data_schema=schema,
            description_placeholders={
                "panel": str(panel_num),
                "total": str(total),
            },
            last_step=(panel_num == total),
        )

    @staticmethod
    @callback
    def async_get_options_flow(entry: config_entries.ConfigEntry) -> LedStatusPanelOptionsFlow:
        return LedStatusPanelOptionsFlow(entry)


# ─────────────────────────────────────────────────────────────────────────────
# Options flow (reconfigure)
# ─────────────────────────────────────────────────────────────────────────────

class LedStatusPanelOptionsFlow(config_entries.OptionsFlow):

    def __init__(self, entry: config_entries.ConfigEntry) -> None:
        self._entry = entry
        self._data: dict[str, Any] = {}
        self._current_panel: int = 0

    async def async_step_init(self, user_input: dict | None = None) -> FlowResult:
        """Step 1: config file + entity."""
        errors: dict[str, str] = {}
        current = self._entry.data
        if user_input is not None:
            config_file = user_input.get(CONF_CONFIG_FILE, "").strip()
            entity_id = _extract_entity_id(user_input.get(CONF_ENTITY_ID))
            if not config_file:
                errors["base"] = "config_file_required"
            elif not await _ensure_config_file(self.hass, config_file):
                errors["base"] = "config_file_invalid"
            else:
                self._data = {CONF_CONFIG_FILE: config_file, CONF_ENTITY_ID: entity_id}
                return await self.async_step_panels()

        schema = vol.Schema({
            vol.Required(CONF_CONFIG_FILE, default=current.get(CONF_CONFIG_FILE, "led_panel_config.json")): str,
            vol.Required(CONF_ENTITY_ID, default=current.get(CONF_ENTITY_ID)): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["light"])
            ),
        })
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)

    async def async_step_panels(self, user_input: dict | None = None) -> FlowResult:
        """Step 2: number of panels."""
        current_panels = str(self._entry.data.get(CONF_PANELS, 1))
        if user_input is not None:
            self._data[CONF_PANELS] = int(user_input[CONF_PANELS])
            self._data[CONF_PANEL_OPTIONS] = []
            self._current_panel = 0
            return await self.async_step_panel_config()

        schema = vol.Schema({
            vol.Required(CONF_PANELS, default=current_panels): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[
                        selector.SelectOptionDict(value="1", label="1 panneau (8×8)"),
                        selector.SelectOptionDict(value="2", label="2 panneaux (16×8)"),
                        selector.SelectOptionDict(value="3", label="3 panneaux (24×8)"),
                    ],
                    mode=selector.SelectSelectorMode.LIST,
                )
            ),
        })
        return self.async_show_form(step_id="panels", data_schema=schema)

    async def async_step_panel_config(self, user_input: dict | None = None) -> FlowResult:
        """Step 3+: orientation for each panel."""
        existing_opts = self._entry.data.get(CONF_PANEL_OPTIONS, [])
        if user_input is not None:
            opts = panel_ui_to_options(user_input["start"], user_input["direction"])
            self._data[CONF_PANEL_OPTIONS].append(opts)
            self._current_panel += 1
            if self._current_panel < self._data[CONF_PANELS]:
                return await self.async_step_panel_config()
            # Save: update config entry data
            self.hass.config_entries.async_update_entry(self._entry, data={**self._entry.data, **self._data})
            return self.async_create_entry(data={})

        # Pre-fill with existing options for this panel
        p = self._current_panel
        if p < len(existing_opts):
            start, direction = panel_options_to_ui(existing_opts[p])
        else:
            start, direction = "top_left", "zigzag_h"

        panel_num = p + 1
        total = self._data.get(CONF_PANELS, 1)
        schema = _panel_schema(start, direction)
        return self.async_show_form(
            step_id="panel_config",
            data_schema=schema,
            description_placeholders={
                "panel": str(panel_num),
                "total": str(total),
            },
            last_step=(panel_num == total),
        )


def _extract_entity_id(value: Any) -> str:
    if isinstance(value, dict):
        return (value.get("entity_id") or "").strip()
    if isinstance(value, list):
        return (value[0] if value else "").strip()
    return (value or "").strip()
