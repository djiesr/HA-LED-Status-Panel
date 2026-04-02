import { LitElement, html, css } from "lit";
import { getT } from "../utils/i18n.js";
import "./rules-editor.js";

const IMPORTANCE_VALUES = ["low", "medium", "high"];

/**
 * LED assignment dialog.
 *
 * Props:
 *   open        — Boolean
 *   hass        — HA hass object (for ha-entity-picker and entity state)
 *   cell        — { panel, row, col }
 *   assignment  — existing assignment object (null = new)
 *
 * Dispatches:
 *   "dialog-save"   with { assignment }  — updated/new assignment
 *   "dialog-delete" with {}              — remove assignment
 *   "dialog-cancel" with {}              — discard
 */
export class LedDialog extends LitElement {
  static properties = {
    open:          { type: Boolean, reflect: true },
    hass:          { attribute: false },
    cell:          { type: Object },
    assignment:    { type: Object },
    _edit:         { state: true },
    _saving:       { state: true },
    _entitySearch: { state: true },  // current text in entity input
    _showSuggest:  { state: true },  // show dropdown
  };

  static styles = css`
    :host { display: contents; }

    /* Overlay */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    /* Dialog panel */
    .dialog {
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--divider-color, #333);
      border-radius: 8px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }

    /* Header */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px 10px;
      border-bottom: 1px solid var(--divider-color, #333);
      flex-shrink: 0;
    }
    .dialog-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color, #e0e0e0);
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--secondary-text-color, #888);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .btn-close:hover { color: var(--primary-text-color, #e0e0e0); background: var(--secondary-background-color, #2a2a2a); }

    /* Body — scrollable */
    .dialog-body {
      padding: 14px 18px;
      overflow-y: auto;
      flex: 1;
    }

    /* Form fields */
    .field {
      margin-bottom: 14px;
    }
    .field-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--secondary-text-color, #888);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
    }

    /* Entity input */
    .entity-input-wrap {
      position: relative;
    }
    .entity-input {
      width: 100%;
      background: var(--secondary-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 7px 10px;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .entity-input:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
    }
    .entity-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--primary-color, #03a9f4);
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 180px;
      overflow-y: auto;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .entity-suggestion {
      padding: 7px 10px;
      font-size: 0.82rem;
      cursor: pointer;
      color: var(--primary-text-color, #e0e0e0);
    }
    .entity-suggestion:hover, .entity-suggestion.focused {
      background: var(--secondary-background-color, #2a2a2a);
    }
    .entity-suggestion .friendly {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #888);
      margin-top: 1px;
    }

    /* Importance toggle */
    .importance-row {
      display: flex;
      gap: 6px;
    }
    .imp-btn {
      flex: 1;
      padding: 6px 4px;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      background: none;
      color: var(--secondary-text-color, #aaa);
      cursor: pointer;
      font-size: 0.8rem;
      text-align: center;
    }
    .imp-btn:hover { border-color: var(--primary-color, #03a9f4); color: var(--primary-color, #03a9f4); }
    .imp-btn.active {
      border-color: var(--primary-color, #03a9f4);
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    /* LEDs info badge */
    .leds-info {
      font-size: 0.8rem;
      color: var(--secondary-text-color, #888);
      background: var(--secondary-background-color, #2a2a2a);
      border-radius: 4px;
      padding: 6px 10px;
    }

    /* Footer */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 18px 14px;
      border-top: 1px solid var(--divider-color, #333);
      flex-shrink: 0;
      gap: 8px;
    }
    .footer-left { display: flex; gap: 8px; }
    .footer-right { display: flex; gap: 8px; }

    button.btn-primary {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 18px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 600;
    }
    button.btn-primary:disabled { opacity: 0.5; cursor: default; }
    button.btn-secondary {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--primary-text-color, #e0e0e0);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 0.88rem;
    }
    button.btn-danger {
      background: none;
      border: 1px solid var(--error-color, #cf6679);
      border-radius: 4px;
      color: var(--error-color, #cf6679);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 0.88rem;
    }
    button.btn-danger:hover { background: var(--error-color, #cf6679); color: #fff; }
  `;

  willUpdate(changed) {
    if (changed.has("open") && this.open) {
      if (this.assignment) {
        this._edit = JSON.parse(JSON.stringify(this.assignment));
      } else {
        this._edit = {
          id: `assignment_${Date.now()}`,
          label: "",
          entity_id: "",
          importance: "medium",
          brightness_base: 30,
          leds: [{ panel: this.cell?.panel ?? 0, row: this.cell?.row ?? 0, col: this.cell?.col ?? 0 }],
          rules: [{ condition: "default", color: "#00ff00", behavior: "solid" }],
        };
      }
      this._saving = false;
      this._entitySearch = this._edit.entity_id || "";
      this._showSuggest = false;
    }
  }

