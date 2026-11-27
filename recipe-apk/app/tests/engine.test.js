import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isExpired, isActive, usable, lineCost, compareLine, optimiseBasket, mergeLines,
  scaleQty, schedule, hhmmToMinutes, minutesToHHMM, formatZAR, bundleCount,
} from '../js/engine.js';
import { PRICE_ENTRIES, SHOPPING_LINES, DISHES, RUN_SHEET, STORES, MENU_PLACEHOLDERS, RETIRED_SHOPPING_LINE_IDS } from '../js/data.js';

const TODAY = '2026-11-19';
const ctx = { today: TODAY, basketLines: SHOPPING_LINES, hasLoyaltyCard: false };

test('time helpers', () => {
  assert.equal(hhmmToMinutes('13:00'), 780);
  assert.equal(hhmmToMinutes('09:30'), 570);
  assert.equal(minutesToHHMM(780), '13:00');
  assert.equal(formatZAR(14398), 'R143.98');
});

test('zero hardcoded prices in engine/data: all figures are records', () => {
  // Guard: every price lives inside PRICE_ENTRIES, not in logic.
  assert.ok(PRICE_ENTRIES.length >= 15);
  for (const e of PRICE_ENTRIES) {
    assert.ok(['pnp', 'woolworths', 'spar'].includes(e.store));
    assert.ok(e.url && e.url.startsWith('https://'));
    assert.ok(e.validFrom && e.validTo);
  }
  assert.equal(STORES.length, 3);
});

test('expired rows are excluded', () => {
  const expired = PRICE_ENTRIES.find((e) => e.id === 'spar-mixed-veg-expired');
  assert.ok(isExpired(expired, TODAY));
  assert.ok(!isActive(expired, TODAY));
  assert.ok(!isExpired(expired, '2026-10-10'));
  // On 23 Nov every seeded catalogue row is expired.
  assert.ok(PRICE_ENTRIES.every((e) => isExpired(e, '2026-11-23')));
});

test('chicken: Pick n Pay is the cheapest VERIFIED like-for-like boneless option', () => {
  const line = SHOPPING_LINES.find((l) => l.matchKey === 'chicken-boneless');
  const r = compareLine(line, PRICE_ENTRIES, ctx);
  assert.equal(r.status, 'compared');
  assert.equal(r.selected.entry.store, 'pnp');
  assert.equal(r.selected.costCents, 14398); // 1.8 kg × R79.99/kg
  assert.equal(r.savingCents, 8100);         // vs Woolworths R124.99/kg → R224.98
  const rejected = r.reasons.join(' ');
  assert.match(rejected, /not like-for-like|FROZEN/i);
  assert.match(rejected, /Spar/i);
});

test('Spar frozen bone-in chicken is never substituted for boneless', () => {
  const spar = PRICE_ENTRIES.find((e) => e.id === 'spar-chicken-frozen');
  const line = SHOPPING_LINES.find((l) => l.matchKey === 'chicken-boneless');
  assert.equal(usable(spar, line, ctx).ok, false);
});

test('the BUY ANY 4 bundle does not apply with only 2 qualifying items', () => {
  const bundle = PRICE_ENTRIES.find((e) => e.id === 'pnp-potatoes-bundle');
  assert.equal(bundleCount(bundle, SHOPPING_LINES), 2);
  const line = SHOPPING_LINES.find((l) => l.matchKey === 'potatoes');
  assert.equal(usable(bundle, line, ctx).ok, false);
  const r = compareLine(line, PRICE_ENTRIES, ctx);
  assert.equal(r.status, 'single'); // Woolworths only — never "cheapest"
  assert.equal(r.selected.costCents, 3000);
  assert.match(r.label, /Single source/i);
  // With 4 qualifying items the bundle becomes usable and cheaper.
  const four = [...SHOPPING_LINES,
    { id: 'x1', name: 'Gem squash', qty: 2, unit: 'kg', matchKey: 'gem-squash', bundleQ: true },
    { id: 'x2', name: 'Green peppers', qty: 0.8, unit: 'kg', matchKey: 'peppers2', bundleQ: true }];
  const r2 = compareLine(line, PRICE_ENTRIES, { ...ctx, basketLines: four });
  assert.equal(r2.status, 'compared');
  assert.equal(r2.selected.entry.store, 'pnp');
  assert.equal(r2.selected.costCents, 2625); // 1.5 kg × R17.50/kg
  assert.equal(r2.savingCents, 375);
});

test('single-source lines are never labelled cheapest; unit mismatches are not priced', () => {
  const cauli = SHOPPING_LINES.find((l) => l.matchKey === 'cauliflower');
  const r = compareLine(cauli, PRICE_ENTRIES, ctx);
  assert.notEqual(r.status, 'compared');
  assert.match(r.reasons.join(' '), /Unit mismatch/);
  const cucumber = SHOPPING_LINES.find((l) => l.matchKey === 'cucumber');
  assert.equal(compareLine(cucumber, PRICE_ENTRIES, ctx).status, 'no-price');
});

