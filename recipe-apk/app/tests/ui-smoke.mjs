// UI smoke test. Run with: npm install && npm run test:ui
// Verifies app.js actually executes and every tab renders in a simulated DOM.
import { parseHTML } from 'linkedom';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const { window, document } = parseHTML(html);

const set = (obj, k, v) => Object.defineProperty(obj, k, { value: v, configurable: true, writable: true });
set(globalThis, 'window', window);
set(globalThis, 'document', document);
set(globalThis, 'navigator', {}); // no serviceWorker / wakeLock -> guarded paths skipped
set(globalThis, 'matchMedia', () => ({ matches: false }));
set(globalThis, 'speechSynthesis', { cancel() {}, speak() {} });
set(globalThis, 'SpeechSynthesisUtterance', class { constructor(t) { this.text = t; } });
set(globalThis, 'Notification', class {
  static permission = 'default';
  static requestPermission() { return Promise.resolve('granted'); }
  constructor(_t, o) { this.body = o?.body; }
});
set(window, 'speechSynthesis', globalThis.speechSynthesis);
set(window, 'Notification', globalThis.Notification);
set(window, 'scrollTo', () => {});
set(window, 'print', () => {});
set(document, 'hidden', false);

const mem = new Map();
set(globalThis, 'localStorage', {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
});
set(globalThis, 'URL', Object.assign(URL, {
  createObjectURL: () => 'blob:stub', revokeObjectURL: () => {},
}));
set(globalThis, 'Blob', class { constructor(parts) { this.parts = parts; } });

process.on('uncaughtException', (e) => { console.error('UNCAUGHT', e.stack); process.exit(1); });
await import('../js/app.js');

const view = () => document.querySelector('#view').innerHTML;
const click = (sel) => {
  const el = document.querySelector(sel);
  assert.ok(el, `missing element ${sel}`);
  el.dispatchEvent(new window.Event('click', { bubbles: true }));
};
const change = (sel, prop, value) => {
  const el = document.querySelector(sel);
  assert.ok(el, `missing element ${sel}`);
  if (prop === 'value' && el.tagName === 'SELECT') {
    // linkedom's HTMLSelectElement.value is a getter; override it for the test.
    Object.defineProperty(el, 'value', { value: String(value), configurable: true, writable: true });
  } else if (prop) el[prop] = value;
  el.dispatchEvent(new window.Event('change', { bubbles: true }));
};

assert.match(view(), /Run sheet &amp; timeline|Run sheet/);
assert.match(view(), /09:30/);
assert.match(view(), /Set time/);
console.log('✓ run sheet renders');

for (const [t, needle] of [
  ['cook', 'Cook mode'], ['shop', 'Shopping list'], ['agenda', 'Agenda'],
  ['cost', 'Cost &amp; cheaper route'], ['more', 'Dietary guardrails'], ['run', 'Run sheet'],
]) {
  click(`#tabs button[data-tab="${t}"]`);
  assert.ok(view().length > 500, `${t} tab is empty`);
  assert.match(view(), new RegExp(needle), `${t} tab missing heading`);
  console.log(`✓ ${t} tab renders`);
}

// Held menu items are explicit; the old dessert is not presented as cleared or shared.
click('#tabs button[data-tab="run"]');
assert.match(view(), /Smoked gammon/);
assert.match(view(), /Homemade ice-cream/);
assert.match(view(), /Coconut rice pudding/);
assert.match(view(), /Host A clearance pending/);
assert.match(view(), /recipe to be supplied|recipe[ -]pending/i);
assert.match(view(), /not a safety claim/i);
assert.match(view(), /not for Host A or Guest B/);
assert.doesNotMatch(view(), /Coconut rice pots|Rice \(for coconut pots\)|portion coconut/i);
click('#tabs button[data-tab="shop"]');
assert.match(view(), /recipe pending/i);
assert.match(view(), /Host A clearance pending/i);
assert.match(view(), /clearance pending/i);
assert.match(view(), /no price entry/i);
console.log('✓ gammon / ice-cream / coconut-rice held items render without safety claims');

// Accessibility + optional settings are present and persist.
click('#tabs button[data-tab="more"]');
assert.match(view(), /Text size/);
assert.match(view(), /High-contrast/);
assert.match(view(), /Three menu items are not cleared/);
assert.match(view(), /Menu options \/ placeholders/);
assert.match(view(), /MIUI reliability/);
assert.match(view(), /Optional LAN sync/);
change('[data-set="textScale"]', 'value', '125');
change('[data-set="highContrast"]', 'checked', true);
const settings = JSON.parse(mem.get('christmas-lunch-app-v1'));
assert.equal(settings.textScale, 125);
assert.equal(settings.highContrast, true);
assert.equal(document.body.classList.contains('high-contrast'), true);
console.log('✓ large-print / high-contrast settings persist');

// Cost tab: verify honest states are visible.
click('#tabs button[data-tab="cost"]');
assert.match(view(), /partial subtotal/);
assert.match(view(), /Insufficient data|single source|no full-basket total/i);
assert.match(view(), /Expired|EXCLUDED/);
console.log('✓ coverage / expiry / exclusions shown');

// Adding a real user-entered price works and persists.
click('#tabs button[data-tab="shop"]');
click('[data-act="add-price"]');
assert.ok(document.querySelector('#p-amount'), 'price modal opened');
document.querySelector('#p-amount').value = '45.50';
click('[data-act="save-price"]');
assert.equal(document.querySelector('#modal-back').getAttribute('hidden'), '');
const saved = JSON.parse(mem.get('christmas-lunch-app-v1'));
assert.equal(saved.customPrices.length, 1);
assert.equal(saved.customPrices[0].priceCents, 4550);
console.log('✓ till-slip price entry persists');

// Date presets drive expiry behaviour.
click('#tabs button[data-tab="agenda"]');
click('[data-act="date-preset"][data-d="2026-11-23"]');
click('#tabs button[data-tab="cost"]');
assert.match(view(), /Expired — re-check price/);
console.log('✓ catalogue prices expire on 23 Nov');

// Christmas Day closure warning.
click('#tabs button[data-tab="agenda"]');
click('[data-act="date-preset"][data-d="2026-12-25"]');
assert.match(view(), /Spar Port Alfred is closed on Christmas Day/);
console.log('✓ Christmas Day store closure warning');

// Timers in Cook mode.
click('#tabs button[data-tab="cook"]');
document.querySelector('#timer-min').value = '5';
click('[data-act="timer-add"]');
assert.match(document.querySelector('#timers-box').innerHTML, /04:|05:/);
const withTimer = JSON.parse(mem.get('christmas-lunch-app-v1'));
assert.equal(withTimer.timers.length, 1);
assert.equal(withTimer.timers[0].requestCode, 1);
assert.equal(withTimer.timers[0].native, false);
console.log('✓ named timers run and survive a reload');

// Checkbox change re-renders and persists.
click('#tabs button[data-tab="shop"]');
change('[data-tick]', 'checked', true);
const saved2 = JSON.parse(mem.get('christmas-lunch-app-v1'));
assert.ok(saved2.lines.some((l) => l.ticked));
console.log('✓ checklist state persists');

console.log('\nUI smoke test: all checks passed');
// Cook-mode timers keep an interval alive; exit explicitly.
process.exit(0);
