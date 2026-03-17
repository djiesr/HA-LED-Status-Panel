"""Constants for LED Status Panel integration."""

DOMAIN = "led_status_panel"

CONF_CONFIG_FILE = "config_file"
CONF_ENTITY_ID = "entity_id"

# Per-panel options (stored in JSON panel_options list)
CONF_PANEL_OPTIONS = "panel_options"
CONF_FLIP_H = "flip_h"
CONF_FLIP_V = "flip_v"
CONF_LAYOUT = "layout"  # "zigzag_h" | "zigzag_v"

DEFAULT_PANELS = 1
DEFAULT_LAYOUT = "zigzag_h"
DEFAULT_FLIP_H = False
DEFAULT_FLIP_V = False

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
