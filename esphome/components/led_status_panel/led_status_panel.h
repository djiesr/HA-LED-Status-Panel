#pragma once

#include "esphome/core/component.h"
#include "esphome/components/api/custom_api_device.h"
#include "esphome/components/light/light_state.h"
#include "esphome/components/light/addressable_light.h"

namespace esphome {
namespace led_status_panel {

static constexpr int MAX_LEDS = 256;
static constexpr int BEHAVIOR_OFF = 0;
static constexpr int BEHAVIOR_SOLID = 1;
static constexpr int BEHAVIOR_BLINK_FAST = 2;
static constexpr int BEHAVIOR_BLINK_SLOW = 3;
static constexpr int BEHAVIOR_PULSE = 4;

struct LedState {
  uint8_t red{0};
  uint8_t green{0};
  uint8_t blue{0};
  uint8_t brightness{100};
  uint8_t behavior{BEHAVIOR_OFF};
};

class LedStatusPanel : public Component, public api::CustomAPIDevice {
 public:
  void set_light(light::LightState *light) { light_ = light; }
  void set_num_leds(int n) { num_leds_ = n; }

  void setup() override;
  void loop() override;

  void on_set_led(int led_index, int red, int green, int blue, int brightness, int behavior);

 protected:
  void update_strip_();

  light::LightState *light_{nullptr};
  int num_leds_{64};
  LedState leds_[MAX_LEDS];
  uint32_t last_update_{0};
};

}  // namespace led_status_panel
}  // namespace esphome
