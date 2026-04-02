import { LitElement, html, css } from "lit";
import "./behavior-picker.js";

/**
 * Single rule row: condition input + color picker + behavior select + controls.
 * Dispatches "rule-changed" with updated rule, "rule-delete", "rule-move-up", "rule-move-down".
 */
export class RuleRow extends LitElement {
  static properties = {
    rule:      { type: Object },
    label:     { type: String },   // "SI" | "SINON SI" | "SINON"
    isFirst:   { type: Boolean },
    isLast:    { type: Boolean },
    isOnly:    { type: Boolean },  // only one rule → disable delete
    chips:     { type: Array },    // suggestion chips [{ label, value }]
    hass:      { attribute: false },
  };

  static styles = css`
    :host { display: block; }

    .row {
      display: grid;
      grid-template-columns: 60px 1fr auto auto auto auto;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-color, #03a9f4);
      text-align: right;
      padding-right: 4px;
      white-space: nowrap;
    }

    .condition-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
      grid-column: 2;
    }

    input[type="text"] {
      width: 100%;
      background: var(--secondary-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 5px 7px;
      font-size: 0.82rem;
      box-sizing: border-box;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
    }

    .chip {
      background: var(--secondary-background-color, #2a2a2a);
      border: 1px solid var(--divider-color, #444);
      border-radius: 12px;
      padding: 1px 7px;
      font-size: 0.7rem;
      cursor: pointer;
      color: var(--secondary-text-color, #aaa);
      white-space: nowrap;
    }
    .chip:hover {
      border-color: var(--primary-color, #03a9f4);
      color: var(--primary-color, #03a9f4);
    }

    input[type="color"] {
      width: 34px;
      height: 32px;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      background: none;
      cursor: pointer;
      padding: 1px;
    }

    .behavior-wrap {
      min-width: 130px;
    }

    .btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #aaa);
      cursor: pointer;
      padding: 4px 7px;
      font-size: 0.8rem;
      line-height: 1;
    }
    .btn:hover { color: var(--primary-text-color, #e0e0e0); }
    .btn:disabled { opacity: 0.3; cursor: default; }
    .btn.delete:hover { color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }
  `;

  render() {
    const rule = this.rule || {};
    return html`
      <div class="row">
        <span class="label">${this.label || "SI"}</span>

        <div class="condition-wrap">
          <input
            type="text"
            .value=${rule.condition || ""}
            placeholder="state == on"
            @input=${(e) => this._change("condition", e.target.value)}
          />
          ${this.chips?.length
            ? html`
              <div class="chips">
                ${this.chips.map(
                  (c) => html`
                    <span class="chip" @click=${() => this._setCondition(c.value)}>
                      ${c.label}
                    </span>
                  `
                )}
              </div>`
            : ""}
        </div>

        <input
          type="color"
          .value=${rule.color || "#ffffff"}
          title="Couleur"
          @input=${(e) => this._change("color", e.target.value)}
        />

        <div class="behavior-wrap">
          <behavior-picker
            .value=${rule.behavior || "solid"}
            .hass=${this.hass}
            @value-changed=${(e) => this._change("behavior", e.detail.value)}
          ></behavior-picker>
        </div>

        <div style="display:flex;gap:3px;">
          <button class="btn" title="Monter"
            ?disabled=${this.isFirst}
            @click=${() => this.dispatchEvent(new CustomEvent("rule-move-up", { bubbles: true, composed: true }))}>
            ↑
          </button>
          <button class="btn" title="Descendre"
            ?disabled=${this.isLast}
            @click=${() => this.dispatchEvent(new CustomEvent("rule-move-down", { bubbles: true, composed: true }))}>
            ↓
          </button>
          <button class="btn delete" title="Supprimer"
            ?disabled=${this.isOnly}
            @click=${() => this.dispatchEvent(new CustomEvent("rule-delete", { bubbles: true, composed: true }))}>
            ✕
          </button>
        </div>
      </div>
    `;
  }

  _change(key, value) {
    this.dispatchEvent(new CustomEvent("rule-changed", {
      detail: { rule: { ...this.rule, [key]: value } },
      bubbles: true,
      composed: true,
    }));
  }

  _setCondition(value) {
    this.dispatchEvent(new CustomEvent("rule-changed", {
      detail: { rule: { ...this.rule, condition: value } },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define("rule-row", RuleRow);
