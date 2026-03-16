# ESPHome external component: led_status_panel
# Per-LED state, set_led API service, behaviors (solid, blink_fast, blink_slow, pulse, off)

import esphome.config_validation as cv
import esphome.codegen as cg
from esphome.components import light, api
from esphome.const import CONF_ID, CONF_NUM_LEDS

CODEOWNERS = ["@djiesr"]
DEPENDENCIES = ["api", "light"]

CONF_LIGHT_ID = "light_id"

# ESPHome 2026 may export api helpers in api or in custom_api_device submodule
_api_dev = None
try:
    from esphome.components.api import custom_api_device as _api_dev
except ImportError:
    pass

def _attr(m, name, alt=None):
    return getattr(m, name, None) or (getattr(m, alt, None) if alt else None)

_CustomAPIDevice = _attr(_api_dev or api, "CustomAPIDevice") or _attr(api, "CustomAPIDevice")
_API_DEVICE_SCHEMA = _attr(_api_dev or api, "API_DEVICE_SCHEMA", "api_device_schema") or _attr(api, "API_DEVICE_SCHEMA", "api_device_schema")
_register_api_device = _attr(_api_dev or api, "register_api_device") or _attr(api, "register_api_device")

if _CustomAPIDevice is None and _api_dev is not None:
    _CustomAPIDevice = getattr(_api_dev, "CustomAPIDevice", None)
if _CustomAPIDevice is None:
    api_ns = cg.esphome_ns.namespace("api")
    _CustomAPIDevice = api_ns.class_("CustomAPIDevice")

led_status_panel_ns = cg.esphome_ns.namespace("led_status_panel")
LedStatusPanel = led_status_panel_ns.class_(
    "LedStatusPanel", cg.Component, _CustomAPIDevice
)

_base_schema = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(LedStatusPanel),
        cv.Required(CONF_LIGHT_ID): cv.use_id(light.LightState),
        cv.Optional(CONF_NUM_LEDS, default=64): cv.int_range(1, 512),
    }
).extend(cv.COMPONENT_SCHEMA)
CONFIG_SCHEMA = _base_schema.extend(_API_DEVICE_SCHEMA) if _API_DEVICE_SCHEMA else _base_schema


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    _register = _register_api_device or getattr(api, "register_api_device", None)
    if _register is not None:
        await _register(var)

    light_var = await cg.get_variable(config[CONF_LIGHT_ID])
    cg.add(var.set_light(light_var))
    cg.add(var.set_num_leds(config[CONF_NUM_LEDS]))
