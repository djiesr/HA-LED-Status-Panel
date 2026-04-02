import { LitElement, html, css } from "lit";
import { getT } from "../utils/i18n.js";

export class BehaviorPicker extends LitElement {
  static properties = {
    value: { type: String },
    hass:  { attribute: false },
  };

  static styles = css`
    select {
      background: var(--card-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 0.85rem;
      cursor: pointer;
      width: 100%;
    }
  `;

  render() {
    const t = getT(this.hass);
    const behaviors = ["solid", "blink_fast", "blink_slow", "pulse", "off"];
    return html`
      <select @change=${this._onChange}>
        ${behaviors.map((val) => html`
          <option value=${val} ?selected=${this.value === val}>${t(`beh.${val}`)}</option>
        `)}
      </select>
    `;
  }

  _onChange(e) {
    this.dispatchEvent(new CustomEvent("value-changed", {
      detail: { value: e.target.value },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define("behavior-picker", BehaviorPicker);
