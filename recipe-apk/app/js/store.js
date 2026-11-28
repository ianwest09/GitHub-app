// Local-first persistence. No network, no account.
import {
  RETIRED_SHOPPING_LINE_IDS, RETIRED_PRICE_MATCH_KEYS, RETIRED_STEP_IDS,
} from './data.js';

const KEY = 'christmas-lunch-app-v1';
const retiredLineIds = new Set(RETIRED_SHOPPING_LINE_IDS);
const retiredMatchKeys = new Set(RETIRED_PRICE_MATCH_KEYS);
const retiredStepIds = new Set(RETIRED_STEP_IDS);

export const DEFAULT_TODAY = '2026-11-19'; // date the verified prices were captured

/**
 * Reconcile saved shopping lines with the current seed data.
 * Retired menu lines are removed, newly seeded lines are appended, and all
 * other saved ticks / pantry flags are preserved.
 */
export function reconcileLines(savedLines, seedLines) {
  const lines = (Array.isArray(savedLines) ? savedLines : [])
    .filter((l) => l && l.id && !retiredLineIds.has(l.id))
    .map((l) => ({ ...l }));
  const known = new Set(lines.map((l) => l.id));
  for (const l of seedLines) {
    if (!known.has(l.id)) lines.push({ ...l, ticked: false, pantry: false });
  }
  return lines;
}

/** Remove local data that belonged only to retired recipe lines/steps. */
export function migrateState(parsed, seedLines) {
  const state = { ...parsed };
  state.lines = reconcileLines(state.lines, seedLines);
  if (Array.isArray(state.customPrices)) {
    state.customPrices = state.customPrices.filter((p) => !retiredMatchKeys.has(p?.matchKey));
  }
  if (state.durations && typeof state.durations === 'object') {
    for (const id of retiredStepIds) delete state.durations[id];
  }
  return state;
}

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
    lines: reconcileLines([], lines),
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
    return { ...freshState(lines), ...migrateState(parsed, lines) };
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
  const s = { ...freshState(lines), ...migrateState(parsed, lines) };
  save(s);
  return s;
}
