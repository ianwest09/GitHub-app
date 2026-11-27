import * as D from './data.js';
import * as E from './engine.js';
import * as S from './store.js';
import * as R from './repository.js';

let state = S.load(D.SHOPPING_LINES);
let tab = 'run';
let cookIndex = 0;
let costView = 'split';
let singleShop = 'pnp';
let shopGroup = 'category';
let timers = state.timers || (state.timers = []);
let timerSeq = Math.max(0, ...timers.map((t) => Number(t.requestCode) || 0));
let timerClock = null;
let wakeLock = null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const storeName = (id) => D.STORES.find((s) => s.id === id)?.name || id;
const shortName = (id) => D.STORES.find((s) => s.id === id)?.short || id;

// Optional native Android bridge. Every call is a no-op in a normal browser.
// The injected object is provided by android/app/src/main/java/.../WebAppInterface.kt.
function native(name, ...args) {
  const a = globalThis.Android;
  try { return typeof a?.[name] === 'function' ? a[name](...args) : null; } catch { return null; }
}
function saveTimers() { state.timers = timers; S.save(state); }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function openModal(title, html, onMount) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  $('#modal-back').hidden = false;
  if (onMount) onMount($('#modal-body'));
}
function closeModal() { $('#modal-back').hidden = true; }

const scaledQty = (l) => E.scaleQty(l.qty, 10, state.guestCount);
// Basket lines carry the scaled quantity so costs follow the portion count.
const basketLines = () => state.lines.map((l) => ({ ...l, qty: scaledQty(l) }));
function ctx() {
  return { today: state.today, basketLines: basketLines(), hasLoyaltyCard: state.hasLoyaltyCard };
}
const allPrices = () => [...D.PRICE_ENTRIES, ...state.customPrices];
const basket = () => E.optimiseBasket(basketLines(), allPrices(), ctx());

function dishes() {
  return D.DISHES.map((d) => ({
    ...d,
    steps: d.steps.map((s) => ({ ...s, durationMin: state.durations[s.id] ?? s.durationMin })),
  }));
}
function allSteps() { return dishes().flatMap((d) => d.steps.map((s) => ({ ...s, dish: d.title }))); }

function applyTheme() {
  const t = state.theme;
  document.body.dataset.theme = t === 'auto'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : t;
  const scale = Math.max(100, Math.min(150, Number(state.textScale) || 100));
  document.body.style.zoom = String(scale / 100);
  document.body.classList.toggle('high-contrast', !!state.highContrast);
  native('setTextZoom', scale);
}

function renderHeader() {
  const b = basket();
  $('#status-pill').textContent = `${state.guestCount} at the table · ${Math.round(b.coverage * 100)}% priced`;
  $('#foot-meta').textContent = `Prices captured 19 Nov 2026 · viewing as ${state.today}`;
}

/* ---------------- RUN SHEET ---------------- */
function renderRun() {
  const r = E.schedule(dishes(), 780);
  const b = basket();
  const runSheet = D.RUN_SHEET.map((e) => `
    <li><b>${esc(e.time)}</b><span>${esc(e.task)}</span><div class="phase">${e.phase === 'prep' ? 'make-ahead' : 'Christmas Day'}</div></li>`).join('');

  const stepRows = allSteps().map((s) => `
    <div class="step">
      <div class="t">${esc(s.title)}</div>
      <input type="number" min="1" max="720" step="5" data-dur="${esc(s.id)}"
             value="${s.durationMin ?? ''}" placeholder="Set time" aria-label="Duration in minutes for ${esc(s.title)}">
      <div class="meta">${esc(s.dish)} · ${esc(s.resource)} · ${s.handsOn ? 'hands-on' : 'unattended'}
        ${s.durationMin ? `${s.durationMin} min` : '<span class="warn">no duration in MENU.md</span>'}
        ${s.note ? ` · ${esc(s.note)}` : ''}</div>
    </div>`).join('');

  const schedRows = r.scheduled.length ? r.scheduled.map((s) => `
    <tr><td class="nowrap mono">${E.minutesToHHMM(s.start)}–${E.minutesToHHMM(s.end)}</td>
    <td><strong>${esc(s.title)}</strong><div class="small muted">${esc(s.dish)} · ${s.handsOn ? 'hands-on' : 'unattended'}</div></td>
    <td class="nowrap">${s.durationMin} min</td><td class="nowrap">${esc(s.resource)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="muted">No steps have a duration yet. Enter minutes above and the schedule appears here.</td></tr>';

  $('#view').innerHTML = `
    <h2 class="sec">Run sheet &amp; timeline</h2>
    <p class="lede">Times below come straight from <code>MENU.md</code>. Nothing is invented — a step with no documented duration shows “Set time” and stays out of the computed schedule.</p>
    <div class="rule"></div>

    <div class="banner info"><strong>The documented 09:30 → 13:00 run sheet</strong>
      One cook, one oven in two batches, alcohol-free, tongue for three on its own platter.</div>
    <div class="card"><ul class="tl">${runSheet}</ul></div>

    <div class="card">
      <h3>Computed schedule (serve 13:00)</h3>
      <p class="lede">Backward pass for latest start, forward pass for earliest feasible start, dependency sort, then resource-conflict detection.</p>
      <div class="row" style="margin-bottom:10px">
        <div class="stat"><div class="v">${r.scheduled.length}</div><div class="k">steps scheduled</div></div>
        <div class="stat"><div class="v">${r.untimed.length}</div><div class="k">“Set time” needed</div></div>
        <div class="stat"><div class="v">${r.conflicts.length}</div><div class="k">resource conflicts</div></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Time</th><th>Step</th><th>Duration</th><th>Resource</th></tr></thead>
      <tbody>${schedRows}</tbody></table></div>
      ${r.warnings.length ? `<h4>Assumptions &amp; conflicts</h4><ul class="small">${r.warnings.slice(0, 8).map((w) => `<li>${esc(w)}</li>`).join('')}${r.warnings.length > 8 ? `<li>…and ${r.warnings.length - 8} more “Set time” items</li>` : ''}</ul>` : ''}
      <div class="banner warn" style="margin-top:12px"><strong>${r.freeMinutes > 0 ? `You are free for ${r.freeMinutes} min before serving` : 'Timeline reaches the serve time'}</strong>
        Only the 4-hour tongue poach has an explicit duration in MENU.md; everything else needs your input.</div>
    </div>

    <div class="card">
      <h3>Set step durations</h3>
      <p class="lede">Enter minutes to include a step. Your entries are saved on this device and never guessed by the app.</p>
      ${stepRows}
      <div class="btn-row"><button class="btn small" data-act="clear-durations">Clear my durations</button></div>
    </div>

    <div class="banner ${b.complete ? 'info' : 'warn'}"><strong>Cost data is ${Math.round(b.coverage * 100)}% complete</strong>
      ${b.missing.length} lines still need a price. The cost tab shows a partial subtotal only — never a final total.</div>`;
}

/* ---------------- COOK MODE ---------------- */
function ensureTimerClock() {
  if (timerClock) return;
  timerClock = setInterval(() => { processTimers(); paintTimers(); }, 1000);
}
function processTimers() {
  const now = Date.now();
  let changed = false;
  for (const t of timers) {
    if (t.endsAt <= now && !t.notified) {
      t.notified = true;
      changed = true;
      toast(`Timer done: ${t.label}`);
      // On Android the exact alarm already supplied sound + notification.
      if (!t.native) {
        speak(`${t.label} timer finished`);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Christmas Lunch', { body: `${t.label} — time's up` });
        }
      }
    }
  }
  if (changed) saveTimers();
}
function paintTimers() {
  const box = $('#timers-box');
  if (!box) return;
  const now = Date.now();
  box.innerHTML = timers.length ? timers.map((t) => {
    const left = Math.max(0, t.endsAt - now);
    const done = left === 0;
    const pct = Math.round((left / t.totalMs) * 100);
    return `<div class="timer ${done ? 'done' : ''}" data-timer-id="${t.id}">
      <div class="n">${esc(t.label)}</div>
      <div class="v">${done ? 'DONE' : mmss(left)}</div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <button class="btn small" data-act="timer-remove" data-id="${t.id}">Remove</button>
    </div>`;
  }).join('') : '<p class="small muted">No timers running. Add one above.</p>';
}
const mmss = (ms) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

