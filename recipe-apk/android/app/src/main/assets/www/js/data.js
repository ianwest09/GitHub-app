// Seed data. Every recipe/quantity/clock time comes from christmas-lunch-menu/MENU.md.
// Every price comes from VERIFIED-PRICES.md (real, source-linked, dated).
// No duration and no price is invented here: null means "Set time" / "unpriced".

export const STORES = [
  { id: 'pnp', name: 'Pick n Pay', short: 'PnP', hours: 'Mon–Sat 06:30–20:00 · Sun 06:30–19:00', closed: ['2026-12-25-note'], note: 'Corner Masonic & Gluckman St, Port Alfred' },
  { id: 'woolworths', name: 'Woolworths', short: 'Woolies', hours: 'Online listings used — local store hours not verified', closed: [], note: 'Guzzle lists no current Port Alfred catalogue specials' },
  { id: 'spar', name: 'Spar', short: 'Spar', hours: 'Mon–Fri 07:00–19:00 · Sat 07:00–19:00 · Sun 07:30–17:00', closed: ['2026-12-25'], note: '32–36 Biscay Rd, Port Alfred — CLOSED CHRISTMAS DAY' },
];

export const SOURCES = {
  pnpCatalogue: 'https://cdnm.heyzine.com/flip-book/pdf/2e4baf279fe06cfb532f5802ec2764b23103d818.pdf',
  sparPortAlfred: 'https://www.guzzle.co.za/spar/port-alfred',
  woolChicken: 'https://www.woolworths.co.za/cat/Chicken-Portions-Other/_/N-1bisvo2',
  woolPotatoes: 'https://www.woolworths.co.za/cat/_/N-tc3vp2',
  woolCauli: 'https://www.woolworths.co.za/cat/Broccoli-Cauliflower/_/N-0Z33kgtk',
  woolCucumber: 'https://www.woolworths.co.za/cat/Foo/WCellar/Food/_/N-1z13sk5',
  woolFood: 'https://www.woolworths.co.za/browse/food',
};

