/**
 * Color and brightness utilities.
 */

export const IMPORTANCE_BRIGHTNESS = { low: 15, medium: 30, high: 100 };

export const BEHAVIORS = ["solid", "blink_fast", "blink_slow", "pulse", "off"];

export const DEFAULT_TEMPLATES = [
  {
    id: "batterie",
    name: "Batterie",
    importance: "medium",
    rules: [
      { condition: "state >= 50", color: "#00FF00", behavior: "solid" },
      { condition: "state >= 10", color: "#FFFF00", behavior: "solid" },
      { condition: "state >= 1",  color: "#FF0000", behavior: "solid" },
      { condition: "default",     color: "#FF0000", behavior: "pulse"  },
    ],
  },
  {
    id: "on_off",
    name: "On/Off",
    importance: "medium",
    rules: [
      { condition: "state == on",  color: "#00FF00", behavior: "solid" },
      { condition: "default",      color: "#333333", behavior: "solid" },
    ],
  },
  {
    id: "unavailable_alert",
    name: "Alerte indisponible",
    importance: "high",
    rules: [
      { condition: "unavailable", color: "#FF6600", behavior: "blink_fast" },
      { condition: "default",     color: "#00FF00", behavior: "solid"      },
    ],
  },
];

/**
 * Apply brightness to a hex color (#RRGGBB) and return a CSS rgba string.
 * brightness is 0-100.
 */
export function applyBrightness(hex, brightness) {
  const b = Math.max(0, Math.min(100, brightness)) / 100;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const bl = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * b)},${Math.round(g * b)},${Math.round(bl * b)})`;
}

/**
 * Given an assignment, return the "default display color" for the grid:
 * - Use the first matching rule color (from config, not live state)
 * - Apply importance brightness
 */
export function assignmentDisplayColor(assignment) {
  const rules = assignment.rules || [];
  const rule = rules.find((r) => r.condition === "default") || rules[0];
  if (!rule || rule.behavior === "off") return "#1a1a1a";
  const brightness = IMPORTANCE_BRIGHTNESS[assignment.importance] ?? 30;
  return applyBrightness(rule.color || "#ffffff", brightness);
}

/**
 * Given a matched rule and importance, return the live display color.
 */
export function ruleDisplayColor(rule, importance) {
  if (!rule || rule.behavior === "off") return "#1a1a1a";
  const brightness = IMPORTANCE_BRIGHTNESS[importance] ?? 30;
  return applyBrightness(rule.color || "#ffffff", brightness);
}
