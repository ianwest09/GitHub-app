// Pure domain logic. No DOM, no storage — importable by both the browser and Node tests.

export const hhmmToMinutes = (s) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

export const minutesToHHMM = (m) => {
  if (m == null || !Number.isFinite(m)) return '—';
  const n = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};

export const formatZAR = (cents) => {
  if (cents == null || !Number.isFinite(cents)) return '—';
  // South African retail listings use a dot decimal; formatZAR below enforces it.
  return 'R' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const isExpired = (entry, today) => !!entry.validTo && entry.validTo < today;
export const isActive = (entry, today) =>
  !isExpired(entry, today) && entry.priceCents != null && !entry.excluded;

/** Count basket lines that qualify for a multi-buy bundle. */
export const bundleCount = (entry, basketLines) => {
  if (!entry.bundle) return Infinity;
  const keys = entry.bundleQualifyingKeys || [];
  return basketLines.filter((l) => l.bundleQ === true || keys.includes(l.matchKey)).length;
};

/** Decide whether a price entry may be used for a shopping line. */
export function usable(entry, line, ctx) {
  const { today, basketLines = [], hasLoyaltyCard = false } = ctx;
  if (entry.excluded) return { ok: false, reason: `Excluded — ${entry.excluded}` };
  if (isExpired(entry, today)) return { ok: false, reason: 'Expired — re-check price' };
  if (entry.priceCents == null) return { ok: false, reason: 'No base price listed' };
  if (entry.unitCents == null) return { ok: false, reason: 'No unit price (pack size unknown)' };
  if (!entry.likeForLike) return { ok: false, reason: entry.note || 'Not like-for-like' };
  if (entry.loyalty && !hasLoyaltyCard) return { ok: false, reason: 'Loyalty card required' };
  if (entry.bundle) {
    const count = bundleCount(entry, basketLines);
    if (count < entry.bundleMinItems) {
      return { ok: false, reason: `${entry.bundle} — only ${count} of ${entry.bundleMinItems} qualifying items in basket` };
    }
  }
  const cost = lineCost(line, entry);
  if (cost == null) return { ok: false, reason: `Unit mismatch: line is ${line.unit}, price is per ${entry.packUnit}` };
  return { ok: true, reason: '' };
}

/** Cost of a shopping line using a price entry. Returns cents, or null when units cannot be compared. */
export function lineCost(line, entry) {
  const q = Number(line.qty);
  if (!Number.isFinite(q) || q <= 0) return null;
  const weightLike = (u) => u === 'kg' || u === 'g';
  const volumeLike = (u) => u === 'L' || u === 'ml';
  if (weightLike(line.unit) && entry.packUnit === 'kg' && entry.unitCents != null) {
    return Math.round((line.unit === 'g' ? q / 1000 : q) * entry.unitCents);
  }
  if (volumeLike(line.unit) && entry.packUnit === 'L' && entry.unitCents != null) {
    return Math.round((line.unit === 'ml' ? q / 1000 : q) * entry.unitCents);
  }
  if (line.unit === entry.packUnit && entry.packQty > 0) {
    return Math.round((q / entry.packQty) * entry.priceCents);
  }
  return null;
}

/** Compare the three shops for one line. Never guesses a missing shop. */
export function compareLine(line, entries, ctx) {
  if (!line.matchKey) return { status: 'no-price', options: [], reasons: ['No verified product match'] };
  const candidates = entries.filter((e) => e.matchKey === line.matchKey);
  const reasons = [];
  const perStore = new Map();
  for (const e of candidates) {
    const u = usable(e, line, ctx);
    if (!u.ok) { reasons.push(`${e.store}: ${u.reason}`); continue; }
    const prev = perStore.get(e.store);
    const cost = lineCost(line, e);
    if (!prev || e.unitCents < prev.unitCents) {
      perStore.set(e.store, { entry: e, costCents: cost });
    }
  }
  const options = [...perStore.values()].sort((a, b) => a.costCents - b.costCents);
  if (options.length === 0) {
    return { status: 'no-price', options: [], reasons };
  }
  if (options.length === 1) {
    return { status: 'single', options, reasons, selected: options[0], savingCents: 0,
      label: 'Single source — insufficient data to compare' };
  }
  const dearest = options[options.length - 1];
  return {
    status: 'compared', options, reasons, selected: options[0],
    savingCents: Math.max(0, dearest.costCents - options[0].costCents),
    label: `Cheapest verified: ${options[0].entry.store}`,
  };
}

/** Whole-basket optimisation. Returns a partial total — never a final one when gaps remain. */
export function optimiseBasket(lines, entries, ctx) {
  const rows = lines.map((line) => ({ line, ...compareLine(line, entries, ctx) }));
  const priced = rows.filter((r) => r.selected);
  const totalCents = priced.reduce((sum, r) => sum + r.selected.costCents, 0);
  const split = {};
  for (const r of priced) {
    const s = r.selected.entry.store;
    (split[s] ||= []).push({ line: r.line, costCents: r.selected.costCents, product: r.selected.entry.product });
  }
  const missing = rows.filter((r) => !r.selected).map((r) => r.line);
  return {
    rows, totalCents, missing, split,
    pricedCount: priced.length,
    totalCount: lines.length,
    coverage: lines.length ? priced.length / lines.length : 0,
    complete: missing.length === 0,
  };
}

export const mergeLines = (lines) => {
  const map = new Map();
  for (const l of lines) {
    const key = `${l.name.trim().toLowerCase()}|${l.unit}`;
    const prev = map.get(key);
    if (prev) prev.qty = Number(prev.qty) + Number(l.qty);
    else map.set(key, { ...l });
  }
  return [...map.values()];
};

export const scaleQty = (qty, fromGuests, toGuests) =>
  Math.round((Number(qty) * toGuests / fromGuests) * 1000) / 1000;

/**
 * Dependency-aware, resource-aware schedule.
 * Backward pass for latest start, forward pass for earliest feasible start.
 * Steps without an explicit duration are excluded and reported, never guessed.
 */
export function schedule(dishes, serveMinutes = 780, opts = {}) {
  const all = dishes.flatMap((d) => d.steps.map((s) => ({ ...s, dish: d.title })));
  const byId = new Map(all.map((s) => [s.id, s]));
  const untimed = all.filter((s) => !(Number(s.durationMin) > 0));
  const timed = all.filter((s) => Number(s.durationMin) > 0);
  const timedIds = new Set(timed.map((s) => s.id));

  const depsOf = (s) => (s.deps || []).filter((d) => timedIds.has(d));
  const successors = new Map(timed.map((s) => [s.id, []]));
  for (const s of timed) for (const d of depsOf(s)) successors.get(d).push(s.id);

  // Topological order (Kahn); cycles are reported rather than guessed around.
  const indeg = new Map(timed.map((s) => [s.id, depsOf(s).length]));
  const queue = timed.filter((s) => indeg.get(s.id) === 0).map((s) => s.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const nxt of successors.get(id) || []) {
      indeg.set(nxt, indeg.get(nxt) - 1);
      if (indeg.get(nxt) === 0) queue.push(nxt);
    }
  }
  const cyclic = timed.length !== order.length;

  // Backward pass: latest finish = earliest of successors' latest start, else serve time.
  const latestStart = new Map();
  for (const id of [...order].reverse()) {
    const s = byId.get(id);
    const succ = successors.get(id) || [];
    const latestFinish = succ.length ? Math.min(...succ.map((n) => latestStart.get(n))) : serveMinutes;
    latestStart.set(id, latestFinish - Number(s.durationMin));
  }

  // Forward pass: start = max(dependency finishes, latest start).
  const scheduled = [];
  const endById = new Map();
  for (const id of order) {
    const s = byId.get(id);
    const depEnds = depsOf(s).map((d) => endById.get(d) ?? 0);
    const earliest = depEnds.length ? Math.max(...depEnds) : 0;
    const start = Math.max(earliest, latestStart.get(id) ?? 0);
    const end = start + Number(s.durationMin);
    endById.set(id, end);
    scheduled.push({ ...s, start, end, handsOn: !!s.handsOn });
  }
  scheduled.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));

  // Resource conflicts for exclusive resources.
  const exclusive = new Set(['OVEN', 'STOVETOP', 'FRIDGE', 'FREEZER', 'COOLER']);
  const conflicts = [];
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i], b = scheduled[j];
      if (!exclusive.has(a.resource) || a.resource !== b.resource || a.canOverlap || b.canOverlap) continue;
      if (a.start < b.end && b.start < a.end) {
        const overlap = Math.min(a.end, b.end) - Math.max(a.start, b.start);
        conflicts.push({ a: a.title, b: b.title, resource: a.resource, overlapMinutes: overlap,
          suggestion: `Shift "${b.title}" ${overlap} min earlier or give it its own ${a.resource.toLowerCase()} slot.` });
      }
    }
  }

  const warnings = [];
  for (const s of untimed) warnings.push(`"${s.title}" has no duration in MENU.md — Set time to include it.`);
  if (cyclic) warnings.push('A dependency cycle was found — check step dependencies.');
  for (const c of conflicts) warnings.push(`${c.resource} conflict: ${c.a} vs ${c.b} (${c.overlapMinutes} min). ${c.suggestion}`);
  if (scheduled.some((s) => s.end > serveMinutes)) warnings.push('Some steps finish after the target serve time.');

  return { scheduled, warnings, conflicts, untimed, serveMinutes,
    freeMinutes: scheduled.length ? serveMinutes - Math.max(...scheduled.map((s) => s.end)) : 0 };
}