function speak(text) {
  if (native('speak', text)) return; // native TextToSpeech is more reliable on MIUI
  try { if ('speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } } catch { /* unsupported */ }
}
async function requestWakeLock() {
  native('setCookMode', true);
  native('keepScreenOn', true);
  try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch { /* denied */ }
}
function releaseWakeLock() {
  native('setCookMode', false);
  native('keepScreenOn', false);
  try { wakeLock?.release(); } catch { /* noop */ }
  wakeLock = null;
}

function renderCook() {
  const steps = allSteps();
  const s = steps[Math.min(cookIndex, steps.length - 1)] || { title: 'No steps', dish: '' };
  $('#view').innerHTML = `
    <h2 class="sec">Cook mode</h2>
    <p class="lede">One step at a time, huge text, read-aloud and multiple named timers. Screen stays on while you are here.</p>
    <div class="rule"></div>
    <div class="cook-step">
      <div class="k">Step ${cookIndex + 1} of ${steps.length} · ${esc(s.dish)}</div>
      <h3>${esc(s.title)}</h3>
      <div class="dish">${esc(s.resource)} · ${s.handsOn ? 'hands-on' : 'unattended'} · ${s.durationMin ? `${s.durationMin} min` : 'Set time in the Run sheet tab'}
        ${s.note ? ` · ${esc(s.note)}` : ''}</div>
    </div>
    <div class="btn-row">
      <button class="btn" data-act="cook-prev">← Previous</button>
      <button class="btn primary" data-act="cook-next">Next step →</button>
      <button class="btn" data-act="cook-say">🔊 Read aloud</button>
      <button class="btn" data-act="cook-timer">⏱ Timer for this step</button>
    </div>
    <div class="card">
      <h3>Timers</h3>
      <div class="row">
        <label class="field"><span>Label</span><input id="timer-label" value="${esc(s.title)}"></label>
        <label class="field"><span>Minutes</span><input id="timer-min" type="number" min="1" max="480" value="10"></label>
        <button class="btn primary" data-act="timer-add" style="flex:0 0 auto">Add timer</button>
      </div>
      <div class="timers" id="timers-box"></div>
    </div>
    <div class="banner info"><strong>Dietary guardrails</strong>
      Alcohol-free table for all ten. Tongue has its own board, knife and tongs — never pass shared gravy over it.
      Nuts and seeds are finely chopped; both hosts in their 80s, including Host A, get boneless chicken and tender vegetables.</div>`;
  paintTimers();
  ensureTimerClock();
  requestWakeLock();
}

/* ---------------- SHOPPING ---------------- */
function renderShop() {
  const b = basket();
  const rowById = new Map(b.rows.map((r) => [r.line.id, r]));
  const groups = {};
  for (const l of state.lines) {
    const key = shopGroup === 'shop'
      ? (rowById.get(l.id)?.selected?.entry.store ? storeName(rowById.get(l.id).selected.entry.store) : 'No shop assigned')
      : l.category;
    (groups[key] ||= []).push(l);
  }
  const body = Object.keys(groups).sort().map((g) => `
    <div class="group-title">${esc(g)}</div>
    ${groups[g].map((l) => {
      const r = rowById.get(l.id);
      const price = r?.selected
        ? `<span class="tag ${r.status === 'compared' ? '' : 'gold'}">${r.status === 'compared' ? '✓ ' : ''}${shortName(r.selected.entry.store)} ${E.formatZAR(r.selected.costCents)}</span>`
        : '<span class="tag rose">unpriced</span>';
      return `<div class="line ${l.ticked ? 'done' : ''}">
        <input type="checkbox" data-tick="${esc(l.id)}" ${l.ticked ? 'checked' : ''} aria-label="Mark ${esc(l.name)} as bought">
        <div class="name">${esc(l.name)}${l.note ? `<div class="small muted">${esc(l.note)}</div>` : ''}
          <div class="small"><label style="display:inline-flex;gap:6px;align-items:center;text-transform:none;letter-spacing:0;font-weight:400;margin:4px 0 0">
            <input type="checkbox" data-pantry="${esc(l.id)}" ${l.pantry ? 'checked' : ''}> Already in pantry</label></div></div>
        <div class="qty">${scaledQty(l)} ${esc(l.unit)}</div>
        <div class="price">${price}<br><button class="btn small" data-act="add-price" data-id="${esc(l.id)}">+ price</button></div>
      </div>`;
    }).join('')}`).join('');

  const ticked = state.lines.filter((l) => l.ticked).length;
  $('#view').innerHTML = `
    <h2 class="sec">Shopping list</h2>
    <p class="lede">Auto-generated from the menu and scaled to ${state.guestCount} people at the table. Duplicate ingredients are merged. Everything works offline.</p>
    <div class="rule"></div>
    <div class="grid3" style="margin-bottom:14px">
      <div class="stat"><div class="v">${state.lines.length}</div><div class="k">lines</div></div>
      <div class="stat"><div class="v">${ticked}</div><div class="k">ticked off</div></div>
      <div class="stat"><div class="v">${Math.round(b.coverage * 100)}%</div><div class="k">price coverage</div></div>
    </div>
    <div class="card">
      <div class="row" style="margin-bottom:8px">
        <label class="field"><span>People at the table</span><input type="number" min="1" max="40" data-set="guestCount" value="${state.guestCount}"></label>
        <label class="field"><span>Group by</span><select data-set="shopGroup"><option value="category" ${shopGroup === 'category' ? 'selected' : ''}>Aisle / category</option><option value="shop" ${shopGroup === 'shop' ? 'selected' : ''}>Cheapest shop</option></select></label>
      </div>
      <div class="btn-row">
        <button class="btn small" data-act="add-adhoc">+ Ad-hoc item</button>
        <button class="btn small" data-act="export-csv">Export CSV</button>
        <button class="btn small" data-act="print-cards">Print large-print list</button>
        <button class="btn small" data-act="untick-all">Clear ticks</button>
      </div>
      ${body}
    </div>
    <div class="banner warn"><strong>Spar Port Alfred is closed on Christmas Day</strong>
      Do all shopping by 24 December. The Agenda tab will flag any task placed on the 25th.</div>`;
}

/* ---------------- AGENDA ---------------- */
function renderAgenda() {
  const closures = D.STORE_CLOSURES.filter((c) => c.date === state.today);
  const events = D.RUN_SHEET.map((e, i) => {
    const override = state.agendaOverrides[i];
    const when = override || e.time;
    const isXmas = /25 December|2026-12-25/.test(when);
    return `<li><b>${esc(when)} ${isXmas ? '<span class="bad">(shop closed)</span>' : ''}</b>
      <span>${esc(e.task)}</span>
      <div class="phase">${e.phase === 'prep' ? 'make-ahead' : 'Christmas Day'} ·
      <button class="btn small" data-act="agenda-move" data-i="${i}">Reschedule</button></div></li>`;
  }).join('');

  $('#view').innerHTML = `
    <h2 class="sec">Agenda</h2>
    <p class="lede">Seeded from the documented run sheet. Reminders use notifications while the app is open; store closures are checked against your viewing date.</p>
    <div class="rule"></div>
    <div class="card">
      <label class="field"><span>Viewing date</span><input type="date" data-set="today" value="${state.today}"></label>
      <div class="btn-row">
        <button class="btn small" data-act="date-preset" data-d="2026-11-19">19 Nov (research)</button>
        <button class="btn small" data-act="date-preset" data-d="2026-11-23">23 Nov (prices expire)</button>
        <button class="btn small" data-act="date-preset" data-d="2026-12-25">25 Dec (Christmas)</button>
      </div>
    </div>
    ${closures.length ? `<div class="banner bad"><strong>${esc(closures[0].label)}</strong>
      Any shopping task on this date must move to 24 December or earlier.</div>` : ''}
    <div class="card"><h3>Prep &amp; cook calendar</h3><ul class="tl">${events}</ul></div>
    <div class="card">
      <h3>Reminders</h3>
      <p class="lede">Notifications are optional and only requested when you add a timer or reminder.</p>
      <div class="btn-row"><button class="btn small" data-act="ask-notifications">Enable notifications</button>
      <button class="btn small" data-act="remind-today">Remind me about today's prep</button></div>
    </div>
    <div class="card"><h3>Store hours (Port Alfred)</h3>
      <div class="table-wrap"><table><thead><tr><th>Shop</th><th>Hours</th><th>Note</th></tr></thead><tbody>
      ${D.STORES.map((s) => `<tr><td><strong>${esc(s.name)}</strong></td><td class="small">${esc(s.hours)}</td><td class="small">${esc(s.note)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
}

/* ---------------- COST & ROUTE ---------------- */
function renderCost() {
  const prices = allPrices();
  const b = basket();
  const compared = b.rows.filter((r) => r.status === 'compared');
  const single = b.rows.filter((r) => r.status === 'single');
  const unpriced = b.rows.filter((r) => !r.selected);

  const compareRows = b.rows.filter((r) => r.options.length || r.reasons.length).map((r) => {
    const cells = D.STORES.map((s) => {
      const o = r.options.find((x) => x.entry.store === s.id);
      return `<td class="nowrap">${o ? `<strong>${E.formatZAR(o.costCents)}</strong><div class="small muted">${E.formatZAR(o.entry.unitCents)}/unit</div>` : '<span class="muted small">no price</span>'}</td>`;
    }).join('');
    return `<tr><td><strong>${esc(r.line.name)}</strong><div class="small muted">${r.line.qty} ${esc(r.line.unit)} · ${esc(r.status === 'compared' ? 'cheapest verified' : r.status === 'single' ? 'single source' : 'insufficient data')}</div></td>
      ${cells}<td class="nowrap">${r.selected ? E.formatZAR(r.selected.costCents) : '—'}</td>
      <td><button class="btn small" data-act="add-price" data-id="${esc(r.line.id)}">+ price</button></td></tr>`;
  }).join('');

  const split = D.STORES.map((s) => {
    const items = b.split[s.id] || [];
    const subtotal = items.reduce((a, x) => a + x.costCents, 0);
    return `<div class="card"><h3>${esc(s.name)} <span class="tag">${items.length} lines · ${E.formatZAR(subtotal)}</span></h3>
      ${items.length ? `<ul class="small">${items.map((x) => `<li>${esc(x.line.name)} — ${E.formatZAR(x.costCents)} <span class="muted">(${esc(x.product)})</span></li>`).join('')}</ul>` : '<p class="small muted">No priced lines assigned here.</p>'}
      </div>`;
  }).join('');

  const shopLines = state.lines.map((l) => {
    const r = b.rows.find((x) => x.line.id === l.id);
    const here = r?.selected?.entry.store === singleShop;
    return `<div class="line ${l.ticked ? 'done' : ''}"><div class="name">${esc(l.name)}</div>
      <div class="qty">${here ? E.formatZAR(r.selected.costCents) : '<span class="tag rose">no price here</span>'}</div></div>`;
  }).join('');
  const shopTotal = Object.values(b.split[singleShop] || []).reduce((a, x) => a + x.costCents, 0);

  const freshness = prices.filter((p) => p.validTo || p.excluded).map((p) => {
    const expired = E.isExpired(p, state.today);
    const excluded = !!p.excluded;
    return `<tr><td>${esc(shortName(p.store))}</td><td><strong>${esc(p.product)}</strong></td>
      <td class="nowrap">${p.priceCents != null ? E.formatZAR(p.priceCents) : '—'}</td>
      <td class="nowrap small">${p.validTo || 'user-entered'}</td>
      <td>${excluded ? '<span class="tag rose">EXCLUDED · alcohol</span>' : expired ? '<span class="tag rose">Expired — re-check price</span>' : '<span class="tag">current</span>'}</td></tr>`;
  }).join('');

  $('#view').innerHTML = `
    <h2 class="sec">Cost &amp; cheaper route</h2>
    <p class="lede">Every figure below is a source-linked record — never a guess. Pick n Pay, Woolworths and Spar only.</p>
    <div class="rule"></div>

    <div class="banner ${b.complete ? 'info' : 'warn'}">
      <strong>${b.pricedCount} of ${b.totalCount} lines priced (${Math.round(b.coverage * 100)}%) — ${b.missing.length} prices still needed</strong>
      No full-basket total is available. The figure below is a <strong>partial subtotal</strong> of priced lines only, valid until the catalogue dates shown.
    </div>
    <div class="grid3" style="margin-bottom:14px">
      <div class="stat"><div class="v">${E.formatZAR(b.totalCents)}</div><div class="k">partial subtotal</div></div>
      <div class="stat"><div class="v">${compared.length}</div><div class="k">lines comparable</div></div>
      <div class="stat"><div class="v">${single.length}</div><div class="k">single-source lines</div></div>
    </div>
    <div class="btn-row">
      <button class="btn small ${costView === 'split' ? 'primary' : ''}" data-act="cost-view" data-v="split">Cheapest split basket</button>
      <button class="btn small ${costView === 'single' ? 'primary' : ''}" data-act="cost-view" data-v="single">Single shop</button>
      <button class="btn small ${costView === 'compare' ? 'primary' : ''}" data-act="cost-view" data-v="compare">Compare table</button>
    </div>

    <div id="cost-body">${costView === 'split' ? `
      <div class="banner info"><strong>Cheapest verified route per line</strong>
        Like-for-like current prices only. Frozen bone-in chicken and non-matching products are excluded, not substituted.</div>
      ${compared.map((r) => `<div class="card"><h3>${esc(r.line.name)}</h3>
        <p class="small">Cheapest: <strong>${esc(storeName(r.selected.entry.store))}</strong> — ${E.formatZAR(r.selected.costCents)}
        (${E.formatZAR(r.selected.entry.unitCents)}/unit). ${r.savingCents ? `Saving ${E.formatZAR(r.savingCents)} vs the dearest verified option.` : ''}</p>
        <p class="small muted">${esc(r.selected.entry.note || '')}</p>
        ${r.reasons.length ? `<p class="small muted">Excluded: ${esc(r.reasons.join(' · '))}</p>` : ''}</div>`).join('')}
      <h2 class="sec" style="margin-top:20px">Shop-by-shop split</h2><div class="grid2">${split}</div>`
    : costView === 'single' ? `
      <div class="card"><label class="field"><span>Buy everything at</span><select data-set="singleShop">
        ${D.STORES.map((s) => `<option value="${s.id}" ${singleShop === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select></label>
      <div class="banner warn"><strong>${esc(storeName(singleShop))}: ${E.formatZAR(shopTotal)} partial</strong>
        Lines marked “no price here” have no verified price at this shop. The app does not estimate them.</div>
      ${shopLines}</div>`
    : `
      <div class="table-wrap"><table><thead><tr><th>Line</th>${D.STORES.map((s) => `<th>${esc(s.short)}</th>`).join('')}<th>Best</th><th></th></tr></thead>
      <tbody>${compareRows || '<tr><td colspan="6" class="muted">No comparable prices yet.</td></tr>'}</tbody></table></div>
      <p class="small muted" style="margin-top:10px">A line priced at only one shop is labelled “single source”, never “cheapest”. Fewer than two like-for-like prices = “insufficient data to compare”.</p>`}</div>

    <div class="card" style="margin-top:16px"><h3>Price freshness &amp; exclusions</h3>
      <p class="lede">Catalogue rows expire on their valid-until date and are excluded from all totals. Alcohol-containing items are excluded from the alcohol-free table.</p>
      <div class="table-wrap"><table><thead><tr><th>Shop</th><th>Product</th><th>Price</th><th>Valid to</th><th>Status</th></tr></thead><tbody>${freshness}</tbody></table></div>
    </div>

    <div class="card"><h3>Add a price from a till slip</h3>
      <p class="lede">${unpriced.length} lines still need a price. Two taps, works offline, timestamped and kept in your history.</p>
      <div class="btn-row">${unpriced.slice(0, 8).map((r) => `<button class="btn small" data-act="add-price" data-id="${esc(r.line.id)}">+ ${esc(r.line.name)}</button>`).join('')}</div>
      ${unpriced.length > 8 ? `<p class="small muted">…and ${unpriced.length - 8} more in the Shopping tab.</p>` : ''}
    </div>

    <div class="banner info"><strong>Optional travel cost</strong>
      Currently ${E.formatZAR(state.travelCostCents)} per extra shop (you enter it in More). A saving of only a few rand on potatoes is not worth a separate trip.</div>`;
}

/* ---------------- MORE ---------------- */
function renderMore() {
  const flags = Object.entries(D.DIETARY_FLAGS);
  $('#view').innerHTML = `
    <h2 class="sec">More</h2>
    <p class="lede">Settings, dietary guardrails, backup and printable cards. Nothing leaves this device.</p>
    <div class="rule"></div>

    <div class="card"><h3>Dietary guardrails</h3>
      <p class="lede">Host A is one of the hosts. Labels, not medical advice. Confirm the final ingredient list with Host A and her oncology dietitian.</p>
      ${flags.map(([k, v]) => `<span class="tag ${k === 'ALCOHOL_FREE' ? 'rose' : ''}">${esc(v)}</span>`).join('')}
      <div class="banner bad" style="margin-top:12px"><strong>Excluded from the alcohol-free table</strong>
        PnP Brandy Pudding and PnP Brandy Christmas Fruit Cake are flagged and never suggested. No wine, beer or vanilla extract anywhere.</div>
      <div class="banner info"><strong>Shared table is safe for all ten</strong>
        No sugar, yeast, wheat, dairy, vinegar, alcohol or charred cooking. Tongue is red meat at the table — fine — but only three people eat it, so it has its own board, knife, tongs and label.</div>
    </div>

    <div class="card"><h3>Settings</h3>
      <div class="grid2">
        <label class="field"><span>Viewing date</span><input type="date" data-set="today" value="${state.today}"></label>
        <label class="field"><span>People at the table (scales quantities)</span><input type="number" min="1" max="40" data-set="guestCount" value="${state.guestCount}"></label>
        <label class="field"><span>Travel cost per extra shop (R)</span><input type="number" min="0" step="0.01" data-set="travelCostCents" value="${(state.travelCostCents / 100).toFixed(2)}"></label>
        <label class="field"><span>Theme</span><select data-set="theme">
          <option value="auto" ${state.theme === 'auto' ? 'selected' : ''}>System</option>
          <option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light</option>
          <option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dark (AMOLED)</option></select></label>
        <label class="field"><span>Text size (large-print)</span><select data-set="textScale">
          ${[100, 110, 125, 150].map((n) => `<option value="${n}" ${Number(state.textScale) === n ? 'selected' : ''}>${n}%</option>`).join('')}</select></label>
      </div>
      <label class="row" style="display:flex;align-items:center;gap:10px;text-transform:none;letter-spacing:0;flex:0 0 auto">
        <input type="checkbox" data-set="hasLoyaltyCard" ${state.hasLoyaltyCard ? 'checked' : ''} style="flex:0 0 auto">
        <span>I have a Smart Shopper card (loyalty prices apply)</span></label>
      <label class="row" style="display:flex;align-items:center;gap:10px;text-transform:none;letter-spacing:0;flex:0 0 auto">
        <input type="checkbox" data-set="highContrast" ${state.highContrast ? 'checked' : ''} style="flex:0 0 auto">
        <span>High-contrast mode</span></label>
    </div>

    <div class="card"><h3>MIUI reliability (Android only)</h3>
      <p class="lede">Timers use exact alarms, a Cook Mode foreground service and reboot restoration. On Xiaomi, also disable battery restrictions for this app. These buttons do nothing in a browser.</p>
      <div class="btn-row">
        <button class="btn small" data-act="open-battery-settings">Battery optimisation</button>
        <button class="btn small" data-act="open-alarm-settings">Exact alarms</button>
        <button class="btn small" data-act="open-notification-settings">Notifications</button>
      </div>
    </div>

    <div class="card"><h3>Optional LAN sync (off by default)</h3>
      <p class="lede">Core features work in airplane mode. If you run the included zero-dependency sync service on your own computer, enter its address here; nothing is sent unless you tap a button. Only user-entered prices are ever pushed.</p>
      <label class="field"><span>Sync service base URL</span><input data-set="syncUrl" value="${esc(state.syncUrl)}" placeholder="http://192.168.1.20:8787"></label>
      <div class="btn-row">
        <button class="btn small" data-act="sync-test">Test connection</button>
        <button class="btn small" data-act="sync-now">Sync backup</button>
        <button class="btn small" data-act="sync-prices">Push manual prices</button>
      </div>
      <p class="small muted">JSON contract: <code>OPTIONAL-SYNC.md</code>. Reference server: <code>sync-service/server.mjs</code>.</p>
    </div>

    <div class="card"><h3>Backup &amp; data</h3>
      <div class="btn-row">
        <button class="btn small" data-act="export-json">Export backup (JSON)</button>
        <button class="btn small" data-act="import-json">Import backup</button>
        <button class="btn small" data-act="print-cards">Print large-print cards</button>
        <button class="btn small" data-act="reset">Reset to seed data</button>
      </div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
      <p class="small muted">Recipes, prices with timestamps, agenda, checklist state and your durations are all included. Import/export round-trip is tested in <code>npm test</code>.</p>
    </div>

    <div class="card"><h3>Seed sources</h3>
      <ul class="small">
        <li><a href="${D.SOURCES.pnpCatalogue}" target="_blank" rel="noopener">Pick n Pay Eastern Cape catalogue, 16–22 Nov 2026</a></li>
        <li><a href="${D.SOURCES.sparPortAlfred}" target="_blank" rel="noopener">Spar Port Alfred specials, 09–22 Nov 2026</a></li>
        <li><a href="${D.SOURCES.woolChicken}" target="_blank" rel="noopener">Woolworths chicken listings</a></li>
        <li><a href="${D.SOURCES.woolFood}" target="_blank" rel="noopener">Woolworths — “promotions in store and online may vary”</a></li>
      </ul>
      <p class="small muted">Full research with every figure, source and caveat: <code>VERIFIED-PRICES.md</code>.</p>
    </div>`;
}

/* ---------------- PRINT CARDS ---------------- */
function printCards() {
  const dishesHtml = D.DISHES.map((d) => `<h2>${esc(d.title)}</h2><ul>${d.steps.map((s) => `<li>${esc(s.title)}</li>`).join('')}</ul>`).join('');
  $('#print-sheet').innerHTML = `
    <h1>Christmas Lunch for Ten</h1>
    <p>Port Alfred · 13:00 sitting · fully alcohol-free</p>
    ${dishesHtml}
    <h2>Large-print dish labels</h2>
    <div class="label">SHARED — SAFE FOR ALL<small>No sugar · no yeast · no wheat · no dairy · no vinegar · alcohol-free</small></div>
    <div class="label">TONGUE — FOR 3<small>Own board, own knife, own tongs</small></div>
    <div class="label">EXTRAS SIDEOUT<small>For the nine · alcohol-free</small></div>
    <h2>Shopping checklist</h2>
    <ul>${state.lines.map((l) => `<li>☐ ${esc(l.name)} — ${scaledQty(l)} ${esc(l.unit)}</li>`).join('')}</ul>`;
  if (native('printPage')) return; // Android PrintManager, not WebView.print()
  window.print();
}

/* ---------------- EXPORTS ---------------- */
function download(name, text, type = 'text/plain') {
  // Android WebView cannot save blob: URLs; the native bridge uses the
  // system document picker instead. In a browser, fall through to Blob.
  if (native('exportText', name, text, type)) return;
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function applyBackupText(text) {
  state = S.importJSON(text, D.SHOPPING_LINES);
  timers = state.timers || (state.timers = []);
  timerSeq = Math.max(0, ...timers.map((t) => Number(t.requestCode) || 0));
  native('cancelAllTimers');
  const now = Date.now();
  for (const t of timers) {
    if (!t.notified && t.endsAt > now) {
      const mins = Math.max(1, Math.ceil((t.endsAt - now) / 60000));
      t.native = !!native('scheduleTimer', t.label, mins, t.requestCode || (t.requestCode = ++timerSeq));
    }
  }
  saveTimers();
  render();
  toast('Backup imported');
}
// Called by the native document picker with base64 UTF-8 text.
window.__nativeImport = (b64) => {
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    applyBackupText(new TextDecoder().decode(bytes));
  } catch (err) { toast(`Import failed: ${err.message}`); }
};

/* ---------------- OPTIONAL LAN SYNC ---------------- */
function syncBase() {
  const url = String(state.syncUrl || '').trim();
  if (!url) { toast('Add a LAN sync URL in More first'); return null; }
  try { return R.normaliseBaseUrl(url); } catch (err) { toast(err.message); return null; }
}
function ensureDeviceId() {
  if (!state.deviceId) {
    state.deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    S.save(state);
  }
  return state.deviceId;
}
async function syncNow() {
  const base = syncBase(); if (!base) return;
  try {
    const remote = await R.pullBackup(base);
    if (remote && R.newer(state.syncedAt, remote.updatedAt)) {
      applyBackupText(JSON.stringify(remote.state));
      state.syncedAt = remote.updatedAt; S.save(state);
      toast('Pulled newer backup from sync service');
    } else {
      const result = await R.pushBackup(base, state, ensureDeviceId());
      state.syncedAt = result?.updatedAt || new Date().toISOString(); S.save(state);
      toast('Backup pushed — sync service is optional');
    }
  } catch (err) { toast(`Sync failed: ${err.message}`); }
}
async function testSync() {
  const base = syncBase(); if (!base) return;
  try { const h = await R.health(base); toast(`Sync OK · ${h?.service || 'service'}`); }
  catch (err) { toast(`Sync test failed: ${err.message}`); }
}
async function syncPrices() {
  const base = syncBase(); if (!base) return;
  try {
    const result = await R.pushPrices(base, state.customPrices, ensureDeviceId());
    toast(`${result?.accepted ?? state.customPrices.length} manual prices pushed`);
  } catch (err) { toast(`Price sync failed: ${err.message}`); }
}
function exportCSV() {
  const b = basket();
  const byId = new Map(b.rows.map((r) => [r.line.id, r]));
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Item', 'Quantity', 'Unit', 'Category', 'Price status', 'Cost (ZAR)', 'Ticked', 'Pantry'].map(q).join(',')];
  for (const l of state.lines) {
    const r = byId.get(l.id);
    rows.push([l.name, scaledQty(l), l.unit, l.category,
      r?.status || 'no-price', r?.selected ? (r.selected.costCents / 100).toFixed(2) : '',
      l.ticked ? 'yes' : 'no', l.pantry ? 'yes' : 'no'].map(q).join(','));
  }
  download('christmas-lunch-shopping.csv', rows.join('\n'), 'text/csv');
  toast('Shopping list exported');
}

/* ---------------- ADD PRICE MODAL ---------------- */
function addPriceModal(lineId) {
  const line = state.lines.find((l) => l.id === lineId);
  if (!line) return;
  openModal('Add a price', `
    <p class="lede">${esc(line.name)} · ${scaledQty(line)} ${esc(line.unit)}. Enter the amount you actually paid — the app never guesses.</p>
    <label class="field"><span>Shop</span><select id="p-store">${D.STORES.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
    <label class="field"><span>Amount paid for this line (R)</span><input id="p-amount" type="number" min="0" step="0.01" placeholder="0.00" required></label>
    <label class="field"><span>Source</span><select id="p-source"><option value="RECEIPT">Till slip</option><option value="MANUAL">Manual entry</option></select></label>
    <label class="field"><span>Note (optional)</span><input id="p-note" placeholder="e.g. special, 2 kg pack"></label>
    <div class="btn-row"><button class="btn primary" data-act="save-price" data-id="${esc(line.id)}">Save price</button>
    <button class="btn" data-act="close-modal">Cancel</button></div>`, (root) => $('#p-amount', root)?.focus());
}
function savePrice(lineId) {
  const line = state.lines.find((l) => l.id === lineId);
  const amount = Number($('#p-amount')?.value);
  if (!line || !Number.isFinite(amount) || amount <= 0) { toast('Enter a valid amount'); return; }
  const cents = Math.round(amount * 100);
  const qty = Number(scaledQty(line)) || Number(line.qty) || 1;
  state.customPrices.push({
    id: `user-${Date.now()}`, store: $('#p-store').value, matchKey: line.matchKey || `custom-${line.id}`,
    product: `${line.name} (entered)`, packQty: qty, packUnit: line.unit,
    priceCents: cents, unitCents: Math.round(cents / qty),
    validFrom: state.today, validTo: null, source: $('#p-source').value, url: null,
    promotion: false, loyalty: false, likeForLike: true,
    note: $('#p-note').value || 'User-entered — confirmed',
  });
  S.save(state); closeModal(); render(); toast(`Price saved for ${line.name}`);
}

/* ---------------- EVENTS ---------------- */
function render() {
  applyTheme();
  renderHeader();
  ({ run: renderRun, cook: renderCook, shop: renderShop, agenda: renderAgenda, cost: renderCost, more: renderMore })[tab]();
  $$('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  if (tab === 'cook' && btn.dataset.tab !== 'cook') releaseWakeLock();
  tab = btn.dataset.tab;
  render();
});
$('#btn-print').addEventListener('click', printCards);
$('#modal-close').addEventListener('click', closeModal);
$('#modal-back').addEventListener('click', (e) => { if (e.target.id === 'modal-back') closeModal(); });

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const { act, id } = t.dataset;
  switch (act) {
    case 'close-modal': closeModal(); break;
    case 'add-price': addPriceModal(id); break;
    case 'save-price': savePrice(id); break;
    case 'clear-durations': state.durations = {}; S.save(state); render(); toast('Durations cleared'); break;
    case 'cook-next': cookIndex = Math.min(cookIndex + 1, allSteps().length - 1); render(); break;
    case 'cook-prev': cookIndex = Math.max(0, cookIndex - 1); render(); break;
    case 'cook-say': { const s = allSteps()[cookIndex]; speak(`${s.title}. ${s.dish}.`); break; }
    case 'cook-timer': $('#timer-label').value = allSteps()[cookIndex].title; $('#timer-min').focus(); break;
    case 'timer-add': {
      const label = $('#timer-label').value.trim() || 'Timer';
      const min = Math.max(1, Number($('#timer-min').value) || 10);
      const requestCode = ++timerSeq;
      const armed = !!native('scheduleTimer', label, min, requestCode);
      native('requestNotificationPermission');
      timers.push({ id: `t${Date.now()}`, requestCode, label, native: armed,
        endsAt: Date.now() + min * 60000, totalMs: min * 60000, notified: false });
      if (!armed && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      saveTimers(); paintTimers(); ensureTimerClock();
      toast(armed ? `${min} min exact-alarm timer started` : `${min} min timer started`);
      break;
    }
    case 'timer-remove': {
      const gone = timers.find((x) => x.id === id);
      if (gone?.requestCode) native('cancelTimer', gone.requestCode);
      timers = timers.filter((x) => x.id !== id);
      saveTimers(); paintTimers(); break;
    }
    case 'add-adhoc': openModal('Add an item', `
      <label class="field"><span>Name</span><input id="a-name" placeholder="e.g. ice packs"></label>
      <label class="field"><span>Quantity</span><input id="a-qty" type="number" min="1" value="1"></label>
      <label class="field"><span>Unit</span><input id="a-unit" value="each"></label>
      <div class="btn-row"><button class="btn primary" data-act="save-adhoc">Add to list</button>
      <button class="btn" data-act="close-modal">Cancel</button></div>`); break;
    case 'save-adhoc': {
      const name = $('#a-name').value.trim();
      if (!name) { toast('Give the item a name'); return; }
      state.lines.push({ id: `adhoc-${Date.now()}`, name, qty: Number($('#a-qty').value) || 1,
        unit: $('#a-unit').value.trim() || 'each', category: 'Ad-hoc', matchKey: null, ticked: false, pantry: false });
      S.save(state); closeModal(); render(); toast('Item added'); break;
    }
    case 'export-csv': exportCSV(); break;
    case 'export-json': download('christmas-lunch-backup.json', S.exportJSON(state), 'application/json'); toast('Backup exported'); break;
    case 'import-json': if (!native('importText')) $('#import-file')?.click(); break;
    case 'print-cards': printCards(); break;
    case 'untick-all': state.lines.forEach((l) => { l.ticked = false; }); S.save(state); render(); break;
    case 'reset': native('cancelAllTimers'); state = S.reset(D.SHOPPING_LINES); timers = state.timers; cookIndex = 0; render(); toast('Reset to seed data'); break;
    case 'cost-view': costView = t.dataset.v; render(); break;
    case 'date-preset': state.today = t.dataset.d; S.save(state); render(); toast(`Viewing as ${state.today}`); break;
    case 'agenda-move': {
      const i = Number(t.dataset.i);
      openModal('Reschedule task', `
        <p class="lede">${esc(D.RUN_SHEET[i].task)}</p>
        <label class="field"><span>New date / time label</span><input id="ag-when" value="${esc(state.agendaOverrides[i] || D.RUN_SHEET[i].time)}"></label>
        <div class="btn-row"><button class="btn primary" data-act="save-agenda" data-i="${i}">Save</button>
        <button class="btn" data-act="agenda-24" data-i="${i}">Move to 24 December</button></div>`);
      break;
    }
    case 'save-agenda': state.agendaOverrides[Number(t.dataset.i)] = $('#ag-when').value; S.save(state); closeModal(); render(); break;
    case 'agenda-24': state.agendaOverrides[Number(t.dataset.i)] = '24 December (before shops close)'; S.save(state); closeModal(); render(); toast('Moved to 24 December'); break;
    case 'ask-notifications':
      native('requestNotificationPermission');
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(() => toast('Notifications updated'));
      } else toast('Notifications updated in Android settings if needed');
      break;
    case 'remind-today': toast(`Today (${state.today}): check the run sheet`); speak('Check today’s preparation tasks'); break;
    case 'open-battery-settings': native('openBatterySettings'); toast('MIUI: set this app to “No restrictions”'); break;
    case 'open-alarm-settings': native('openExactAlarmSettings'); toast('Allow exact alarms for reliable timers'); break;
    case 'open-notification-settings': native('openNotificationSettings'); toast('Android notification settings'); break;
    case 'sync-now': syncNow(); break;
    case 'sync-test': testSync(); break;
    case 'sync-prices': syncPrices(); break;
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.dur !== undefined) {
    const v = Number(el.value);
    if (v > 0) state.durations[el.dataset.dur] = v;
    else delete state.durations[el.dataset.dur];
    S.save(state); render(); return;
  }
  if (el.dataset.tick !== undefined) {
    const l = state.lines.find((x) => x.id === el.dataset.tick);
    if (l) { l.ticked = el.checked; S.save(state); render(); } return;
  }
  if (el.dataset.pantry !== undefined) {
    const l = state.lines.find((x) => x.id === el.dataset.pantry);
    if (l) { l.pantry = el.checked; S.save(state); render(); } return;
  }
  if (el.id === 'import-file' && el.files?.[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      try { applyBackupText(String(reader.result)); }
      catch (err) { toast(`Import failed: ${err.message}`); }
    };
    reader.readAsText(el.files[0]); return;
  }
  if (el.dataset.set) {
    const k = el.dataset.set;
    if (k === 'shopGroup') { shopGroup = el.value; render(); return; }
    if (k === 'singleShop') { singleShop = el.value; render(); return; }
    if (k === 'hasLoyaltyCard') state.hasLoyaltyCard = el.checked;
    else if (k === 'highContrast') state.highContrast = el.checked;
    else if (k === 'travelCostCents') state.travelCostCents = Math.round((Number(el.value) || 0) * 100);
    else if (k === 'guestCount') state.guestCount = Math.max(1, Number(el.value) || 10);
    else if (k === 'textScale') state.textScale = Math.max(100, Math.min(150, Number(el.value) || 100));
    else state[k] = el.value;
    S.save(state); render(); return;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseWakeLock();
  else if (tab === 'cook') requestWakeLock();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Timers survive a page reload. Native exact alarms survive an app kill / reboot
// and are restored by BootReceiver, so do not re-arm them here.
if (timers.some((t) => !t.notified && t.endsAt > Date.now())) ensureTimerClock();

render();