// priceInCents / normalisedUnitPriceInCents are cents (ZAR).
// normalised unit = per kg for weight, per litre for volume, per item otherwise.
export const PRICE_ENTRIES = [
  { id: 'pnp-chicken-breast', store: 'pnp', matchKey: 'chicken-boneless', product: 'PnP Fresh Skinless Chicken Breast Fillets 4s or 12s', packQty: 1, packUnit: 'kg', priceCents: 7999, unitCents: 7999, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: true, loyalty: false, likeForLike: true, note: 'Per kg. Catalogue valid 16–22 Nov 2026. Prices include VAT.' },
  { id: 'pnp-chicken-drumstick', store: 'pnp', matchKey: 'chicken-boneless', product: 'PnP Fresh Chicken 4 Drumsticks & 4 Thighs', packQty: 1, packUnit: 'kg', priceCents: 7699, unitCents: 7699, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: true, loyalty: false, likeForLike: false, note: 'Bone-in — NOT like-for-like with the boneless requirement for both hosts in their 80s, including Host A.' },
  { id: 'pnp-potatoes-bundle', store: 'pnp', matchKey: 'potatoes', product: 'PnP All Purpose Potatoes 2 kg (or Tomatoes 1.5 kg / Gem Squash / Carrots bag / Green Peppers 800 g)', packQty: 2, packUnit: 'kg', priceCents: 3500, unitCents: 1750, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: true, loyalty: false, likeForLike: true, bundle: 'BUY ANY 4 qualifying items (bundle)', bundleMinItems: 4, bundleQualifyingKeys: ['potatoes', 'tomatoes'], note: 'Bundle-derived price per 2 kg; applies ONLY with 4 qualifying items in the basket.' },
  { id: 'pnp-blueberries', store: 'pnp', matchKey: 'berries', product: 'PnP Blueberries on the Run', packQty: null, packUnit: 'pack', priceCents: 4500, unitCents: null, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: true, loyalty: false, likeForLike: false, bundle: 'Two-item bundle (base pack size not stated)', note: 'Pack size not stated — no usable unit price.' },
  { id: 'pnp-mushrooms', store: 'pnp', matchKey: 'mushrooms', product: 'PnP Chopped Mixed Mushrooms 400 g', packQty: 0.4, packUnit: 'kg', priceCents: null, unitCents: null, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: true, loyalty: false, likeForLike: false, bundle: 'Two-item saving (no base price listed)', note: 'No base price in the catalogue — no usable price.' },
  { id: 'pnp-fruitcake-alcfree', store: 'pnp', matchKey: 'extras-pudding', product: 'PnP Fruit Cake Alcohol Free 350 g', packQty: 0.35, packUnit: 'kg', priceCents: 5999, unitCents: null, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: false, loyalty: false, likeForLike: true, dietary: ['SUGAR', 'WHEAT', 'DAIRY'], note: 'Alcohol-free option for the extras sideboard; not for Host A (one of the hosts).' },
  { id: 'pnp-brandy-pudding', store: 'pnp', matchKey: 'extras-pudding', product: 'PnP Brandy Pudding 450 g', packQty: 0.45, packUnit: 'kg', priceCents: 14999, unitCents: null, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: false, loyalty: false, likeForLike: false, excluded: 'ALCOHOL_FREE', note: 'EXCLUDED — contains alcohol.' },
  { id: 'pnp-brandy-cake', store: 'pnp', matchKey: 'extras-pudding', product: 'PnP Brandy Christmas Fruit Cake 350 g', packQty: 0.35, packUnit: 'kg', priceCents: 7999, unitCents: null, validFrom: '2026-11-16', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.pnpCatalogue, promotion: false, loyalty: false, likeForLike: false, excluded: 'ALCOHOL_FREE', note: 'EXCLUDED — contains alcohol.' },
  { id: 'spar-chicken-frozen', store: 'spar', matchKey: 'chicken-boneless', product: 'SPAR IQF Mixed Chicken Portions 2 kg', packQty: 2, packUnit: 'kg', priceCents: 7999, unitCents: 4000, validFrom: '2026-11-09', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.sparPortAlfred, promotion: true, loyalty: false, likeForLike: false, note: 'Cheapest per kg but FROZEN, bone-in, mixed portions — not like-for-like.' },
  { id: 'spar-rice-parboiled', store: 'spar', matchKey: 'brown-rice', product: 'Spekko Long Grain Parboiled White Rice 2 kg', packQty: 2, packUnit: 'kg', priceCents: 3299, unitCents: 1650, validFrom: '2026-11-09', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.sparPortAlfred, promotion: true, loyalty: false, likeForLike: false, note: 'Different product — menu needs brown rice. Not like-for-like.' },
  { id: 'spar-oil-blend', store: 'spar', matchKey: 'olive-oil', product: 'B-Well Omega 3 Cooking Oil 2 L', packQty: 2, packUnit: 'L', priceCents: 5999, unitCents: 3000, validFrom: '2026-11-09', validTo: '2026-11-22', source: 'CATALOGUE', url: SOURCES.sparPortAlfred, promotion: true, loyalty: false, likeForLike: false, note: 'Different product — menu needs olive oil. Not like-for-like.' },
  { id: 'spar-mixed-veg-expired', store: 'spar', matchKey: 'frozen-veg', product: 'Harvestime Frozen Mixed Vegetables 1 kg', packQty: 1, packUnit: 'kg', priceCents: 4699, unitCents: 4699, validFrom: '2026-10-07', validTo: '2026-10-18', source: 'CATALOGUE', url: SOURCES.sparPortAlfred, promotion: true, loyalty: false, likeForLike: false, note: 'EXPIRED catalogue (07–18 Oct 2026) — kept only to demonstrate auto-expiry.' },
  { id: 'wool-chicken-breast-15', store: 'woolworths', matchKey: 'chicken-boneless', product: 'Skinless Chicken Breast Fillets Avg 1.5 kg', packQty: 1.5, packUnit: 'kg', priceCents: 18749, unitCents: 12499, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolChicken, promotion: false, loyalty: false, likeForLike: true, note: 'Online listing, retrieved 19 Nov 2026. Promotions in store and online may vary.' },
  { id: 'wool-chicken-thigh', store: 'woolworths', matchKey: 'chicken-boneless', product: 'Skinless Chicken Thigh Fillets Avg 700 g', packQty: 0.7, packUnit: 'kg', priceCents: 16559, unitCents: 23999, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolChicken, promotion: false, loyalty: false, likeForLike: true, note: 'Online listing, retrieved 19 Nov 2026.' },
  { id: 'wool-chicken-breast-450', store: 'woolworths', matchKey: 'chicken-boneless', product: 'Skinless Chicken Breast Avg 450 g', packQty: 0.45, packUnit: 'kg', priceCents: 7799, unitCents: 12999, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolChicken, promotion: false, loyalty: false, likeForLike: true, note: 'Online listing, retrieved 19 Nov 2026.' },
  { id: 'wool-chicken-portions', store: 'woolworths', matchKey: 'chicken-boneless', product: 'Chicken Portions Avg 1.5 kg', packQty: 1.5, packUnit: 'kg', priceCents: 17249, unitCents: 11499, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolChicken, promotion: false, loyalty: false, likeForLike: false, note: 'Bone-in — not like-for-like with boneless.' },
  { id: 'wool-potatoes', store: 'woolworths', matchKey: 'potatoes', product: 'Medium Potatoes 2 kg', packQty: 2, packUnit: 'kg', priceCents: 3999, unitCents: 2000, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolPotatoes, promotion: false, loyalty: false, likeForLike: true, note: 'Online listing; pack price and per-kg equivalent are derived from the price records.' },
  { id: 'wool-cauliflower', store: 'woolworths', matchKey: 'cauliflower', product: 'Whole Cauliflower Avg 500 g', packQty: 0.5, packUnit: 'kg', priceCents: 3504, unitCents: 7300, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolCauli, promotion: false, loyalty: false, likeForLike: true, note: 'Single source — no price at PnP or Spar.' },
  { id: 'wool-cucumber', store: 'woolworths', matchKey: 'cucumber', product: 'English Cucumber', packQty: null, packUnit: 'each', priceCents: 1999, unitCents: null, validFrom: '2026-11-19', validTo: '2026-11-22', source: 'STORE_LISTING', url: SOURCES.woolCucumber, promotion: false, loyalty: false, likeForLike: true, note: 'Pack size not stated — no unit price. Single source.' },
];

