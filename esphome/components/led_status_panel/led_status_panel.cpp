#include "led_status_panel.h"
#include "esphome/core/log.h"
#include "esphome/core/helpers.h"
#include <cmath>

namespace esphome {
namespace led_status_panel {

static const char *const TAG = "led_status_panel";

void LedStatusPanel::setup() {
  this->register_service(
      &LedStatusPanel::on_set_led, "set_led",
      {"led_index", "red", "green", "blue", "brightness", "behavior"});
  ESP_LOGCONFIG(TAG, "led_status_panel: %d LEDs, set_led service registered", num_leds_);
}

void LedStatusPanel::on_set_led(int led_index, int red, int green, int blue,
                                int brightness, int behavior) {
  if (led_index < 0 || led_index >= num_leds_ || led_index >= MAX_LEDS) {
    ESP_LOGW(TAG, "set_led: index %d out of range [0, %d)", led_index, num_leds_);
    return;
  }
  LedState &s = leds_[led_index];
  s.red = (uint8_t) clamp(red, 0, 255);
  s.green = (uint8_t) clamp(green, 0, 255);
  s.blue = (uint8_t) clamp(blue, 0, 255);
  s.brightness = (uint8_t) clamp(brightness, 0, 100);
  if (behavior >= BEHAVIOR_OFF && behavior <= BEHAVIOR_PULSE) {
    s.behavior = (uint8_t) behavior;
  } else {
    s.behavior = BEHAVIOR_SOLID;
  }
}

void LedStatusPanel::loop() {
  uint32_t now = millis();
  if (now - last_update_ < 25) return;  // ~40 fps
  last_update_ = now;
  update_strip_();
}

void LedStatusPanel::update_strip_() {
  if (light_ == nullptr) return;
  auto *out = light_->get_output();
  if (out == nullptr) return;
  auto *strip = static_cast<light::AddressableLight *>(out);
  if (strip == nullptr) return;

  uint32_t t = millis();
  int n = (num_leds_ < strip->size()) ? num_leds_ : strip->size();

  for (int i = 0; i < n; i++) {
    const LedState &s = leds_[i];
    float r = s.red / 255.0f, g = s.green / 255.0f, b = s.blue / 255.0f;
    float bright = s.brightness / 100.0f;

    switch (s.behavior) {
      case BEHAVIOR_OFF:
        bright = 0.0f;
        break;
      case BEHAVIOR_SOLID:
        break;
      case BEHAVIOR_BLINK_FAST:
        bright *= ((t / 125) % 2 == 0) ? 1.0f : 0.0f;
        break;
      case BEHAVIOR_BLINK_SLOW:
        bright *= ((t / 500) % 2 == 0) ? 1.0f : 0.0f;
        break;
      case BEHAVIOR_PULSE: {
        float phase = (t % 2000) / 2000.0f * 2.0f * 3.14159f;
        bright *= 0.3f + 0.7f * (0.5f + 0.5f * sinf(phase));
        break;
      }
      default:
        break;
    }

    r *= bright;
    g *= bright;
    b *= bright;
    strip->get(i).set_rgb((uint8_t)(r * 255), (uint8_t)(g * 255), (uint8_t)(b * 255));
  }

  strip->schedule_show();
}

}  // namespace led_status_panel
}  // namespace esphome
