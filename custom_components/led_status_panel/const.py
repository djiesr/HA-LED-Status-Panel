"""Constants for LED Status Panel integration."""

DOMAIN = "led_status_panel"

CONF_CONFIG_FILE = "config_file"
CONF_ENTITY_ID = "entity_id"

DEFAULT_PANELS = 1
DEFAULT_LAYOUT = "zigzag_h"

# Importance -> brightness percent (low=15%, medium=30%, high=100%)
IMPORTANCE_BRIGHTNESS = {
    "low": 15,
    "medium": 30,
    "high": 100,
}

# ESPHome custom service name (as registered in firmware).
# If you rename the service in the ESPHome component, update this constant to match.
# Renaming does not add a device selector; with one panel, no target is needed.
SERVICE_SET_LED = "led_status_panel_set_led"

# Behavior string -> int for ESPHome (ESP8266 avoids string in service args)
# 0=off, 1=solid, 2=blink_fast, 3=blink_slow, 4=pulse
BEHAVIOR_TO_INT = {
    "off": 0,
    "solid": 1,
    "blink_fast": 2,
    "blink_slow": 3,
    "pulse": 4,
}
