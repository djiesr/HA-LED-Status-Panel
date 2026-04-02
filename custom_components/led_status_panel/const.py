"""Constants for LED Status Panel integration."""

DOMAIN = "led_status_panel"

CONF_CONFIG_FILE = "config_file"
CONF_ENTITY_ID = "entity_id"
CONF_PANELS = "panels"

# Per-panel options (stored in JSON panel_options list and config entry)
CONF_PANEL_OPTIONS = "panel_options"
CONF_FLIP_H = "flip_h"
CONF_FLIP_V = "flip_v"
CONF_LAYOUT = "layout"  # "zigzag_h" | "zigzag_v"

DEFAULT_PANELS = 1
DEFAULT_LAYOUT = "zigzag_h"
DEFAULT_FLIP_H = False
DEFAULT_FLIP_V = False

# Start corner → (flip_h, flip_v)
PANEL_START_FLIPS: dict[str, dict[str, bool]] = {
    "top_left":     {"flip_h": False, "flip_v": False},
    "top_right":    {"flip_h": True,  "flip_v": False},
    "bottom_left":  {"flip_h": False, "flip_v": True},
    "bottom_right": {"flip_h": True,  "flip_v": True},
}

def panel_ui_to_options(start: str, direction: str) -> dict:
    """Convert UI start corner + direction to internal panel_options dict."""
    flips = PANEL_START_FLIPS.get(start, {"flip_h": False, "flip_v": False})
    return {"flip_h": flips["flip_h"], "flip_v": flips["flip_v"], "layout": direction}

def panel_options_to_ui(opts: dict) -> tuple[str, str]:
    """Convert internal panel_options dict back to (start, direction) for UI."""
    flip_h = opts.get("flip_h", False)
    flip_v = opts.get("flip_v", False)
    for start, flips in PANEL_START_FLIPS.items():
        if flips["flip_h"] == flip_h and flips["flip_v"] == flip_v:
            return start, opts.get("layout", DEFAULT_LAYOUT)
    return "top_left", opts.get("layout", DEFAULT_LAYOUT)

# Importance -> brightness percent (low=15%, medium=30%, high=100%)
IMPORTANCE_BRIGHTNESS = {
    "low": 15,
    "medium": 30,
    "high": 100,
}

# ESPHome custom service: each device registers esphome.<device_name>_set_led.
# Base name for derivation from entity_id (object_id suffix used to extract device name).
SERVICE_SET_LED_SUFFIX = "set_led"
# Typical entity object_id suffix for the panel light (device_name + "_" + this).
ENTITY_OBJECT_ID_SUFFIX = "led_status_panel"

# Behavior string -> int for ESPHome (ESP8266 avoids string in service args)
# 0=off, 1=solid, 2=blink_fast, 3=blink_slow, 4=pulse
BEHAVIOR_TO_INT = {
    "off": 0,
    "solid": 1,
    "blink_fast": 2,
    "blink_slow": 3,
    "pulse": 4,
}