// Line IDs and step IDs retired with the former rice-based dessert. store.js uses these
// to migrate saved version-1 state without discarding user settings or other local data.
export const RETIRED_SHOPPING_LINE_IDS = ['l28', 'l29', 'l30', 'l31', 'l32'];
export const RETIRED_PRICE_MATCH_KEYS = ['coconut-milk', 'rice-dessert', 'vanilla-pod', 'berries', 'toasted-coconut'];
export const RETIRED_STEP_IDS = ['s18'];

// Explicit held menu items: recipe/preparation placeholders and an optional
// candidate whose previous ingredient list is supplied for Host A review only.
export const MENU_PLACEHOLDERS = [
  {
    id: 'gammon',
    status: 'Preparation pending',
    title: 'Smoked gammon — separate labelled platter',
    detail: 'Cured/processed pork; not for Host A or Guest B. Quantity, preparation, source and label to be supplied. Keep it on its own platter with its own board, knife and tongs, apart from the shared dishes and the tongue platter; prep last, wash hands and change utensils. No dietary claims are made.',
  },
  {
    id: 'icecream',
    status: 'Recipe pending',
    title: 'Homemade ice-cream — recipe to be supplied',
    detail: 'Recipe-pending placeholder only. Do not buy ingredients, prepare, treat as shared-safe, or serve to Host A or Guest B until the recipe, ingredient labels and Host A’s dietitian check are complete.',
  },
  {
    id: 'coconut-rice',
    status: 'Host A clearance pending',
    title: 'Coconut rice pudding — optional candidate',
    detail: 'Restored as an option to review, not as a cleared shared dessert. Previous ingredient list: rice simmered in coconut milk with cinnamon and a vanilla pod (not extract), layered with berries and toasted coconut. The previous menu described it as soft, with no added sugar, dairy, wheat or gelatine; that description is a review item, not a safety claim. Do not buy, prepare, serve to anyone including Host A or Guest B, or treat it as shared-safe until Host A and her oncology dietitian clear the final ingredient list and every packaged label.',
  },
];

