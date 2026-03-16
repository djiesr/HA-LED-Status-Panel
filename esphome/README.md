# ESPHome firmware — HA-LED-Status-Panel

Firmware for **ESP8266 D1 mini** driving one or more 8×8 WS281x panels.

## Setup

1. Copy `secrets.example.yaml` to `secrets.yaml` and set your WiFi and API encryption key.
2. In `led_status_panel.yaml`, adjust the data pin if needed (default `D4`).
3. Compile and flash with ESPHome (Dashboard or CLI):

   ```bash
   esphome run led_status_panel.yaml
   ```

## Custom component

The `components/led_status_panel` folder contains an external component that:

- Keeps per-LED state (color, brightness, behavior).
- Exposes the **`set_led`** native API service with arguments: `led_index`, `red`, `green`, `blue`, `brightness`, `behavior`.
- Implements behaviors: `solid`, `blink_fast`, `blink_slow`, `pulse`, `off`.
- Updates the addressable light strip every ~40 ms from this state.

Home Assistant (or the custom component) calls the ESPHome native API service to set LEDs; the ESP runs the animations locally.
