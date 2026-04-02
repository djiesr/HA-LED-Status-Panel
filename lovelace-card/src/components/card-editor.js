import { LitElement, html, css } from "lit";
import { getT } from "../utils/i18n.js";

/**
 * Visual editor for the card configuration (shown in HA's card editor UI).
 * Implements the HA card editor protocol: setConfig + dispatches "config-changed".
 */
export class LedPanelCardEditor extends LitElement {
  static properties = {
    hass:   { attribute: false },
    _config: { state: true },
  };

  static styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--secondary-text-color, #888);
    }
    input {
      background: var(--card-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 0.9rem;
    }
    .hint {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #888);
    }
  `;

  setConfig(config) {
    this._config = config;
  }

  render() {
    if (!this._config) return html``;
    const t = getT(this.hass);
    return html`
      <div class="form">
        <label>
          ${t("editor.panel_code")}
          <input
            type="text"
            .value=${this._config.panel_code || ""}
            placeholder="${t("editor.panel_code.ph")}"
            @input=${(e) => this._update("panel_code", e.target.value)}
          />
          <span class="hint">${t("editor.panel_code.h")}</span>
        </label>

        <label>
          ${t("editor.config_path")}
          <input
            type="text"
            .value=${this._config.config_path || ""}
            placeholder="led_panel_config.json"
            @input=${(e) => this._update("config_path", e.target.value)}
          />
          <span class="hint">${t("editor.config_path.h")}</span>
        </label>

        <label>
          ${t("editor.title")}
          <input
            type="text"
            .value=${this._config.title || ""}
            placeholder="${t("editor.title.ph")}"
            @input=${(e) => this._update("title", e.target.value)}
          />
        </label>
      </div>
    `;
  }

  _update(key, value) {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("led-panel-card-editor", LedPanelCardEditor);