// matchKey links a shopping line to comparable price entries. null = no verified price anywhere.
// qty: null is a recipe-pending line; clearancePending lines show quantities for review
// but stay held from shopping and price entry until Host A/dietitian clearance.
export const SHOPPING_LINES = [
  { id: 'l01', name: 'Boneless chicken thighs / supremes', qty: 1.8, unit: 'kg', category: 'Meat & poultry', matchKey: 'chicken-boneless', flags: ['CHICKEN_ONLY'] },
  { id: 'l02', name: 'Beef / ox tongue (ordered ahead)', qty: 1.5, unit: 'kg', category: 'Meat & poultry', matchKey: 'tongue', flags: ['TONGUE_FOR_THREE', 'RED_MEAT_OK'], note: 'No verified price at any shop — order from butcher, enter till-slip price.' },
  { id: 'l03', name: 'Baby potatoes', qty: 1.5, unit: 'kg', category: 'Fruit & veg', matchKey: 'potatoes', bundleQ: true },
  { id: 'l04', name: 'Brown rice', qty: 0.4, unit: 'kg', category: 'Pantry', matchKey: 'brown-rice' },
  { id: 'l05', name: 'Brown / red lentils', qty: 0.2, unit: 'kg', category: 'Pantry', matchKey: 'lentils' },
  { id: 'l06', name: 'Cornflour (Maizena)', qty: 0.1, unit: 'kg', category: 'Pantry', matchKey: 'cornflour' },
  { id: 'l07', name: 'Cauliflower', qty: 2, unit: 'head', category: 'Fruit & veg', matchKey: 'cauliflower' },
  { id: 'l08', name: 'Green beans', qty: 0.4, unit: 'kg', category: 'Fruit & veg', matchKey: 'green-beans' },
  { id: 'l09', name: 'Baby carrots', qty: 0.4, unit: 'kg', category: 'Fruit & veg', matchKey: 'carrots' },
  { id: 'l10', name: 'Courgettes', qty: 0.4, unit: 'kg', category: 'Fruit & veg', matchKey: 'courgettes' },
  { id: 'l11', name: 'Mushrooms', qty: 0.4, unit: 'kg', category: 'Fruit & veg', matchKey: 'mushrooms' },
  { id: 'l12', name: 'Leeks', qty: 3, unit: 'each', category: 'Fruit & veg', matchKey: 'leeks' },
  { id: 'l13', name: 'Celery', qty: 1, unit: 'head', category: 'Fruit & veg', matchKey: 'celery' },
  { id: 'l14', name: 'Salad leaves', qty: 2, unit: 'head', category: 'Fruit & veg', matchKey: 'salad-leaves' },
  { id: 'l15', name: 'Cucumber', qty: 3, unit: 'each', category: 'Fruit & veg', matchKey: 'cucumber' },
  { id: 'l16', name: 'Fennel', qty: 2, unit: 'bulb', category: 'Fruit & veg', matchKey: 'fennel' },
  { id: 'l17', name: 'Avocado', qty: 3, unit: 'each', category: 'Fruit & veg', matchKey: 'avocado' },
  { id: 'l18', name: 'Radish', qty: 1, unit: 'bunch', category: 'Fruit & veg', matchKey: 'radish' },
  { id: 'l19', name: 'Tomatoes', qty: 0.6, unit: 'kg', category: 'Fruit & veg', matchKey: 'tomatoes', bundleQ: true },
  { id: 'l20', name: 'Red peppers', qty: 3, unit: 'each', category: 'Fruit & veg', matchKey: 'peppers' },
  { id: 'l21', name: 'Basil', qty: 1, unit: 'bunch', category: 'Herbs', matchKey: 'basil' },
  { id: 'l22', name: 'Cooked white beans', qty: 0.5, unit: 'kg', category: 'Pantry', matchKey: 'white-beans' },
  { id: 'l23', name: 'Rice cakes / rice crackers', qty: 2, unit: 'pack', category: 'Pantry', matchKey: 'rice-cakes' },
  { id: 'l24', name: 'Almonds (finely chopped)', qty: 0.2, unit: 'kg', category: 'Nuts & seeds', matchKey: 'almonds' },
  { id: 'l25', name: 'Pumpkin seeds (finely chopped)', qty: 0.15, unit: 'kg', category: 'Nuts & seeds', matchKey: 'pumpkin-seeds' },
  { id: 'l26', name: 'Sunflower seeds (ground)', qty: 0.1, unit: 'kg', category: 'Nuts & seeds', matchKey: 'sunflower-seeds' },
  { id: 'l27', name: 'Pecans (finely chopped)', qty: 0.15, unit: 'kg', category: 'Nuts & seeds', matchKey: 'pecans' },
  { id: 'l33', name: 'Pears (small)', qty: 10, unit: 'each', category: 'Fruit & veg', matchKey: 'pears' },
  { id: 'l34', name: 'Lemons', qty: 10, unit: 'each', category: 'Fruit & veg', matchKey: 'lemons', note: 'Merged from 3 recipes (dip, salad, drinks).' },
  { id: 'l35', name: 'Garlic', qty: 2, unit: 'head', category: 'Fruit & veg', matchKey: 'garlic' },
  { id: 'l36', name: 'Fresh herbs (rosemary, thyme, parsley, dill, mint)', qty: 1, unit: 'bundle', category: 'Herbs', matchKey: 'herbs' },
  { id: 'l37', name: 'Rooibos, mint, decaf coffee, sparkling water, granadilla & lime', qty: 1, unit: 'set', category: 'Drinks', matchKey: 'drinks' },
  { id: 'l38', name: 'Olive oil, cinnamon, nutmeg, pepper, sea salt', qty: 1, unit: 'set', category: 'Pantry', matchKey: 'olive-oil' },
  { id: 'l39', name: 'Cooler + ice packs, large-print labels, separate boards/knives/tongs', qty: 1, unit: 'set', category: 'Kit (bring from home)', matchKey: 'kit', note: 'Separate boards, knives and tongs for the tongue and smoked gammon platters.' },
  { id: 'l40', name: 'Smoked gammon', qty: null, unit: 'pending', category: 'Menu placeholders', matchKey: null, note: 'Separate labelled platter; quantity/source/label to be supplied — do not buy yet. Not for Host A or Guest B.' },
  { id: 'l41', name: 'Homemade ice-cream ingredients', qty: null, unit: 'pending', category: 'Menu placeholders', matchKey: null, note: 'Recipe to be supplied — do not buy yet; dietary status unconfirmed.' },
  { id: 'l42', name: 'Optional coconut milk (coconut rice pudding candidate)', qty: 0.8, unit: 'L', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l43', name: 'Optional dessert rice (coconut rice pudding candidate)', qty: 0.15, unit: 'kg', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l44', name: 'Optional vanilla pod, not extract (coconut rice pudding candidate)', qty: 1, unit: 'each', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l45', name: 'Optional berries (coconut rice pudding candidate)', qty: 0.5, unit: 'kg', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l46', name: 'Optional toasted coconut (coconut rice pudding candidate)', qty: 0.1, unit: 'kg', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
];

// Steps: durationMin is null unless MENU.md states it explicitly. "Set time" is a feature, not a guess.
export const DISHES = [
  { id: 'd1', title: 'On arrival', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's1', title: 'Lemon–herb white bean dip', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [] },
    { id: 's2', title: 'Finely chop roasted almonds & pumpkin seeds', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [] },
    { id: 's3', title: 'Chill the unsweetened rooibos & drinks', resource: 'FRIDGE', durationMin: null, handsOn: false, deps: [] },
  ]},
  { id: 'd2', title: 'First course — chilled salad', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's4', title: 'Shred fennel, slice cucumber & radish thin', resource: 'COUNTER', durationMin: null, handsOn: true, deps: ['s1'] },
    { id: 's5', title: 'Dress with lemon juice & olive oil', resource: 'COUNTER', durationMin: null, handsOn: true, deps: ['s4'] },
  ]},
  { id: 'd3', title: 'Roast chicken & gravy', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE', 'CHICKEN_ONLY'], steps: [
    { id: 's6', title: 'Preheat oven to 200 °C', resource: 'OVEN', durationMin: null, handsOn: false, deps: [] },
    { id: 's7', title: 'Roast chicken (top shelf) & potatoes (below)', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s6'] },
    { id: 's8', title: 'Rest the chicken', resource: 'COUNTER', durationMin: null, handsOn: false, deps: ['s7'] },
    { id: 's9', title: 'Lemon & parsley gravy with cornflour slurry', resource: 'STOVETOP', durationMin: null, handsOn: true, deps: ['s7'] },
  ]},
  { id: 'd4', title: 'Sides', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's10', title: 'Brown rice & lentil pilaf', resource: 'STOVETOP', durationMin: null, handsOn: true, deps: [] },
    { id: 's11', title: 'Silky cauliflower purée', resource: 'STOVETOP', durationMin: null, handsOn: true, deps: [] },
    { id: 's12', title: 'Roast green beans, carrots & courgettes (batch 2)', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s7'] },
    { id: 's13', title: 'Mushroom, leek & celery stuffing bake (batch 2)', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s7'] },
    { id: 's14', title: 'Tomato, roast pepper & basil relish', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [] },
  ]},
  { id: 'd5', title: 'Tongue — for three (separate platter)', dietary: ['TONGUE_FOR_THREE', 'RED_MEAT_OK', 'ALCOHOL_FREE'], steps: [
    { id: 's15', title: 'Slow-poach the ox tongue (no wine, no vinegar brine)', resource: 'STOVETOP', durationMin: 240, handsOn: false, deps: [], note: 'MENU.md: "poached for about 4 hours" — explicit.' },
    { id: 's16', title: 'Peel and slice paper-thin on its own board', resource: 'COUNTER', durationMin: null, handsOn: true, deps: ['s15'] },
    { id: 's17', title: 'Parsley, lemon & olive oil salsa', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [] },
  ]},
  { id: 'd6', title: 'Dessert — cinnamon-baked pears (shared-safe)', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's19', title: 'Bake pears with cinnamon until very soft', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s7'], note: 'Documented shared-safe dessert; homemade ice-cream is recipe-pending and coconut rice pudding is clearance-pending.' },
  ]},
];

