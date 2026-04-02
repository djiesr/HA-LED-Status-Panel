import { LitElement, html, css } from "lit";
import { DEFAULT_TEMPLATES } from "../utils/color-utils.js";
import { getT } from "../utils/i18n.js";
import "./rule-row.js";

/**
 * Rules list editor: IF / ELSE IF / ELSE rows + add button + template picker.
 *
 * Props:
 *   rules       — array of { condition, color, behavior }
 *   entityState — { state, attributes } for the current entity (for chips)
 *
 * Dispatches "rules-changed" with { rules } on any change.
 */
export class RulesEditor extends LitElement {
  static properties = {
    rules:       { type: Array },
    entityState: { type: Object },
    hass:        { attribute: false },
  };

  static styles = css`
    :host { display: block; }

    .section-title {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--secondary-text-color, #888);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 12px 0 8px;
    }

    .footer {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .btn-add {
      background: none;
      border: 1px dashed var(--primary-color, #03a9f4);
      border-radius: 4px;
      color: var(--primary-color, #03a9f4);
      padding: 5px 12px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .btn-add:hover { background: var(--secondary-background-color, #1e1e1e); }

    select.template-select {
      background: var(--secondary-background-color, #1e1e1e);
      color: var(--secondary-text-color, #aaa);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 0.82rem;
      cursor: pointer;
    }
  `;

  _getLabel(index, total, t) {
    if (total === 1) return t("rules.if");
    if (index === 0) return t("rules.if");
    if (index === total - 1) return t("rules.else");
    return t("rules.elif");
  }

  /** Build condition chips based on the current entity state. */
  _buildChips() {
    const chips = [];
    const s = this.entityState;

    chips.push({ label: "défaut", value: "default" });
    chips.push({ label: "indisponible", value: "unavailable" });

    if (!s) return chips;

    const stateNum = parseFloat(s.state);
    if (!isNaN(stateNum)) {
      chips.push({ label: `>= ${Math.round(stateNum * 0.75)}`, value: `state >= ${Math.round(stateNum * 0.75)}` });
      chips.push({ label: `<= ${Math.round(stateNum * 0.25)}`, value: `state <= ${Math.round(stateNum * 0.25)}` });
    } else {
      if (s.state !== "unavailable") {
        chips.push({ label: `== ${s.state}`, value: `state == ${s.state}` });
      }
      chips.push({ label: "== on",  value: "state == on"  });
      chips.push({ label: "== off", value: "state == off" });
    }

    // Numeric attributes
    for (const [key, val] of Object.entries(s.attributes || {})) {
      const n = parseFloat(val);
      if (!isNaN(n) && isFinite(n)) {
        chips.push({ label: `attr.${key} >= ${Math.round(n * 0.5)}`, value: `attribute.${key} >= ${Math.round(n * 0.5)}` });
      }
    }

    return chips;
  }

  render() {
    const t = getT(this.hass);
    const rules = this.rules || [];
    const chips = this._buildChips();

    return html`
      <div class="section-title">${t("rules.title")}</div>

      ${rules.map((rule, i) => html`
        <rule-row
          .rule=${rule}
          .hass=${this.hass}
          .label=${this._getLabel(i, rules.length, t)}
          .chips=${i === 0 ? chips : []}
          ?isFirst=${i === 0}
          ?isLast=${i === rules.length - 1}
          ?isOnly=${rules.length === 1}
          @rule-changed=${(e) => this._onRuleChanged(i, e.detail.rule)}
          @rule-delete=${() => this._onDelete(i)}
          @rule-move-up=${() => this._onMove(i, -1)}
          @rule-move-down=${() => this._onMove(i, +1)}
        ></rule-row>
      `)}

      <div class="footer">
        <button class="btn-add" @click=${this._addRule}>${t("rules.add")}</button>
        <select class="template-select" @change=${this._applyTemplate}>
          <option value="">${t("rules.template")}</option>
          ${DEFAULT_TEMPLATES.map(
            (tpl) => html`<option value=${tpl.id}>${t(`tpl.${tpl.id}`) || tpl.name}</option>`
          )}
        </select>
      </div>
    `;
  }

  _emit(rules) {
    this.dispatchEvent(new CustomEvent("rules-changed", {
      detail: { rules },
      bubbles: true,
      composed: true,
    }));
  }

  _onRuleChanged(index, updatedRule) {
    const rules = [...(this.rules || [])];
    rules[index] = updatedRule;
    this._emit(rules);
  }

  _onDelete(index) {
    const rules = (this.rules || []).filter((_, i) => i !== index);
    this._emit(rules);
  }

  _onMove(index, dir) {
    const rules = [...(this.rules || [])];
    const target = index + dir;
    if (target < 0 || target >= rules.length) return;
    [rules[index], rules[target]] = [rules[target], rules[index]];
    this._emit(rules);
  }

  _addRule() {
    const rules = [...(this.rules || [])];
    rules.push({ condition: "default", color: "#ffffff", behavior: "solid" });
    this._emit(rules);
  }

  _applyTemplate(e) {
    const id = e.target.value;
    if (!id) return;
    e.target.value = ""; // reset select
    const tpl = DEFAULT_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    this._emit([...tpl.rules.map((r) => ({ ...r }))]);
  }
}

customElements.define("rules-editor", RulesEditor);
