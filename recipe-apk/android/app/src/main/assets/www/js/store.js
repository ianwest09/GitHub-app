// Local-first persistence. No network, no account.
const KEY = 'christmas-lunch-app-v1';

export const DEFAULT_TODAY = '2026-11-19'; // date the verified prices were captured

export function freshState(lines) {
  return {
    version: 1,
    today: DEFAULT_TODAY,
    guestCount: 10,
    hasLoyaltyCard: false,
    travelCostCents: 0,
    theme: 'auto',
    textScale: 100,
    highContrast: false,
    syncUrl: '',
    syncedAt: '',
    deviceId: '',
    lines: lines.map((l) => ({ ...l, ticked: false, pantry: false })),
    customPrices: [],
    durations: {},
    agendaOverrides: {},
    dismissed: [],
    timers: [],
  };
}

export function load(lines) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState(lines);
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return freshState(lines);
    if (!Array.isArray(parsed.timers)) parsed.timers = [];
    // Keep newly seeded lines that the saved state does not know about.
    const known = new Set(parsed.lines.map((l) => l.id));
    for (const l of lines) if (!known.has(l.id)) parsed.lines.push({ ...l, ticked: false, pantry: false });
    return { ...freshState(lines), ...parsed };
  } catch {
    return freshState(lines);
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full / blocked */ }
}

export function reset(lines) {
  const s = freshState(lines);
  save(s);
  return s;
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text, lines) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.lines)) throw new Error('Not a valid backup file');
  const s = { ...freshState(lines), ...parsed };
  save(s);
  return s;
}
