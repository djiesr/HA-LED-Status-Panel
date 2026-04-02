"""HTTP API endpoints for LED Status Panel.

Home Assistant core does not expose generic file read/write APIs for security reasons.
This integration provides a small, scoped endpoint to read/write the JSON config file
used by this integration, within the HA config directory.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def _resolve_path(hass: HomeAssistant, raw_path: str) -> Path:
    """Resolve a user-provided path inside HA config dir.

    Only allows paths within hass.config.config_dir. Absolute paths are rejected.
    """
    raw_path = (raw_path or "").strip()
    if not raw_path:
        raise ValueError("path is required")
    p = Path(raw_path)
    if p.is_absolute():
        raise ValueError("absolute paths are not allowed")

    base = Path(hass.config.config_dir).resolve()
    target = (base / p).resolve()
    # Ensure target stays inside the config directory
    try:
        target.relative_to(base)
    except ValueError as err:
        raise ValueError("path escapes config directory") from err

    # Soft restriction: encourage JSON configs only
    if target.suffix.lower() != ".json":
        raise ValueError("only .json files are allowed")
    return target


def _read_json_sync(path: Path) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _write_json_sync(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


class LedStatusPanelFileView(HomeAssistantView):
    """Read/write the editor JSON config file."""

    url = "/api/led_status_panel/config"
    name = "api:led_status_panel:config"
    requires_auth = True

    async def get(self, request):
        hass: HomeAssistant = request.app["hass"]
        raw_path = request.query.get("path", "led_panel_config.json")
        try:
            path = _resolve_path(hass, raw_path)
        except ValueError as err:
            return self.json({"ok": False, "error": str(err)}, status_code=400)

        if not path.exists():
            return self.json({"ok": False, "error": "file_not_found", "path": str(path)}, status_code=404)

        try:
            data = await hass.async_add_executor_job(_read_json_sync, path)
        except json.JSONDecodeError:
            return self.json({"ok": False, "error": "invalid_json", "path": str(path)}, status_code=422)
        except OSError as err:
            _LOGGER.exception("Failed to read config %s: %s", path, err)
            return self.json({"ok": False, "error": "read_error"}, status_code=500)

        return self.json({"ok": True, "path": str(path), "data": data})

    async def post(self, request):
        hass: HomeAssistant = request.app["hass"]
        raw_path = request.query.get("path", "led_panel_config.json")
        try:
            path = _resolve_path(hass, raw_path)
        except ValueError as err:
            return self.json({"ok": False, "error": str(err)}, status_code=400)

        try:
            body = await request.json()
        except Exception:
            return self.json({"ok": False, "error": "invalid_request_body"}, status_code=400)

        # Accept either {data: {...}} or direct JSON payload
        payload = body.get("data") if isinstance(body, dict) and "data" in body else body
        if payload is None:
            return self.json({"ok": False, "error": "missing_data"}, status_code=400)

        try:
            await hass.async_add_executor_job(_write_json_sync, path, payload)
        except OSError as err:
            _LOGGER.exception("Failed to write config %s: %s", path, err)
            return self.json({"ok": False, "error": "write_error"}, status_code=500)

        return self.json({"ok": True, "path": str(path)})


class LedStatusPanelInfoView(HomeAssistantView):
    """Resolve config_path from a panel_code (light entity_id).

    The Lovelace card uses panel_code (e.g. light.bureau_led_status_panel) to
    find the config entry and obtain the config file path, without the user
    having to know the raw file path.
    """

    url = "/api/led_status_panel/panel"
    name = "api:led_status_panel:panel"
    requires_auth = True

    async def get(self, request):
        hass: HomeAssistant = request.app["hass"]
        panel_code = (request.query.get("panel_code") or "").strip()
        if not panel_code:
            return self.json({"ok": False, "error": "panel_code_required"}, status_code=400)

        for entry in hass.config_entries.async_entries(DOMAIN):
            if entry.data.get("entity_id") == panel_code:
                config_path = entry.data.get("config_file", "")
                return self.json({
                    "ok": True,
                    "config_path": config_path,
                    "panel_code": panel_code,
                    "entry_id": entry.entry_id,
                })

        return self.json({"ok": False, "error": "panel_not_found"}, status_code=404)


class LedStatusPanelReloadView(HomeAssistantView):
    """Reload a config entry by entry_id or config_path."""

    url = "/api/led_status_panel/reload"
    name = "api:led_status_panel:reload"
    requires_auth = True

    async def post(self, request):
        hass: HomeAssistant = request.app["hass"]
        try:
            body = await request.json()
        except Exception:
            return self.json({"ok": False, "error": "invalid_body"}, status_code=400)

        entry_id = (body.get("entry_id") or "").strip()

        # Resolve entry_id from config_path if not provided directly
        if not entry_id:
            config_path = (body.get("config_path") or "").strip()
            for entry in hass.config_entries.async_entries(DOMAIN):
                if entry.data.get("config_file", "") == config_path:
                    entry_id = entry.entry_id
                    break

        if not entry_id:
            return self.json({"ok": False, "error": "entry_not_found"}, status_code=404)

        entry = hass.config_entries.async_get_entry(entry_id)
        if not entry:
            return self.json({"ok": False, "error": "entry_not_found"}, status_code=404)

        await hass.config_entries.async_reload(entry_id)
        _LOGGER.info("LED Status Panel: config entry %s rechargée via API", entry_id)
        return self.json({"ok": True, "entry_id": entry_id})


async def async_register_http_views(hass: HomeAssistant) -> None:
    """Register HTTP views for this integration."""
    hass.http.register_view(LedStatusPanelFileView)
    hass.http.register_view(LedStatusPanelInfoView)
    hass.http.register_view(LedStatusPanelReloadView)
    _LOGGER.debug("%s HTTP API registered", DOMAIN)