// Explicit clock times from MENU.md's one-cook schedule. No invented durations.
export const RUN_SHEET = [
  { time: 'A week ahead', task: 'Order the tongue; buy specialty items; confirm Host A’s list with her dietitian, including the optional coconut rice pudding ingredient list; do not buy it yet; keep smoked gammon quantity/source/label and the homemade ice-cream recipe pending; check both hosts’ diets (Host A included) & the alcohol-free plan.', phase: 'prep' },
  { time: 'Two days ahead', task: 'Check every label (pudding, mustard, rice cakes, vanilla flavouring, mixers, recipe-supplied ice-cream ingredients, optional coconut rice pudding labels if cleared, gammon packaging once sourced); write large-print cards for the tongue, smoked gammon, recipe-pending ice-cream and clearance-pending coconut rice pudding; pack kit.', phase: 'prep' },
  { time: 'Day before', task: 'Poach tongue ~4 h; make stocks; dip & relish; chop nuts; bake pears; make alcohol-free suet-free pudding; DO NOT prepare homemade ice-cream, smoked gammon or optional coconut rice pudding — recipe/preparation, labels and Host A clearance pending; wash salad leaves; chill drinks.', phase: 'prep' },
  { time: '09:30', task: 'Preheat oven to 200 °C. Chicken on top shelf, potatoes below. Oven batch 1.', phase: 'day' },
  { time: '10:15', task: 'Chicken out to rest. Vegetables + stuffing bake in (oven batch 2). Reheat pilaf & cauliflower purée.', phase: 'day' },
  { time: '10:45', task: 'Make gravy from pan juices, homemade stock and a cornflour slurry.', phase: 'day' },
  { time: '11:30', task: 'Vegetables out; slice tongue paper-thin on its own board/knife; warm in its own pan. If smoked gammon preparation is supplied, prepare/slice it last on its own board/knife/tongs. Wash hands, change utensils.', phase: 'day' },
  { time: '12:15', task: 'Dress salad with lemon. Put out platters, large-print labels, separate tongs. Set tongue and smoked gammon platters apart; extras sideboard at the far end. Hold recipe-pending ice-cream and clearance-pending coconut rice pudding off the shared table until cleared. Keep cold dishes in the cooler.', phase: 'day' },
  { time: '12:45', task: 'Slice chicken, pour gravy into a labelled jug, fill the drinks jugs.', phase: 'day' },
  { time: '13:00', task: 'Serve: salad, then main platters, then cleared desserts. Hold recipe-pending ice-cream and clearance-pending coconut rice pudding until recipe/labels, Host A clearance and dietary clearance are supplied. You do the clearing.', phase: 'day' },
];

export const DIETARY_FLAGS = {
  NO_SUGAR: 'No sugar', NO_YEAST: 'No yeast', NO_WHEAT: 'No wheat', NO_DAIRY: 'No dairy',
  NO_VINEGAR: 'No vinegar', ALCOHOL_FREE: 'Alcohol-free', CHICKEN_ONLY: 'Chicken only',
  TONGUE_FOR_THREE: 'Tongue — for 3', RED_MEAT_OK: 'Red meat at table is fine',
  SEPARATE_PLATTER: 'Separate labelled platter', NOT_HOST_A_GUEST_B: 'Not for Host A or Guest B',
  RECIPE_PENDING: 'Recipe / preparation pending', HOST_A_CLEARANCE_PENDING: 'Host A clearance pending',
};

export const STORE_CLOSURES = [
  { store: 'spar', date: '2026-12-25', label: 'Spar Port Alfred is closed on Christmas Day' },
];
