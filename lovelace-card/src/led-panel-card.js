import { LitElement, html, css } from "lit";
import { fetchPanelInfo, fetchConfig, saveConfig, reloadIntegration } from "./utils/config-api.js";
import { getT } from "./utils/i18n.js";
import { buildLedMap } from "./utils/led-index.js";
import { assignmentDisplayColor, ruleDisplayColor } from "./utils/color-utils.js";
import { evaluateAssignment } from "./utils/rule-evaluator.js";
import "./components/led-grid.js";
import "./components/led-dialog.js";
import "./components/card-editor.js";

class LedPanelCard extends LitElement {
  static properties = {
    _config:       { state: true },
    _panelConfig:  { state: true },
    _loading:      { state: true },
    _error:        { state: true },
    _liveColors:   { state: true },
    _liveMode:     { state: true },    // true = live colors, false = config colors
    _selection:    { state: true },    // Set<"panel-row-col">
    _dialogOpen:   { state: true },
    _dialogCells:  { state: true },
    _dialogAssign: { state: true },
    _saveStatus:   { state: true },
    _saveMsg:      { state: true },
  };

  constructor() {
    super();
    this._selection = new Set();
    this._liveMode = true;
  }

  static styles = css`
    :host { display: block; }
    ha-card { padding: 12px; position: relative; }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--primary-text-color, #e0e0e0);
    }
    .header-actions { display: flex; gap: 6px; align-items: center; }

    .reload-btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--primary-text-color, #e0e0e0);
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .reload-btn:hover { background: var(--secondary-background-color, #2a2a2a); }

    .live-btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #888);
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .live-btn.active {
      border-color: #4caf50;
      color: #4caf50;
    }
    .live-btn:hover { background: var(--secondary-background-color, #2a2a2a); }

    .panels-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    .panel-wrapper { flex: 0 0 auto; }

    /* Selection toolbar */
    .selection-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding: 7px 10px;
      background: var(--secondary-background-color, #1e1e1e);
      border: 1px solid var(--primary-color, #03a9f4);
      border-radius: 6px;
      flex-wrap: wrap;
    }
    .selection-bar .count {
      font-size: 0.85rem;
      color: var(--primary-color, #03a9f4);
      font-weight: 600;
      flex: 1;
    }
    .btn-configure {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn-configure:hover { filter: brightness(1.15); }
    .btn-clear {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #aaa);
      padding: 6px 10px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .btn-clear:hover { color: var(--primary-text-color, #e0e0e0); }

    .loading, .error, .empty {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color, #888);
      font-size: 0.9rem;
    }
    .error { color: var(--error-color, #cf6679); }

    .hint {
      text-align: center;
      font-size: 0.75rem;
      color: var(--secondary-text-color, #555);
      margin-top: 8px;
    }

    /* Save toast */
    .toast {
      position: absolute;
      bottom: 12px;
      right: 12px;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 0.82rem;
      font-weight: 600;
      pointer-events: none;
      animation: fadeout 3s forwards;
    }
    .toast.saved  { background: #1b5e20; color: #a5d6a7; }
    .toast.error  { background: #4e1217; color: #ef9a9a; }
    .toast.saving { background: var(--secondary-background-color, #2a2a2a); color: var(--secondary-text-color, #aaa); animation: none; }

    @keyframes fadeout {
      0%   { opacity: 1; }
      70%  { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

  // ── HA card protocol ──────────────────────────────────────────────────────

  setConfig(config) {
    if (!config.panel_code && !config.config_path) {
      throw new Error("panel_code ou config_path est requis");
    }
    const prev = this._config;
    this._config = config;
    if (this._hass && (prev?.panel_code !== config.panel_code || prev?.config_path !== config.config_path)) {
      this._loadConfig();
    }
  }

  set hass(hass) {
    const firstSet = !this._hass;
    this._hass = hass;
    if (firstSet && this._config) this._loadConfig();
    if (this._panelConfig) this._updateLiveColors();
  }

  static getConfigElement() {
    return document.createElement("led-panel-card-editor");
  }

  static getStubConfig() {
    return { type: "custom:led-panel-card", panel_code: "light.led_status_panel", title: "Panneau LED" };
  }

  // ── Config loading ────────────────────────────────────────────────────────

  async _loadConfig() {
    this._loading = true;
    this._error = null;
    try {
      let configPath = this._config.config_path;
      let entryId = null;
      if (!configPath && this._config.panel_code) {
        const info = await fetchPanelInfo(this._hass, this._config.panel_code);
        if (!info.ok) {
          const t = getT(this._hass);
      this._error = `${t("card.error.panel")} : ${info.error || "panel_not_found"}`;
          return;
        }
        configPath = info.config_path;
        entryId = info.entry_id || null;
      }
      const result = await fetchConfig(this._hass, configPath);
      if (!result.ok) {
        const t = getT(this._hass);
        this._error = `${t("card.error.config")} : ${result.error}`;
        return;
      }
      this._panelConfig = result.data;
      this._configPath = configPath;
      if (entryId) this._entryId = entryId;
      this._updateLiveColors();
    } catch (err) {
      const t = getT(this._hass);
      this._error = `${t("card.error.network")} : ${err.message}`;
    } finally {
      this._loading = false;
    }
  }

  // ── Live colors ───────────────────────────────────────────────────────────

  _updateLiveColors() {
    if (!this._panelConfig || !this._hass) return;
    const liveColors = new Map();
    for (const assignment of this._panelConfig.assignments || []) {
      const rule = evaluateAssignment(assignment, this._hass.states);
      if (!rule) continue;
      const color = ruleDisplayColor(rule, assignment.importance);
      const behavior = rule.behavior || "solid";
      for (const led of assignment.leds || []) {
        liveColors.set(`${led.panel}-${led.row}-${led.col}`, { color, behavior });
      }
    }
    this._liveColors = liveColors;
  }

  // ── Tooltips ─────────────────────────────────────────────────────────────

  _buildTooltipMap() {
    const map = new Map();
    if (!this._panelConfig) return map;
    for (const assignment of this._panelConfig.assignments || []) {
      const entityId = assignment.entity_id || "";
      const stateObj = this._hass?.states?.[entityId];
      const friendly = stateObj?.attributes?.friendly_name || entityId;
      const state = stateObj ? stateObj.state : "—";
      const label = friendly !== entityId ? `${friendly}\n${entityId}\nÉtat : ${state}` : `${entityId}\nÉtat : ${state}`;
      for (const led of assignment.leds || []) {
        map.set(`${led.panel}-${led.row}-${led.col}`, label);
      }
    }
    return map;
  }

  // ── Selection ────────────────────────────────────────────────────────────

  _onCellClick(e) {
    const { panel, row, col } = e.detail;
    const key = `${panel}-${row}-${col}`;
    const sel = new Set(this._selection);
    if (sel.has(key)) {
      sel.delete(key);
    } else {
      sel.add(key);
    }
    this._selection = sel;
  }

  _clearSelection() {
    this._selection = new Set();
  }

  _openDialogFromSelection() {
    const cells = [...this._selection].map((key) => {
      const [p, r, c] = key.split("-").map(Number);
      return { panel: p, row: r, col: c };
    });
    if (!cells.length) return;

    // If all selected LEDs belong to the same assignment → edit it
    const ledMap = buildLedMap(this._panelConfig?.assignments || []);
    const assignments = cells.map((cell) => ledMap.get(`${cell.panel}-${cell.row}-${cell.col}`));
    const uniqueIds = [...new Set(assignments.filter(Boolean).map((a) => a.id))];
    const sharedAssignment = uniqueIds.length === 1
      ? assignments.find(Boolean)
      : null;

    this._dialogCells = cells;
    this._dialogAssign = sharedAssignment || null;
    this._dialogOpen = true;
  }

  // ── Dialog events ─────────────────────────────────────────────────────────

  _onDialogSave(e) {
    const updated = e.detail.assignment;
    // Replace the leds array with the current selection
    const withLeds = { ...updated, leds: this._dialogCells };
    this._dialogOpen = false;
    this._clearSelection();
    this._applyAssignment(withLeds);
  }

  _onDialogDelete() {
    this._dialogOpen = false;
    this._clearSelection();
    if (!this._dialogAssign) return;
    this._deleteAssignment(this._dialogAssign.id);
  }

  _onDialogCancel() {
    this._dialogOpen = false;
  }

  // ── Config mutations ──────────────────────────────────────────────────────

  _applyAssignment(assignment) {
    const assignments = [...(this._panelConfig?.assignments || [])];
    const idx = assignments.findIndex((a) => a.id === assignment.id);
    if (idx >= 0) {
      assignments[idx] = assignment;
    } else {
      assignments.push(assignment);
    }
    this._panelConfig = { ...this._panelConfig, assignments };
    this._updateLiveColors();
    this._persistConfig();
  }

  _deleteAssignment(id) {
    const assignments = (this._panelConfig?.assignments || []).filter((a) => a.id !== id);
    this._panelConfig = { ...this._panelConfig, assignments };
    this._updateLiveColors();
    this._persistConfig();
  }

  async _persistConfig() {
    const t = getT(this._hass);
    this._saveStatus = "saving";
    this._saveMsg = t("save.saving");
    try {
      const result = await saveConfig(this._hass, this._configPath, this._panelConfig);
      if (!result.ok) {
        this._saveStatus = "error";
        this._saveMsg = `${t("save.error")} : ${result.error}`;
        setTimeout(() => { this._saveStatus = "idle"; }, 4000);
        return;
      }
      this._saveMsg = t("save.reloading");
      try {
        await reloadIntegration(this._hass, {
          entryId: this._entryId,
          configPath: this._configPath,
        });
        this._saveStatus = "saved";
        this._saveMsg = t("save.saved");
      } catch (reloadErr) {
        this._saveStatus = "saved";
        this._saveMsg = t("save.saved.noreload");
      }
    } catch (err) {
      this._saveStatus = "error";
      this._saveMsg = `${t("save.error")} : ${err.message}`;
    }
    setTimeout(() => { this._saveStatus = "idle"; }, 4000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const t = getT(this._hass);
    const selCount = this._selection?.size || 0;

    return html`
      <ha-card>
        <div class="card-header">
          <span class="card-title">${this._config?.title || t("card.title")}</span>
          <div class="header-actions">
            <button
              class="live-btn ${this._liveMode ? "active" : ""}"
              title="${this._liveMode ? t("card.live.on") : t("card.live.off")}"
              @click=${() => { this._liveMode = !this._liveMode; }}
            >${t("card.live")}</button>
            <button class="reload-btn" title="${t("card.reload")}" @click=${this._loadConfig}>↺</button>
          </div>
        </div>

