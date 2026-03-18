"""
Config flow for LED Status Panel integration.
Configuration via the Integrations menu (no YAML).
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector
from homeassistant.helpers.typing import VolDictType

from .const import CONF_CONFIG_FILE, CONF_ENTITY_ID, DOMAIN

_LOGGER = logging.getLogger(__name__)

CONF_STEP_USER_SCHEMA: VolDictType = {
    vol.Required(CONF_CONFIG_FILE, default="led_panel_config.json"): str,
    vol.Required(CONF_ENTITY_ID): selector.EntitySelector(
        selector.EntitySelectorConfig(domain=["light"])
    ),
}


async def _ensure_config_file(hass: HomeAssistant, path: str) -> bool:
    """Ensure config file exists; if missing create minimal valid JSON, else validate JSON."""
    from pathlib import Path

    p_in = Path(path)
    p = p_in if p_in.is_absolute() else (Path(hass.config.config_dir) / p_in)

    if not p.exists():
        try:
            import json

            minimal = {
                "panels": 1,
                "panel_options": [
                    {"flip_h": False, "flip_v": False, "layout": "zigzag_h"}
                ],
                "assignments": [],
            }
            await hass.async_add_executor_job(_write_minimal_json, p, minimal)
            return p.exists()
        except OSError as err:
            return False
    try:
        import json
        ok = await hass.async_add_executor_job(_validate_json_file, p)
        return ok
    except (json.JSONDecodeError, OSError):
        return False


def _write_minimal_json(path: "Path", minimal: dict[str, Any]) -> None:
    import json

    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(minimal, f, ensure_ascii=False, indent=2)
        f.write("\n")
        f.flush()
    tmp.replace(path)


def _validate_json_file(path: "Path") -> bool:
    import json

    try:
        with open(path, encoding="utf-8") as f:
            json.load(f)
        return True
    except (json.JSONDecodeError, OSError):
        return False


class LedStatusPanelConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for LED Status Panel."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        if user_input is not None:
            config_file = user_input.get(CONF_CONFIG_FILE, "").strip()
            entity_id = user_input.get(CONF_ENTITY_ID)
            if isinstance(entity_id, dict):
                entity_id = entity_id.get("entity_id") or ""
            elif isinstance(entity_id, list):
                entity_id = entity_id[0] if entity_id else ""
            entity_id = (entity_id or "").strip()
            if not config_file:
                errors["base"] = "config_file_required"
            elif not entity_id:
                errors["base"] = "entity_required"
            else:
                if not await _ensure_config_file(self.hass, config_file):
                    errors["base"] = "config_file_invalid"
                else:
                    await self.async_set_unique_id(f"{DOMAIN}_{entity_id}")
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(
                        title=f"LED Panel ({entity_id})",
                        data={
                            CONF_CONFIG_FILE: config_file,
                            CONF_ENTITY_ID: entity_id,
                        },
                    )
        schema = self.add_suggested_values_to_schema(
            vol.Schema(CONF_STEP_USER_SCHEMA),
            user_input or {},
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(
        entry: config_entries.ConfigEntry,
    ) -> LedStatusPanelOptionsFlow:
        """Return options flow handler."""
        return LedStatusPanelOptionsFlow(entry)


class LedStatusPanelOptionsFlow(config_entries.OptionsFlow):
    """Options flow to edit config file and entity."""

    def __init__(self, entry: config_entries.ConfigEntry) -> None:
        self._entry = entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Manage options."""
        if user_input is not None:
            import json
            from pathlib import Path

            config_file = user_input.get(CONF_CONFIG_FILE, "").strip()
            entity_id = user_input.get(CONF_ENTITY_ID)
            if isinstance(entity_id, dict):
                entity_id = entity_id.get("entity_id") or ""
            elif isinstance(entity_id, list):
                entity_id = entity_id[0] if entity_id else ""
            entity_id = (entity_id or "").strip()
            errors: dict[str, str] = {}
            if not config_file:
                errors["base"] = "config_file_invalid"
            else:
                ok = await _ensure_config_file(self.hass, config_file)
                if not ok:
                    errors["base"] = "config_file_invalid"
            if not errors:
                self.hass.config_entries.async_update_entry(
                    self._entry,
                    data={
                        CONF_CONFIG_FILE: config_file,
                        CONF_ENTITY_ID: entity_id,
                    },
                )
                return self.async_create_entry(data={})
            return self.async_show_form(
                step_id="init",
                data_schema=vol.Schema({
                    vol.Required(CONF_CONFIG_FILE, default=self._entry.data.get(CONF_CONFIG_FILE, "")): str,
                    vol.Required(CONF_ENTITY_ID, default=self._entry.data.get(CONF_ENTITY_ID)): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain=["light"])
                    ),
                }),
                errors=errors,
            )
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required(CONF_CONFIG_FILE, default=self._entry.data.get(CONF_CONFIG_FILE, "")): str,
                vol.Required(CONF_ENTITY_ID, default=self._entry.data.get(CONF_ENTITY_ID)): selector.EntitySelector(
                    selector.EntitySelectorConfig(domain=["light"])
                ),
            }),
        )
