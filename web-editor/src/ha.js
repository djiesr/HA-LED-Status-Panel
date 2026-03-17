export function getHaTokenFromLocalStorage() {
  try {
    const raw = localStorage.getItem('hassTokens');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // Expected shape: { access_token: "...", ... }
    const token = typeof obj?.access_token === 'string' ? obj.access_token.trim() : '';
    return token || null;
  } catch (_) {
    return null;
  }
}

function _tryParseToken(raw) {
  try {
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const token = typeof obj?.access_token === 'string' ? obj.access_token.trim() : '';
    return token || null;
  } catch (_) {
    return null;
  }
}

export function getHaTokenBestEffort() {
  // 1) Current window localStorage
  try {
    const token = _tryParseToken(localStorage.getItem('hassTokens'));
    if (token) return token;
  } catch (_) {}

  // 2) Try parent/top localStorage (some HA embeds isolate the iframe storage)
  for (const w of [window.parent, window.top]) {
    try {
      if (!w || w === window) continue;
      const token = _tryParseToken(w.localStorage?.getItem?.('hassTokens'));
      if (token) return token;
    } catch (_) {}
  }
  return null;
}

export function isRunningInsideHomeAssistant() {
  // Best-effort detection: in HA, hassTokens exists for logged-in users.
  // Also allow /local/ path (served from www) as a weak signal.
  const token = getHaTokenBestEffort();
  if (token) return true;
  try {
    return typeof window !== 'undefined' && String(window.location?.pathname || '').startsWith('/local/');
  } catch (_) {
    return false;
  }
}

export async function haFetch(path, { token, baseUrl, signal, ...init } = {}) {
  const resolvedToken = (token || getHaTokenBestEffort() || '').trim().replace(/^Bearer\s+/i, '');
  const base = (baseUrl || '').trim().replace(/\/$/, '');
  const url = base ? `${base}${path}` : path;
  const headers = new Headers(init.headers || {});
  if (resolvedToken) headers.set('Authorization', `Bearer ${resolvedToken}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  return fetch(url, { ...init, signal, headers });
}

export function listenForHaAuthMessage(onAuth) {
  // Accept token sent from HA panel_custom wrapper (panel.js) via postMessage.
  const handler = (ev) => {
    try {
      const data = ev?.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'LED_PANEL_EDITOR_HA_AUTH') return;
      const token = typeof data.token === 'string' ? data.token.trim() : '';
      const origin = typeof data.origin === 'string' ? data.origin.trim().replace(/\/$/, '') : '';
      if (token) onAuth({ token, origin });
    } catch (_) {}
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

export async function haReadLedPanelConfig({ path = 'led_panel_config.json', baseUrl = '', token, signal } = {}) {
  const qs = new URLSearchParams({ path });
  const res = await haFetch(`/api/led_status_panel/config?${qs.toString()}`, {
    method: 'GET',
    baseUrl,
    token,
    signal,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }
  if (!res.ok) {
    const msg = json?.error ? String(json.error) : `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return json?.data;
}

export async function haWriteLedPanelConfig({ path = 'led_panel_config.json', data, baseUrl = '', token, signal } = {}) {
  const qs = new URLSearchParams({ path });
  const res = await haFetch(`/api/led_status_panel/config?${qs.toString()}`, {
    method: 'POST',
    baseUrl,
    token,
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }
  if (!res.ok) {
    const msg = json?.error ? String(json.error) : `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return true;
}