        ${selCount > 0 ? html`
          <div class="selection-bar">
            <span class="count">${selCount} ${selCount > 1 ? t("sel.leds.plural") : t("sel.leds")}</span>
            <button class="btn-clear" @click=${this._clearSelection}>${t("sel.clear")}</button>
            <button class="btn-configure" @click=${this._openDialogFromSelection}>${t("sel.configure")}</button>
          </div>
        ` : ""}

        ${this._loading
          ? html`<div class="loading">${t("card.loading")}</div>`
          : this._error
          ? html`<div class="error">${this._error}</div>`
          : this._renderPanels()}

        ${this._saveStatus && this._saveStatus !== "idle"
          ? html`<div class="toast ${this._saveStatus}">${this._saveMsg}</div>`
          : ""}

        <led-dialog
          .open=${this._dialogOpen || false}
          .hass=${this._hass}
          .cell=${this._dialogCells?.[0]}
          .assignment=${this._dialogAssign}
          @dialog-save=${this._onDialogSave}
          @dialog-delete=${this._onDialogDelete}
          @dialog-cancel=${this._onDialogCancel}
        ></led-dialog>
      </ha-card>
    `;
  }

  _renderPanels() {
    const t = getT(this._hass);
    if (!this._panelConfig) {
      return html`<div class="empty">${t("card.empty")}</div>`;
    }
    const numPanels = this._panelConfig.panels || 1;
    const ledMap = buildLedMap(this._panelConfig.assignments || []);
    const tooltipMap = this._buildTooltipMap();

    return html`
      <div class="panels-row">
        ${Array.from({ length: numPanels }, (_, p) => html`
          <div class="panel-wrapper">
            <led-grid
              .panel=${p}
              .ledMap=${ledMap}
              .liveColors=${this._liveMode ? (this._liveColors || new Map()) : new Map()}
              .getColor=${assignmentDisplayColor}
              .selection=${this._selection}
              .tooltipMap=${tooltipMap}
              label="${t("card.panel.label")} ${p + 1}"
              @cell-click=${this._onCellClick}
            ></led-grid>
          </div>
        `)}
      </div>
      ${this._selection?.size === 0
        ? html`<div class="hint">${t("card.hint")}</div>`
        : ""}
    `;
  }
}

customElements.define("led-panel-card", LedPanelCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "led-panel-card",
  name: "LED Panel Card",
  description: "Carte de visualisation et configuration des panneaux LED WS2812 (8×8)",
  preview: true,
  documentationURL: "https://github.com/djiesr/led-status-panel",
});
