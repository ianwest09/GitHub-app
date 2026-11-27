import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileLines, migrateState, freshState } from '../js/store.js';
import {
  SHOPPING_LINES, RETIRED_SHOPPING_LINE_IDS, RETIRED_PRICE_MATCH_KEYS, RETIRED_STEP_IDS,
} from '../js/data.js';

test('fresh seed contains held menu lines and no retired dessert lines', () => {
  const state = freshState(SHOPPING_LINES);
  assert.ok(state.lines.some((l) => l.id === 'l40' && l.qty === null && /Smoked gammon/i.test(l.name)));
  assert.ok(state.lines.some((l) => l.id === 'l41' && l.qty === null && /heavy whipping cream/i.test(l.name) && l.dietClearancePending === true));
  assert.equal(state.lines.filter((l) => l.dietClearancePending === true).length, 4);
  assert.equal(state.lines.filter((l) => l.recipeSupplied === true).length, 4);
  assert.equal(state.lines.filter((l) => l.preparationPending === true).length, 1);
  assert.ok(state.lines.some((l) => l.id === 'l47' && /sweetened condensed milk/i.test(l.name)));
  assert.ok(state.lines.some((l) => l.id === 'l48' && /fruit mince/i.test(l.name)));
  assert.ok(state.lines.some((l) => l.id === 'l49' && /cling wrap/i.test(l.name)));
  assert.equal(state.lines.filter((l) => l.clearancePending === true).length, 5);
  assert.ok(state.lines.some((l) => l.id === 'l42' && /coconut/i.test(l.name)));
  assert.ok(state.lines.some((l) => l.id === 'l46' && /coconut/i.test(l.name)));
  for (const id of RETIRED_SHOPPING_LINE_IDS) assert.ok(!state.lines.some((l) => l.id === id));
});

test('reconcileLines removes retired IDs but preserves other user state', () => {
  const saved = [
    { id: 'l01', name: 'Boneless chicken', qty: 1.8, unit: 'kg', ticked: true, pantry: false },
    { id: 'l28', name: 'Retired dessert ingredient', qty: 0.8, unit: 'L', ticked: true },
    { id: 'l29', name: 'Retired dessert ingredient', qty: 0.15, unit: 'kg', ticked: false },
  ];
  const lines = reconcileLines(saved, SHOPPING_LINES);
  assert.equal(lines.find((l) => l.id === 'l01').ticked, true);
  for (const id of RETIRED_SHOPPING_LINE_IDS) assert.ok(!lines.some((l) => l.id === id));
  assert.ok(lines.some((l) => l.id === 'l40' && l.qty === null));
  assert.ok(lines.some((l) => l.id === 'l41' && l.qty === null && l.dietClearancePending === true));
  assert.equal(lines.filter((l) => l.clearancePending === true).length, 5);
  assert.equal(lines.filter((l) => l.dietClearancePending === true).length, 4);
  assert.equal(lines.filter((l) => l.recipeSupplied === true).length, 4);
});

test('migrateState removes retired prices and step durations', () => {
  const parsed = {
    version: 1,
    lines: [{ id: 'l01', name: 'Boneless chicken', qty: 1.8, unit: 'kg', ticked: true, pantry: false }],
    customPrices: [
      { id: 'old', matchKey: RETIRED_PRICE_MATCH_KEYS[0] },
      { id: 'keep', matchKey: 'chicken-boneless' },
    ],
    durations: { s18: 45, s19: 20 },
    timers: [],
  };
  const state = migrateState(parsed, SHOPPING_LINES);
  assert.deepEqual(state.customPrices.map((p) => p.id), ['keep']);
  assert.equal(state.durations.s18, undefined);
  assert.equal(state.durations.s19, 20);
  assert.ok(RETIRED_STEP_IDS.includes('s18'));
  assert.ok(state.lines.every((l) => !RETIRED_SHOPPING_LINE_IDS.includes(l.id)));
  assert.equal(state.lines.filter((l) => l.clearancePending === true).length, 5);
  assert.equal(state.lines.filter((l) => l.dietClearancePending === true).length, 4);
  assert.equal(state.lines.filter((l) => l.recipeSupplied === true).length, 4);
  assert.equal(state.lines.filter((l) => l.preparationPending === true).length, 1);
});
