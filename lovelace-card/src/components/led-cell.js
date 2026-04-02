import { LitElement, html, css } from "lit";

/**
 * Single LED cell in the 8x8 grid.
 * Dispatches "cell-click" with { panel, row, col } on click.
 */
export class LedCell extends LitElement {
  static properties = {
    panel:     { type: Number },
    row:       { type: Number },
    col:       { type: Number },
    color:     { type: String },  // CSS color string
    behavior:  { type: String, reflect: true },  // solid | blink_fast | blink_slow | pulse | off
    selected:  { type: Boolean, reflect: true },
    dimmed:    { type: Boolean, reflect: true }, // true = config color, false = live color
    tooltip:   { type: String },  // text shown on hover
  };

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      /* Carré fixe */
      width: 36px;
      height: 36px;
      background: #111;
      border: 1px solid #222;
      box-sizing: border-box;
    }
    button {
      /* Rond centré dans le carré */
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      padding: 0;
      background: var(--led-color, #1e1e1e);
      box-shadow: 0 0 0 1px #333;
      transition: box-shadow 0.15s, filter 0.15s;
      box-sizing: border-box;
    }
    button:hover {
      box-shadow: 0 0 6px 2px var(--led-color, #555), 0 0 0 1px #666;
      filter: brightness(1.5);
    }
    :host([selected]) button {
      box-shadow: 0 0 0 2px #fff;
    }
    :host([dimmed]) button {
      opacity: 0.55;
    }
    /* Behavior animations */
    :host([behavior="blink_fast"]) button {
      animation: blink 0.5s step-end infinite;
    }
    :host([behavior="blink_slow"]) button {
      animation: blink 2s step-end infinite;
    }
    :host([behavior="pulse"]) button {
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.05; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.2; }
      50%       { opacity: 1;   }
    }
  `;

  render() {
    const title = this.tooltip
      ? this.tooltip
      : `P${this.panel + 1} · R${this.row + 1} · C${this.col + 1}`;
    return html`
      <button
        style="--led-color: ${this.color || "#1a1a1a"}"
        title=${title}
        @click=${this._onClick}
      ></button>
    `;
  }

  _onClick() {
    this.dispatchEvent(
      new CustomEvent("cell-click", {
        detail: { panel: this.panel, row: this.row, col: this.col },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("led-cell", LedCell);