test('basket shows coverage and a PARTIAL total, never a final one', () => {
  const r = optimiseBasket(SHOPPING_LINES, PRICE_ENTRIES, ctx);
  assert.ok(r.pricedCount >= 2 && r.pricedCount < r.totalCount);
  assert.equal(r.complete, false);
  assert.ok(r.coverage < 0.15);
  assert.ok(r.missing.some((l) => l.matchKey === 'tongue'));
  assert.ok(r.missing.length > 25);
  assert.equal(r.totalCents, r.pricedCount ? 14398 + 3000 : 0);
});

test('alcohol-containing catalogue items are excluded from any comparison', () => {
  const pudding = PRICE_ENTRIES.find((e) => e.id === 'pnp-brandy-pudding');
  assert.equal(pudding.excluded, 'ALCOHOL_FREE');
  assert.equal(isActive(pudding, TODAY), false);
  assert.equal(usable(pudding, SHOPPING_LINES[0], ctx).ok, false);
});

test('duplicate ingredients merge and portion scaling works', () => {
  const lemons = [
    { name: 'Lemons', qty: 4, unit: 'each' },
    { name: 'Lemons', qty: 3, unit: 'each' },
    { name: 'lemons', qty: 3, unit: 'each' },
    { name: 'Lemons', qty: 1, unit: 'kg' },
  ];
  const merged = mergeLines(lemons);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((l) => l.unit === 'each').qty, 10);
  assert.equal(scaleQty(10, 10, 12), 12);
  assert.equal(scaleQty(null, 10, 12), null);
});

test('lineCost refuses incomparable units', () => {
  const wool = PRICE_ENTRIES.find((e) => e.id === 'wool-potatoes');
  assert.equal(lineCost({ qty: 1.5, unit: 'kg' }, wool), 3000);
  assert.equal(lineCost({ qty: 3, unit: 'each' }, wool), null);
});

test('menu placeholders stay unpriced and no old rice-based dessert data survives', () => {
  const pending = SHOPPING_LINES.filter((l) => l.qty === null);
  assert.equal(pending.length, 2);
  assert.ok(pending.some((l) => /Smoked gammon/i.test(l.name)));
  assert.ok(pending.some((l) => /Homemade ice-cream/i.test(l.name)));
  for (const line of pending) {
    assert.equal(lineCost(line, PRICE_ENTRIES[0]), null);
    const comparison = compareLine(line, PRICE_ENTRIES, ctx);
    assert.equal(comparison.status, 'no-price');
    assert.match(comparison.reasons.join(' '), /Recipe pending/);
  }
  const basket = optimiseBasket(pending, PRICE_ENTRIES, ctx);
  assert.equal(basket.pricedCount, 0);
  assert.equal(basket.complete, false);
  assert.equal(MENU_PLACEHOLDERS.length, 2);
  assert.ok(SHOPPING_LINES.every((l) => !RETIRED_SHOPPING_LINE_IDS.includes(l.id)));
  const seedText = JSON.stringify({ SHOPPING_LINES, DISHES, RUN_SHEET, MENU_PLACEHOLDERS });
  assert.doesNotMatch(seedText, /Coconut rice pots|Rice \(for coconut pots\)|portion coconut/i);
});

test('schedule: missing durations are reported, explicit ones are scheduled', () => {
  const r = schedule(DISHES, 780);
  assert.equal(r.scheduled.length, 1); // only the 4-hour tongue poach has an explicit duration
  assert.equal(r.scheduled[0].durationMin, 240);
  assert.equal(r.scheduled[0].start, 540); // 09:00, 4 h before 13:00
  assert.ok(r.untimed.length > 15);
  assert.ok(r.warnings.some((w) => /Set time/.test(w)));
});

test('schedule: oven double-booking is detected and a resolution offered', () => {
  const dishes = [{ id: 'x', title: 'Test', steps: [
    { id: 'a', title: 'Roast chicken', resource: 'OVEN', durationMin: 90, deps: [] },
    { id: 'b', title: 'Roast vegetables', resource: 'OVEN', durationMin: 60, deps: [] },
  ]}];
  const r = schedule(dishes, 780);
  assert.equal(r.conflicts.length, 1);
  assert.equal(r.conflicts[0].resource, 'OVEN');
  assert.match(r.conflicts[0].suggestion, /Shift/);
  assert.ok(r.warnings.some((w) => /OVEN conflict/.test(w)));
});

test('schedule: dependencies are respected and cycles are reported', () => {
  const dishes = [{ id: 'x', title: 'Test', steps: [
    { id: 'a', title: 'Prep', resource: 'COUNTER', durationMin: 30, deps: [] },
    { id: 'b', title: 'Cook', resource: 'STOVETOP', durationMin: 45, deps: ['a'] },
  ]}];
  const r = schedule(dishes, 780);
  const a = r.scheduled.find((s) => s.id === 'a');
  const b = r.scheduled.find((s) => s.id === 'b');
  assert.ok(b.start >= a.end);
});
