/* Christmas Lunch App — Main Logic */
(function() {
'use strict';

const STORAGE_KEY = 'xmas-lunch-data-v1';
const SHOP_CHECKED_KEY = 'xmas-lunch-checked-v1';
const SHOP_CUSTOM_KEY = 'xmas-lunch-custom-v1';

let currentDishId = null;
let currentRecipeId = null;
let shopState = { checked: {}, custom: [] };

// ---- Storage ----
function loadState() {
  try {
    const checked = localStorage.getItem(SHOP_CHECKED_KEY);
    if (checked) shopState.checked = JSON.parse(checked);
    const custom = localStorage.getItem(SHOP_CUSTOM_KEY);
    if (custom) shopState.custom = JSON.parse(custom);
  } catch(e) { console.warn('Storage load failed', e); }
}
function saveState() {
  try {
    localStorage.setItem(SHOP_CHECKED_KEY, JSON.stringify(shopState.checked));
    localStorage.setItem(SHOP_CUSTOM_KEY, JSON.stringify(shopState.custom));
  } catch(e) { console.warn('Storage save failed', e); }
}

// ---- Navigation ----
window.showView = function(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + viewName);
  if (el) {
    el.classList.add('active');
    window.scrollTo(0, 0);
  }
  if (viewName === 'menu') renderMenu();
  if (viewName === 'shopping') renderShopping();
  if (viewName === 'recipes') renderRecipes();
  if (viewName === 'costs') renderCosts();
  if (viewName === 'schedule') renderSchedule();
  if (viewName === 'dietary') renderDietary();
};

// ---- Menu ----
function renderMenu() {
  const container = document.getElementById('menu-list');
  if (!container) return;
  container.innerHTML = MENU.map(d => `
    <div class="dish-item" onclick="showDish(${d.id})">
      <img class="dish-img" src="dishes/${d.img}" alt="${d.name}" onerror="this.style.visibility='hidden'">
      <div class="dish-info">
        <div class="dish-name">${d.name}</div>
        <div class="dish-meta">${d.course}</div>
      </div>
      <span class="dish-course">${d.course.split(' ')[0]}</span>
    </div>
  `).join('');
}

window.showDish = function(id) {
  const d = MENU.find(m => m.id === id);
  if (!d) return;
  currentDishId = id;
  document.getElementById('dish-title').textContent = d.course;
  const container = document.getElementById('dish-detail');
  container.innerHTML = `
    <img class="hero-img" src="dishes/${d.img}" alt="${d.name}" onerror="this.style.display='none'">
    <div class="detail-section">
      <span class="tag">${d.course}</span>
      <h3>${d.name}</h3>
    </div>
    <div class="detail-section">
      <h3>🧾 Ingredients</h3>
      <ul class="ingredients-list">
        ${d.ingredients.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    <div class="detail-section">
      <h3>👨‍🍳 Notes</h3>
      <p class="notes">${d.notes}</p>
    </div>
    <div class="detail-section">
      <h3>💰 Cost</h3>
      <p class="cost-badge">R ${d.cost.toFixed(2)}</p>
    </div>
  `;
  showView('dish');
};

// ---- Recipes ----
function renderRecipes() {
  const container = document.getElementById('recipe-list');
  if (!container) return;
  container.innerHTML = MENU.map(d => `
    <div class="dish-item" onclick="showRecipe(${d.id})">
      <div class="dish-info">
        <div class="dish-name">${d.name}</div>
        <div class="dish-meta">Tap for full method</div>
      </div>
      <span>→</span>
    </div>
  `).join('');
}

window.showRecipe = function(id) {
  const d = MENU.find(m => m.id === id);
  if (!d) return;
  currentRecipeId = id;
  document.getElementById('recipe-title').textContent = d.name;
  const container = document.getElementById('recipe-detail');

  // Generate a step-by-step method from the notes
  const steps = generateMethod(d);

  container.innerHTML = `
    <div class="detail-section">
      <h3>📋 Ingredients (for 10)</h3>
      <ul>
        ${d.ingredients.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    <div class="detail-section">
      <h3>👩‍🍳 Method</h3>
      <ol>
        ${steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </div>
    <div class="detail-section">
      <h3>💡 Notes</h3>
      <p>${d.notes}</p>
    </div>
  `;
  showView('recipe');
};

function generateMethod(d) {
  // Parse notes into steps, or provide generic steps
  const noteSteps = d.notes.split('. ').filter(s => s.trim().length > 3);
  if (noteSteps.length >= 2) {
    return noteSteps.map(s => s.trim().replace(/\.$/, '') + '.');
  }
  return [
    "Gather and prep all ingredients.",
    d.notes,
    "Taste and adjust seasoning before serving.",
    "Serve at the appropriate temperature.",
  ];
}

// ---- Shopping ----
function getAllShopItems() {
  // Merge default items with custom items
  return [...SHOPPING, ...shopState.custom];
}

function renderShopping() {
  const allItems = getAllShopItems();
  const container = document.getElementById('shopping-list');
  const summary = document.getElementById('shopping-summary');

  const totalCost = allItems.reduce((sum, i) => sum + (i.price || 0), 0);
  const checkedCount = Object.keys(shopState.checked).filter(k => shopState.checked[k]).length;
  const remaining = allItems.length - checkedCount;

  summary.innerHTML = `
    <div>
      <div>${checkedCount} / ${allItems.length} collected</div>
      <div style="font-size:0.8rem;color:var(--text-light)">${remaining} remaining</div>
    </div>
    <div class="total">R ${totalCost.toFixed(2)}</div>
  `;

  const navCount = document.getElementById('shopping-count-nav');
  if (navCount) navCount.textContent = allItems.length + ' items';

  // Group by category
  const categories = {};
  allItems.forEach(item => {
    const cat = item.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  const catOrder = ['Meat', 'Veg', 'Fruit', 'Herbs', 'Nuts', 'Dairy', 'Pantry', 'Other'];
  let html = '<div class="shop-add-form">' +
    '<input type="text" id="new-item-name" placeholder="Add item..." />' +
    '<button onclick="addShoppingItem()">Add</button></div>';

  catOrder.forEach(cat => {
    if (!categories[cat]) return;
    html += `<div style="font-size:0.8rem;font-weight:700;color:var(--primary);padding:12px 4px 4px;text-transform:uppercase;">${cat}</div>`;
    categories[cat].forEach(item => {
      const isChecked = shopState.checked[item.id + '_' + item.name];
      html += `
        <div class="shop-item ${isChecked ? 'checked' : ''}" data-id="${item.id}" data-name="${item.name.replace(/"/g, '&quot;')}">
          <div class="check" onclick="toggleCheck(${item.id}, '${item.name.replace(/'/g, "\\'")}')">${isChecked ? '✓' : ''}</div>
          <div class="shop-info">
            <div class="shop-name">${item.name}</div>
            <div class="shop-meta">${item.qty} · ${item.shop}</div>
          </div>
          <div class="shop-price">R ${item.price.toFixed(2)}</div>
          ${item.id >= 100 ? `<button class="del-btn" onclick="deleteCustomItem(${item.id})">×</button>` : ''}
        </div>
      `;
    });
  });

  container.innerHTML = html;
}

window.toggleCheck = function(id, name) {
  const key = id + '_' + name;
  shopState.checked[key] = !shopState.checked[key];
  saveState();
  renderShopping();
};

window.addShoppingItem = function() {
  const input = document.getElementById('new-item-name');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;
  const newId = 1000 + shopState.custom.length;
  shopState.custom.push({
    id: newId,
    name: name,
    qty: '1',
    price: 0,
    shop: '—',
    category: 'Other'
  });
  input.value = '';
  saveState();
  renderShopping();
};

window.deleteCustomItem = function(id) {
  shopState.custom = shopState.custom.filter(i => i.id !== id);
  saveState();
  renderShopping();
};

// ---- Costs ----
function renderCosts() {
  const summary = document.getElementById('cost-summary');
  const table = document.getElementById('cost-table');

  const grandTotal = SHOPPING.reduce((sum, i) => sum + (i.price || 0), 0);
  const perHead = grandTotal / 10;

  summary.innerHTML = `
    <div class="big-num">R ${perHead.toFixed(0)}</div>
    <div class="label">per head (10 guests)</div>
    <div class="row"><span>Grand total</span><span>R ${grandTotal.toFixed(2)}</span></div>
    <div class="row"><span>Items</span><span>${SHOPPING.length}</span></div>
    <div class="row"><span>Priced</span><span>${SHOPPING.filter(i => i.price > 0).length}</span></div>
  `;

  table.innerHTML = SHOPPING.map(i => `
    <div class="cost-row ${i.price === 0 ? 'held' : ''}">
      <div class="ing-name">${i.name}</div>
      <div class="ing-price">${i.price > 0 ? 'R ' + i.price.toFixed(2) : 'TBC'}</div>
    </div>
  `).join('');
}

// ---- Schedule ----
function renderSchedule() {
  const container = document.getElementById('schedule-list');
  container.innerHTML = SCHEDULE.map(s => `
    <div class="schedule-item">
      <div class="time">${s.time}</div>
      <div class="task">${s.task}</div>
    </div>
  `).join('');
}

// ---- Dietary ----
function renderDietary() {
  const container = document.getElementById('dietary-content');
  container.innerHTML = DIETARY.map(d => `
    <div class="dietary-card">
      <h3>${d.title}</h3>
      ${d.notes.map(n => `<p>${n}</p>`).join('')}
    </div>
  `).join('');
}

// ---- Service Worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(function(reg) {
      console.log('SW registered:', reg.scope);
    }).catch(function(err) {
      console.warn('SW registration failed:', err);
    });
  });
}

// ---- Init ----
loadState();
renderMenu(); // Pre-render

})();
