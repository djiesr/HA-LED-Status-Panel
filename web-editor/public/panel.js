/**
 * Home Assistant panel_custom entry point.
 * Register this in configuration.yaml and copy the built app to www/led-panel-editor/
 * so the iframe loads the editor at /local/led-panel-editor/index.html
 */
class LedPanelEditorPanel extends HTMLElement {
  set panel(info) {
    this._info = info;
  }

  connectedCallback() {
    if (this._iframe) return;
    this._iframe = document.createElement("iframe");
    this._iframe.style.width = "100%";
    this._iframe.style.height = "100%";
    this._iframe.style.border = "none";
    this._iframe.src = "/local/led-panel-editor/index.html";
    this.appendChild(this._iframe);
  }
}

customElements.define("led-panel-editor", LedPanelEditorPanel);
