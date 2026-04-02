/**
 * JS port of _evaluate_rules from custom_components/led_status_panel/__init__.py
 * Returns the first matching rule object, or null.
 *
 * SYNC: keep in sync with __init__.py _evaluate_rules
 */

function tryFloat(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (s === "") return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function cmp(lhs, op, rhsRaw) {
  rhsRaw = (rhsRaw || "").trim();
  const lhsNum = tryFloat(lhs);
  const rhsNum = tryFloat(rhsRaw);

  if (lhsNum !== null && rhsNum !== null) {
    if (op === "==") return lhsNum === rhsNum;
    if (op === "!=") return lhsNum !== rhsNum;
    if (op === "<")  return lhsNum < rhsNum;
    if (op === "<=") return lhsNum <= rhsNum;
    if (op === ">")  return lhsNum > rhsNum;
    if (op === ">=") return lhsNum >= rhsNum;
    return false;
  }

  const lhsStr = lhs === null || lhs === undefined ? "" : String(lhs).trim();
  if (op === "==") return lhsStr === rhsRaw;
  if (op === "!=") return lhsStr !== rhsRaw;
  return false;
}

const OPS = ["<=", ">=", "==", "!=", "<", ">", "="];

export function evaluateRules(state, attributes, rules) {
  for (const rule of rules || []) {
    const cond = rule.condition || "";

    if (cond === "unavailable" && state === "unavailable") return rule;
    if (cond === "default") return rule;
    if (state === "unavailable") continue;

    if (cond.startsWith("attribute.")) {
      const rest = cond.slice("attribute.".length).trim();
      let matched = false;
      for (const op of OPS) {
        if (rest.includes(op)) {
          const [key, rhs] = rest.split(op, 2);
          const k = key.trim();
          const r = rhs.trim();
          if (!k) break;
          if (!(k in (attributes || {}))) break;
          const opCmp = op === "=" ? "==" : op;
          if (cmp((attributes || {})[k], opCmp, r)) return rule;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // bare attribute name — truthy check
        const k = rest.trim();
        if (k && (attributes || {})[k] != null) return rule;
      }
      continue;
    }

    // state comparison: strip leading "state" keyword
    let s = cond.trim();
    if (s.startsWith("state")) s = s.slice("state".length).trim();

    for (const op of OPS) {
      if (s.includes(op)) {
        const [, rhs] = s.split(op, 2);
        const opCmp = op === "=" ? "==" : op;
        if (cmp(state, opCmp, rhs.trim())) return rule;
        break;
      }
    }
  }
  return null;
}

/**
 * Given an assignment and hass.states, return the matching rule (or null).
 */
export function evaluateAssignment(assignment, hassStates) {
  const entityId = assignment.entity_id;
  if (!entityId) return null;
  const stateObj = hassStates[entityId];
  const state = stateObj ? stateObj.state : "unavailable";
  const attributes = stateObj ? stateObj.attributes || {} : {};
  return evaluateRules(state, attributes, assignment.rules || []);
}
