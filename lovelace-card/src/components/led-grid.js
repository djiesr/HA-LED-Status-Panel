import { LitElement, html, css } from "lit";
import "./led-cell.js";

/**
 * 8x8 LED grid for one panel.
 * Renders led-cell elements and re-bubbles "cell-click" events.
 *
 * Props:
 *   panel       — panel index (0, 1, 2)
 *   ledMap      — Map<"panel-row-col", assignment> (config mapping)
 *   liveColors  — Map<"panel-row-col", { color, behavior }> (live state, optional)
 *   getColor    — function(assignment) → CSS color string
 *   selection   — Set<"panel-row-col"> of selected cells
 */
export class LedGrid extends LitElement {
  static properties = {
    panel:      { type: Number },
    ledMap:     { type: Object },
    liveColors: { type: Object },
    getColor:   { type: Object },
    label:      { type: String },
    selection:  { type: Object },  // Set<"panel-row-col">
    tooltipMap: { type: Object },  // Map<"panel-row-col", string>
  };

  static styles = css`
    :host {
      display: block;
    }
    .panel-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #888);
      margin-bottom: 4px;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(8, 36px);
      grid-template-rows: repeat(8, 36px);
      gap: 0;
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      padding: 4px;
      width: fit-content;
    }
  `;

  render() {
    const cells = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const key = `${this.panel}-${row}-${col}`;
        const assignment = this.ledMap?.get(key);
        const live = this.liveColors?.get(key);

        let color = "#1a1a1a";
        let behavior = "solid";
        let dimmed = false;

        if (live) {
          color = live.color;
          behavior = live.behavior || "solid";
        } else if (assignment && this.getColor) {
          color = this.getColor(assignment);
          dimmed = true; // config color, not live
        }

        const selected = this.selection?.has(key) || false;
        const tooltip = this.tooltipMap?.get(key) || "";

        cells.push(html`
          <led-cell
            .panel=${this.panel}
            .row=${row}
            .col=${col}
            .color=${color}
            .behavior=${behavior}
            .tooltip=${tooltip}
            ?dimmed=${dimmed}
            ?selected=${selected}
          ></led-cell>
        `);
      }
    }

    return html`
      ${this.label ? html`<div class="panel-label">${this.label}</div>` : ""}
      <div class="grid">${cells}</div>
    `;
  }
}

customElements.define("led-grid", LedGrid);
