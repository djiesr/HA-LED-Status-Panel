/**
 * API calls to the HA HTTP endpoints provided by the led_status_panel integration.
 */

function getToken(hass) {
  // HA Lovelace: hass.auth.data.access_token (home-assistant-js-websocket Auth object)
  return hass?.auth?.data?.access_token || "";
}

function authHeaders(hass) {
  return {
    Authorization: `Bearer ${getToken(hass)}`,
    "Content-Type": "application/json",
  };
}

async function parseResponse(res) {
  const text = await res.text();
  if (!res.ok) {
    // Try to extract a meaningful message from JSON error body
    try {
      const j = JSON.parse(text);
      const msg = j.message || j.error || JSON.stringify(j);
      throw new Error(`HTTP ${res.status} — ${msg}`);
    } catch (e) {
      if (e.message.startsWith("HTTP ")) throw e;
      // Response was HTML or plain text
      throw new Error(`HTTP ${res.status} (réponse non-JSON). L'intégration est-elle chargée et HA redémarré ?`);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Réponse invalide (non-JSON) : ${text.slice(0, 120)}`);
  }
}

/**
 * Resolve config_path from a panel_code (light entity_id).
 * Returns { ok, config_path } or throws.
 */
export async function fetchPanelInfo(hass, panelCode) {
  const url = `/api/led_status_panel/panel?panel_code=${encodeURIComponent(panelCode)}`;
  const res = await fetch(url, { headers: authHeaders(hass) });
  return parseResponse(res);
}

/**
 * Read the JSON config file.
 * Returns { ok, data } or throws.
 */
export async function fetchConfig(hass, configPath) {
  const url = `/api/led_status_panel/config?path=${encodeURIComponent(configPath)}`;
  const res = await fetch(url, { headers: authHeaders(hass) });
  return parseResponse(res);
}

/**
 * Write the JSON config file.
 * Returns { ok } or throws.
 */
export async function saveConfig(hass, configPath, data) {
  const url = `/api/led_status_panel/config?path=${encodeURIComponent(configPath)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(hass),
    body: JSON.stringify({ data }),
  });
  return parseResponse(res);
}

/**
 * Reload the HA integration config entry so it picks up the new JSON.
 * Pass either entryId or configPath — the backend resolves whichever is available.
 * Returns { ok } or throws.
 */
export async function reloadIntegration(hass, { entryId, configPath } = {}) {
  const res = await fetch("/api/led_status_panel/reload", {
    method: "POST",
    headers: authHeaders(hass),
    body: JSON.stringify({ entry_id: entryId || "", config_path: configPath || "" }),
  });
  return parseResponse(res);
}
