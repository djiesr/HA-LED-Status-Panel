/**
 * JS port of _panel_layout_to_index from custom_components/led_status_panel/__init__.py
 * Maps (panel, row, col) → linear LED index (0-based).
 * One panel = 8x8 = 64 LEDs.
 */
export function panelLayoutToIndex(panel, row, col, panelOptions = []) {
  if (row < 0 || row > 7 || col < 0 || col > 7) return -1;

  const opts = panelOptions[panel] || {};
  const flipH = opts.flip_h || false;
  const flipV = opts.flip_v || false;
  const layout = opts.layout || "zigzag_h";

  let r = row;
  let c = col;
  if (flipH) c = 7 - c;
  if (flipV) r = 7 - r;

  let idx;
  if (layout === "zigzag_h") {
    idx = r % 2 === 0 ? r * 8 + c : r * 8 + (7 - c);
  } else if (layout === "zigzag_v") {
    idx = c % 2 === 0 ? c * 8 + r : c * 8 + (7 - r);
  } else {
    idx = r * 8 + c;
  }

  return panel * 64 + idx;
}

/**
 * Given a config, build a Map keyed by "panel-row-col" → assignment.
 * Useful for fast lookup when rendering the grid.
 */
export function buildLedMap(assignments) {
  const map = new Map();
  for (const assignment of assignments || []) {
    for (const led of assignment.leds || []) {
      const key = `${led.panel}-${led.row}-${led.col}`;
      // An LED can only belong to one assignment; last write wins.
      map.set(key, assignment);
    }
  }
  return map;
}
