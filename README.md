# HA-LED-Status-Panel

Physical LED panels (8×8 WS281x) that display Home Assistant entity status at a glance. Configurable via a web editor; driven by a Home Assistant custom component and ESPHome firmware.

**Repository:** [github.com/djiesr/HA-LED-Status-Panel](https://github.com/djiesr/HA-LED-Status-Panel)

## Structure

| Folder | Description |
|--------|-------------|
| [esphome/](esphome/) | ESP8266 (D1 mini) firmware: WS281x strip, custom `set_led` service, behaviors (solid, blink, pulse). |
| [custom_component/](custom_component/) | Home Assistant integration: load JSON config, listen to entities, evaluate rules, call ESPHome service. |
| [web-editor/](web-editor/) | React web app: visual 8×8 grid, assign entities and rules, export/import JSON. i18n EN/FR. |
| [documentation/](documentation/) | Concept, project tracking, and user docs. |

## Requirements

- **Hardware:** ESP8266 D1 mini, 1–3× 8×8 WS281x panels.
- **Home Assistant:** 2026.3 or newer.
- **ESPHome:** compatible with ESPHome 2024.x (native API).

## Quick start

1. **Firmware:** Copy [esphome/](esphome/) config, set WiFi and pin, flash via ESPHome (Dashboard or CLI).
2. **HA integration:** Install [custom_component/](custom_component/) as a custom integration, add your JSON config (from the editor).
3. **Editor:** Run [web-editor/](web-editor/) locally, configure panels and assignments, export JSON.

See [documentation/](documentation/) for the concept and [documentation/PROJECT_TRACKING.md](documentation/PROJECT_TRACKING.md) for development status.

## License

MIT — open and free to use.