  _entitySuggestions() {
    const q = (this._entitySearch || "").toLowerCase().trim();
    if (!q || !this.hass?.states) return [];
    return Object.entries(this.hass.states)
      .filter(([id, s]) => {
        const name = (s.attributes?.friendly_name || "").toLowerCase();
        return id.toLowerCase().includes(q) || name.includes(q);
      })
      .slice(0, 20)
      .map(([id, s]) => ({ id, friendly: s.attributes?.friendly_name || "" }));
  }

  render() {
    if (!this.open) return html``;

    const edit = this._edit || {};
    const isNew = !this.assignment;
    const entityState = this.hass?.states?.[edit.entity_id];
    const cell = this.cell || {};

    const t = getT(this.hass);
    const title = isNew ? t("dlg.new") : t("dlg.edit");

    return html`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" @click=${(e) => e.stopPropagation()}>

          <div class="dialog-header">
            <span class="dialog-title">${title}</span>
            <button class="btn-close" @click=${this._cancel}>✕</button>
          </div>

          <div class="dialog-body">

            <!-- Entity -->
            <div class="field">
              <div class="field-label">${t("dlg.entity")}</div>
              <div class="entity-input-wrap">
                <input
                  class="entity-input"
                  type="text"
                  placeholder="${t("dlg.entity.ph")}"
                  .value=${this._entitySearch || ""}
                  @input=${this._onEntityInput}
                  @focus=${() => { this._showSuggest = true; }}
                  @blur=${() => { setTimeout(() => { this._showSuggest = false; }, 200); }}
                />
                ${this._showSuggest && this._entitySuggestions().length
                  ? html`
                    <div class="entity-suggestions">
                      ${this._entitySuggestions().map((s) => html`
                        <div class="entity-suggestion"
                          @mousedown=${() => this._selectEntity(s.id)}>
                          <div>${s.id}</div>
                          ${s.friendly ? html`<div class="friendly">${s.friendly}</div>` : ""}
                        </div>
                      `)}
                    </div>`
                  : ""}
              </div>
            </div>

            <!-- Importance -->
            <div class="field">
              <div class="field-label">${t("dlg.importance")}</div>
              <div class="importance-row">
                ${IMPORTANCE_VALUES.map((val) => html`
                  <button
                    class="imp-btn ${edit.importance === val ? "active" : ""}"
                    @click=${() => this._setField("importance", val)}
                  >${t(`dlg.imp.${val}`)}</button>
                `)}
              </div>
            </div>

            <!-- LEDs info -->
            <div class="field">
              <div class="field-label">${t("dlg.leds")}</div>
              <div class="leds-info">
                ${(edit.leds || []).length} LED(s) :
                ${(edit.leds || []).map(
                  (l) => `P${l.panel + 1}·R${l.row + 1}·C${l.col + 1}`
                ).join(", ")}
              </div>
            </div>

            <!-- Rules -->
            <rules-editor
              .rules=${edit.rules || []}
              .hass=${this.hass}
              .entityState=${entityState ? { state: entityState.state, attributes: entityState.attributes } : null}
              @rules-changed=${this._onRulesChanged}
            ></rules-editor>

          </div>

          <div class="dialog-footer">
            <div class="footer-left">
              ${!isNew
                ? html`<button class="btn-danger" @click=${this._delete}>${t("dlg.delete")}</button>`
                : ""}
            </div>
            <div class="footer-right">
              <button class="btn-secondary" @click=${this._cancel}>${t("dlg.cancel")}</button>
              <button class="btn-primary" ?disabled=${this._saving || !edit.entity_id} @click=${this._save}>
                ${this._saving ? t("dlg.saving") : t("dlg.save")}
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  _setField(key, value) {
    this._edit = { ...this._edit, [key]: value };
  }

  _onEntityInput(e) {
    this._entitySearch = e.target.value;
    this._showSuggest = true;
    // If user types an exact entity_id, update immediately
    if (this.hass?.states?.[e.target.value]) {
      this._edit = { ...this._edit, entity_id: e.target.value };
    }
  }

  _selectEntity(entityId) {
    this._entitySearch = entityId;
    this._edit = { ...this._edit, entity_id: entityId };
    this._showSuggest = false;
  }

  _onRulesChanged(e) {
    this._edit = { ...this._edit, rules: e.detail.rules };
  }

  _onOverlayClick() {
    this._cancel();
  }

  _cancel() {
    this.dispatchEvent(new CustomEvent("dialog-cancel", { bubbles: true, composed: true }));
  }

  _save() {
    this._saving = true;
    this.dispatchEvent(new CustomEvent("dialog-save", {
      detail: { assignment: { ...this._edit } },
      bubbles: true,
      composed: true,
    }));
  }

  _delete() {
    this.dispatchEvent(new CustomEvent("dialog-delete", { bubbles: true, composed: true }));
  }
}

customElements.define("led-dialog", LedDialog);
