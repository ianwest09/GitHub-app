// Repository layer. Local-first: the app never calls this unless the user
// explicitly enters a base URL and taps Sync. The documented wire contract
// lives in ../../OPTIONAL-SYNC.md; a zero-dependency reference server is in
// ../../sync-service/server.mjs. No prices are ever synthesised here.

export const SYNC_VERSION = 1;

export function normaliseBaseUrl(raw) {
  const url = String(raw || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) throw new Error('Sync URL must start with http:// or https://');
  const u = new URL(url);
  if (u.username || u.password) throw new Error('Do not put credentials in the sync URL');
  return url;
}

async function requestJson(baseUrl, path, options = {}) {
  const base = normaliseBaseUrl(baseUrl);
  if (typeof globalThis.fetch !== 'function') throw new Error('Network is unavailable on this device');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* leave as null */ }
    if (!res.ok) throw new Error(body?.error || `Sync service returned ${res.status}`);
    return body;
  } finally { clearTimeout(timer); }
}

export function validateBackupState(state) {
  if (!state || state.version !== 1 || !Array.isArray(state.lines)) {
    throw new Error('Remote backup is not a version-1 app state');
  }
  return state;
}

export async function health(baseUrl) {
  return requestJson(baseUrl, '/v1/health');
}

export async function pullBackup(baseUrl) {
  const body = await requestJson(baseUrl, '/v1/backup').catch((err) => {
    if (/404/.test(err.message)) return null;
    throw err;
  });
  return body ? { ...body, state: validateBackupState(body.state) } : null;
}

export async function pushBackup(baseUrl, state, deviceId) {
  return requestJson(baseUrl, '/v1/backup', {
    method: 'PUT',
    body: JSON.stringify({
      deviceId, version: SYNC_VERSION,
      updatedAt: new Date().toISOString(),
      state: validateBackupState(state),
    }),
  });
}

export async function pullPrices(baseUrl) {
  const body = await requestJson(baseUrl, '/v1/prices');
  if (!Array.isArray(body?.entries)) throw new Error('Remote price response is malformed');
  return body.entries;
}

export async function pushPrices(baseUrl, entries, deviceId) {
  if (!Array.isArray(entries)) throw new Error('Only user-entered PriceEntry records can be pushed');
  return requestJson(baseUrl, '/v1/prices', {
    method: 'POST',
    body: JSON.stringify({ deviceId, version: SYNC_VERSION, entries }),
  });
}

// Deterministic last-write-wins resolution; callers decide whether to apply it.
export function newer(localUpdatedAt, remoteUpdatedAt) {
  return String(remoteUpdatedAt || '') > String(localUpdatedAt || '');
}
