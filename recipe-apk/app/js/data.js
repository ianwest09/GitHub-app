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

// Explicit held menu items: a preparation placeholder, a recipe-supplied ice-cream
// bombe pending dietary clearance, and an optional candidate for Host A review.
export const MENU_PLACEHOLDERS = [
  {
    id: 'gammon',
    status: 'Preparation pending',
    title: 'Smoked gammon — separate labelled platter',
    detail: 'Cured/processed pork; not for Host A or Guest B. Quantity, preparation, source and label to be supplied. Keep it on its own platter with its own board, knife and tongs, apart from the shared dishes and the tongue platter; prep last, wash hands and change utensils. No dietary claims are made.',
  },
  {
    id: 'icecream',
    status: 'Recipe supplied — dietary clearance pending',
    title: 'Homemade ice-cream bombe — recipe supplied',
    detail: "Recipe supplied from the linked Allrecipes 2-Ingredient Ice Cream page (https://www.allrecipes.com/recipe/256234/2-ingredient-ice-cream/) and the user's frozen pudding bombe method. Base: 1 pint heavy whipping cream + 1 (14 ounce) can sweetened condensed milk; beat cream in a chilled glass or metal bowl to soft peaks, add condensed milk and beat until thick and well combined. Linked method freezes in a shallow container until solid, about 6 hours, and serves 4. Bombe: a frozen pudding shape holds better on the table than individual scoops in hot weather; line a medium round glass or stainless-steel bowl with two overlapping layers of cling wrap leaving overhang, fold in fruit mince + chopped pecans + glacé cherries, pack firmly, smooth the top, cover tightly and freeze overnight. This is a frozen ice-cream bombe shaped like pudding, not the alcohol-free Christmas pudding on the extras sideboard. Not cleared: cream/condensed milk are dairy and contain sugar; glacé cherries contain sugar; fruit-mince labels may include sugar, alcohol, suet/other animal fat or other restricted ingredients. Guest B's chicken-only rule and the alcohol-free table require label checks. No crowd batch count, mix-in quantities, numeric minutes for overnight, prices or dietary clearance have been supplied. Do not buy, prepare, serve to anyone including Host A or Guest B, or treat it as shared-safe until Host A and her oncology dietitian clear the final ingredient list and every packaged label. This ingredient note is not a safety claim.",
  },
  {
    id: 'coconut-rice',
    status: 'Host A clearance pending',
    title: 'Coconut rice pudding — optional candidate',
    detail: 'Restored as an option to review, not as a cleared shared dessert. Previous ingredient list: rice simmered in coconut milk with cinnamon and a vanilla pod (not extract), layered with berries and toasted coconut. The previous menu described it as soft, with no added sugar, dairy, wheat or gelatine; that description is a review item, not a safety claim. Do not buy, prepare, serve to anyone including Host A or Guest B, or treat it as shared-safe until Host A and her oncology dietitian clear the final ingredient list and every packaged label.',
  },
];

// matchKey links a shopping line to comparable price entries. null = no verified price anywhere.
// qty: null marks held lines with no numeric quantity; recipeSupplied/dietClearancePending
// lines show source details in notes but stay held from shopping and price entry.
// clearancePending lines show previous quantities for review but stay held too.
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
  { id: 'l40', name: 'Smoked gammon', qty: null, unit: 'pending', category: 'Menu placeholders', matchKey: null, preparationPending: true, flags: ['PREPARATION_PENDING'], note: 'Separate labelled platter; quantity/source/label to be supplied — do not buy yet. Not for Host A or Guest B.' },
  { id: 'l41', name: 'Ice-cream bombe — heavy whipping cream (recipe-supplied, held)', qty: null, unit: 'review', category: 'Recipe-supplied ice-cream (held)', matchKey: null, recipeSupplied: true, dietClearancePending: true, flags: ['RECIPE_SUPPLIED', 'DIETARY_CLEARANCE_PENDING'], note: 'Linked base recipe: 1 pint per 4 servings; crowd batch count pending. Dairy/sugar label and Host A/dietitian clearance required — do not buy yet.' },
  { id: 'l42', name: 'Optional coconut milk (coconut rice pudding candidate)', qty: 0.8, unit: 'L', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l43', name: 'Optional dessert rice (coconut rice pudding candidate)', qty: 0.15, unit: 'kg', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l44', name: 'Optional vanilla pod, not extract (coconut rice pudding candidate)', qty: 1, unit: 'each', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l45', name: 'Optional berries (coconut rice pudding candidate)', qty: 0.5, unit: 'kg', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l46', name: 'Optional toasted coconut (coconut rice pudding candidate)', qty: 0.1, unit: 'kg', category: 'Optional dessert candidate', matchKey: null, clearancePending: true, flags: ['HOST_A_CLEARANCE_PENDING'], note: 'Host A/dietitian clearance pending — do not buy yet; label check required.' },
  { id: 'l47', name: 'Ice-cream bombe — sweetened condensed milk (recipe-supplied, held)', qty: null, unit: 'review', category: 'Recipe-supplied ice-cream (held)', matchKey: null, recipeSupplied: true, dietClearancePending: true, flags: ['RECIPE_SUPPLIED', 'DIETARY_CLEARANCE_PENDING'], note: 'Linked base recipe: 1 (14 ounce) can per 4 servings; crowd batch count pending. Dairy/sugar label and Host A/dietitian clearance required — do not buy yet.' },
  { id: 'l48', name: 'Ice-cream bombe — fruit mince, chopped pecans, glacé cherries (mix-ins)', qty: null, unit: 'review', category: 'Recipe-supplied ice-cream (held)', matchKey: null, recipeSupplied: true, dietClearancePending: true, flags: ['RECIPE_SUPPLIED', 'DIETARY_CLEARANCE_PENDING'], note: 'User-supplied festive mix-ins; quantities not supplied. Check labels for sugar, alcohol, suet/other animal fat and other restricted ingredients — do not buy yet.' },
  { id: 'l49', name: 'Ice-cream bombe — bowl + cling wrap (bombe equipment)', qty: null, unit: 'review', category: 'Recipe-supplied ice-cream (held)', matchKey: null, recipeSupplied: true, dietClearancePending: true, flags: ['RECIPE_SUPPLIED', 'DIETARY_CLEARANCE_PENDING'], note: 'User-supplied equipment: medium round glass/stainless-steel bowl, two overlapping layers of cling wrap with overhang. Bring from home; no quantity or price supplied.' },
];

// Steps: durationMin is null unless MENU.md states it explicitly. "Set time" is a feature, not a guess.
export const DISHES = [
  { id: 'd1', title: 'On arrival', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's1', title: 'Lemon–herb white bean dip', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [], img: 'd1.jpg' },
    { id: 's2', title: 'Finely chop roasted almonds & pumpkin seeds', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [], img: 'd2.jpg' },
    { id: 's3', title: 'Chill the unsweetened rooibos & drinks', resource: 'FRIDGE', durationMin: null, handsOn: false, deps: [] },
  ]},
  { id: 'd2', title: 'First course — chilled salad', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's4', title: 'Shred fennel, slice cucumber & radish thin', resource: 'COUNTER', durationMin: null, handsOn: true, deps: ['s1'], img: 'd3.jpg' },
    { id: 's5', title: 'Dress with lemon juice & olive oil', resource: 'COUNTER', durationMin: null, handsOn: true, deps: ['s4'], img: 'd3.jpg' },
  ]},
  { id: 'd3', title: 'Roast chicken & gravy', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE', 'CHICKEN_ONLY'], steps: [
    { id: 's6', title: 'Preheat oven to 200 °C', resource: 'OVEN', durationMin: null, handsOn: false, deps: [] },
    { id: 's7', title: 'Roast chicken (top shelf) & potatoes (below)', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s6'], img: 'd4.jpg' },
    { id: 's8', title: 'Rest the chicken', resource: 'COUNTER', durationMin: null, handsOn: false, deps: ['s7'], img: 'd4.jpg' },
    { id: 's9', title: 'Lemon & parsley gravy with cornflour slurry', resource: 'STOVETOP', durationMin: null, handsOn: true, deps: ['s7'], img: 'd5.jpg' },
  ]},
  { id: 'd4', title: 'Sides', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's10', title: 'Brown rice & lentil pilaf', resource: 'STOVETOP', durationMin: null, handsOn: true, deps: [], img: 'd7.jpg' },
    { id: 's11', title: 'Silky cauliflower purée', resource: 'STOVETOP', durationMin: null, handsOn: true, deps: [], img: 'd8.jpg' },
    { id: 's12', title: 'Roast green beans, carrots & courgettes (batch 2)', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s7'], img: 'd9.jpg' },
    { id: 's13', title: 'Mushroom, leek & celery stuffing bake (batch 2)', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s7'], img: 'd10.jpg' },
    { id: 's14', title: 'Tomato, roast pepper & basil relish', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [], img: 'd11.jpg' },
  ]},
  { id: 'd5', title: 'Tongue — for three (separate platter)', dietary: ['TONGUE_FOR_THREE', 'RED_MEAT_OK', 'ALCOHOL_FREE'], steps: [
    { id: 's15', title: 'Slow-poach the ox tongue (no wine, no vinegar brine)', resource: 'STOVETOP', durationMin: 240, handsOn: false, deps: [], note: 'MENU.md: "poached for about 4 hours" — explicit.', img: 'd12.jpg' },
    { id: 's16', title: 'Peel and slice paper-thin on its own board', resource: 'COUNTER', durationMin: null, handsOn: true, deps: ['s15'], img: 'd12.jpg' },
    { id: 's17', title: 'Parsley, lemon & olive oil salsa', resource: 'COUNTER', durationMin: null, handsOn: true, deps: [], img: 'd13.jpg' },
  ]},
  { id: 'd6', title: 'Dessert — cinnamon-baked pears (shared-safe)', dietary: ['NO_SUGAR', 'NO_YEAST', 'NO_WHEAT', 'NO_DAIRY', 'NO_VINEGAR', 'ALCOHOL_FREE'], steps: [
    { id: 's19', title: 'Bake pears with cinnamon until very soft', resource: 'OVEN', durationMin: null, handsOn: false, deps: ['s7'], note: 'Documented shared-safe dessert; ice-cream bombe recipe is supplied but dietary-clearance-pending; coconut rice pudding is Host A clearance-pending.', img: 'd16.jpg' },
  ]},
];

// Explicit clock times from MENU.md's one-cook schedule. No invented durations.
export const RUN_SHEET = [
  { time: 'A week ahead', task: 'Order the tongue; buy specialty items; confirm Host A’s list with her dietitian, including the supplied ice-cream bombe recipe/labels and optional coconut rice pudding ingredient list; do not buy them yet; keep smoked gammon quantity/source/label pending; keep ice-cream crowd batch count, mix-in quantities and dietary clearance pending; check both hosts’ diets (Host A included) & the alcohol-free plan.', phase: 'prep' },
  { time: 'Two days ahead', task: 'Check every label (pudding, mustard, rice cakes, vanilla flavouring, mixers, ice-cream base and mix-ins, especially fruit mince, glacé cherries, cream, condensed milk and pecans, optional coconut rice pudding labels if cleared, gammon packaging once sourced); write large-print cards for the tongue, smoked gammon, dietary-clearance-pending ice-cream bombe and clearance-pending coconut rice pudding; pack kit.', phase: 'prep' },
  { time: 'Day before', task: 'Poach tongue ~4 h; make stocks; dip & relish; chop nuts; bake pears; make alcohol-free suet-free pudding; DO NOT prepare ice-cream bombe, smoked gammon or optional coconut rice pudding — dietary clearance, labels, crowd batch count and mix-in quantities pending. If bombe is cleared, beat base, fold in cleared mix-ins, pack lined bowl, cover and freeze overnight; no numeric minutes entered; wash salad leaves; chill drinks.', phase: 'prep' },
  { time: '09:30', task: 'Preheat oven to 200 °C. Chicken on top shelf, potatoes below. Oven batch 1.', phase: 'day' },
  { time: '10:15', task: 'Chicken out to rest. Vegetables + stuffing bake in (oven batch 2). Reheat pilaf & cauliflower purée.', phase: 'day' },
  { time: '10:45', task: 'Make gravy from pan juices, homemade stock and a cornflour slurry.', phase: 'day' },
  { time: '11:30', task: 'Vegetables out; slice tongue paper-thin on its own board/knife; warm in its own pan. If smoked gammon preparation is supplied, prepare/slice it last on its own board/knife/tongs. Wash hands, change utensils.', phase: 'day' },
  { time: '12:15', task: 'Dress salad with lemon. Put out platters, large-print labels, separate tongs. Set tongue and smoked gammon platters apart; extras sideboard at the far end. Hold dietary-clearance-pending ice-cream bombe and clearance-pending coconut rice pudding off the shared table until cleared. Keep cold dishes in the cooler.', phase: 'day' },
  { time: '12:45', task: 'Slice chicken, pour gravy into a labelled jug, fill the drinks jugs.', phase: 'day' },
  { time: '13:00', task: 'Serve: salad, then main platters, then cleared desserts. Hold dietary-clearance-pending ice-cream bombe and clearance-pending coconut rice pudding until labels, Host A/dietitian clearance and dietary clearance are supplied. You do the clearing.', phase: 'day' },
];

export const DIETARY_FLAGS = {
  NO_SUGAR: 'No sugar', NO_YEAST: 'No yeast', NO_WHEAT: 'No wheat', NO_DAIRY: 'No dairy',
  NO_VINEGAR: 'No vinegar', ALCOHOL_FREE: 'Alcohol-free', CHICKEN_ONLY: 'Chicken only',
  TONGUE_FOR_THREE: 'Tongue — for 3', RED_MEAT_OK: 'Red meat at table is fine',
  SEPARATE_PLATTER: 'Separate labelled platter', NOT_HOST_A_GUEST_B: 'Not for Host A or Guest B',
  RECIPE_PENDING: 'Recipe / preparation pending', PREPARATION_PENDING: 'Preparation pending',
  RECIPE_SUPPLIED: 'Recipe supplied — clearance pending', DIETARY_CLEARANCE_PENDING: 'Dietary clearance pending',
  HOST_A_CLEARANCE_PENDING: 'Host A clearance pending',
};

export const STORE_CLOSURES = [
  { store: 'spar', date: '2026-12-25', label: 'Spar Port Alfred is closed on Christmas Day' },
];

// Full recipes — ingredients, method, prep and cook times.
// Times are in minutes; null means the recipe doesn't specify or it's a no-cook dish.
export const RECIPES = [
  {
    id: 'r1', name: 'Lemon–herb white bean dip', course: 'On arrival', img: 'd1.jpg',
    serves: 10, prepMin: 15, cookMin: 0,
    ingredients: [
      '500 g cooked white beans (2 tins, drained & rinsed)', '2 lemons (zest + juice)',
      '2 garlic cloves', '~80 ml extra-virgin olive oil',
      'Small bunch flat-leaf parsley', 'Sea salt & black pepper',
      'Soft vegetable batons (cucumber, carrot, fennel), lettuce cups',
      'Plain rice cakes / 100%-rice crackers (label-checked)',
    ],
    method: [
      'Blanch the garlic briefly if a raw bite is unwanted; keep the flavour gentle for both hosts.',
      'Blitz beans, garlic, lemon zest and juice, and most of the olive oil to a coarse-smooth dip. Add cold water to loosen if needed.',
      'Fold through chopped parsley; season lightly with salt and pepper. Taste and adjust lemon.',
      'Spoon into a bowl; finish with a drizzle of olive oil and parsley.',
      'Arrange batons and lettuce cups around it; keep rice crackers on the side.',
    ],
    notes: 'No tahini needed. No wheat, yeast or sugar in the crackers — check labels.',
  },
  {
    id: 'r2', name: 'Rosemary roasted almonds & pumpkin seeds', course: 'On arrival', img: 'd2.jpg',
    serves: 10, prepMin: 5, cookMin: 10,
    ingredients: [
      '200 g almonds', '150 g pumpkin seeds', '1 sprig rosemary (needles removed)',
      '1 tbsp olive oil', 'Pinch of sea salt',
    ],
    method: [
      'Heat oven to 180 °C. Toss almonds and pumpkin seeds with olive oil, chopped rosemary and salt.',
      'Spread on a tray and roast 8–10 min until fragrant, shaking once — do not let them char.',
      'Cool, then chop or grind finely so both hosts can chew them easily.',
    ],
    notes: 'Swap for soft avocado and cucumber cups if preferred.',
  },
  {
    id: 'r3', name: 'Chilled fennel, cucumber & avocado salad', course: 'First course', img: 'd3.jpg',
    serves: 10, prepMin: 25, cookMin: 0,
    ingredients: [
      '2 bulbs fennel', '3 cucumbers', '3 avocados', '1 bunch radish',
      '2 heads baby leaves', '1 small bunch dill or parsley',
      '100 g sunflower seeds (toasted, finely ground)', '2 lemons (juice)',
      'Extra-virgin olive oil', 'Black pepper & sea salt',
    ],
    method: [
      'Finely shred the fennel; slice the cucumber paper-thin; slice the radish thin; dice the avocado.',
      'Toast sunflower seeds in a dry pan, then grind finely.',
      'Dress the leaves with lemon juice and olive oil; season. Fold in fennel, cucumber, radish and avocado gently.',
      'Finish with dill/parsley and ground sunflower seeds. Keep chilled until serving.',
    ],
    notes: 'No vinegar, mustard or honey.',
  },
  {
    id: 'r4', name: 'Rosemary, lemon & garlic roast chicken', course: 'Main', img: 'd4.jpg',
    serves: 10, prepMin: 15, cookMin: 40,
    ingredients: [
      '10 boneless chicken thighs or supremes (~180 g each = ~1.8 kg)',
      '2 lemons (1 juiced, 1 sliced)', '6 garlic cloves (crushed)',
      '3–4 sprigs rosemary (chopped)', '~60 ml olive oil',
      'Sea salt & black pepper',
    ],
    method: [
      'Heat oven to 200 °C. Combine olive oil, lemon juice, crushed garlic, rosemary, salt and pepper.',
      'Toss the boneless chicken in the marinade; rest 20–30 min if time allows.',
      'Arrange in a roasting tray (top shelf); tuck lemon slices and rosemary sprigs between pieces.',
      'Roast ~35–40 min until cooked through and juices run clear — no charred edges (cover with foil if browning too fast).',
      'Rest 10 min before slicing. Reserve pan juices for the gravy.',
    ],
    notes: 'No butter, no sugar glaze, no wine, no stock cubes. Verified cost: R143.98 at PnP.',
  },
  {
    id: 'r5', name: 'Lemon & parsley pan gravy', course: 'Main', img: 'd5.jpg',
    serves: 10, prepMin: 5, cookMin: 10,
    ingredients: [
      'Pan juices from the chicken', '~400 ml homemade chicken stock',
      '1 lemon (juice + zest)', 'Small bunch parsley (chopped)',
      '1–2 tbsp cornflour (Maizena)', 'Cold water',
    ],
    method: [
      'Drain excess fat from the chicken roasting tray; keep the juices and browned bits.',
      'Set the tray on the hob, add hot homemade stock and scrape up the bits.',
      'Simmer and reduce by a third; add lemon juice and zest.',
      'Slake cornflour with cold water; whisk in slowly until thickened to coating consistency.',
      'Finish with chopped parsley; pour into a labelled jug.',
    ],
    notes: 'No flour, yeast extract, wine or cream.',
  },
  {
    id: 'r6', name: 'Olive oil & rosemary roast baby potatoes', course: 'Main', img: 'd6.jpg',
    serves: 10, prepMin: 10, cookMin: 35,
    ingredients: [
      '1.5 kg baby potatoes', '3 sprigs rosemary', '~50 ml olive oil',
      'Sea salt & black pepper',
    ],
    method: [
      'Heat oven to 200 °C. Halve or quarter the baby potatoes if large; parboil 8 min, drain, shake to roughen edges.',
      'Toss with olive oil, chopped rosemary, salt and pepper.',
      'Roast on the lower shelf ~30–35 min, turning once, until crisp outside and soft inside.',
    ],
    notes: 'No butter, no duck fat. Verified cost: R26.25 (PnP bundle) / R29.99 (Woolworths).',
  },
  {
    id: 'r7', name: 'Brown rice & lentil pilaf', course: 'Main', img: 'd7.jpg',
    serves: 10, prepMin: 10, cookMin: 35,
    ingredients: [
      '400 g brown rice', '200 g brown or red lentils', '1 onion (finely chopped)',
      '2 garlic cloves', '~500 ml homemade vegetable stock', '2 spring onions',
      'Lemon zest', 'Small bunch parsley', 'Olive oil',
    ],
    method: [
      'Rinse rice and lentils. Sweat the onion and garlic in olive oil until soft (no browning).',
      'Add rice and lentils; stir to coat. Pour in hot homemade stock (no cubes).',
      'Cover and simmer until liquid is absorbed and grains are tender (~30–35 min).',
      'Fluff; fold through chopped spring onion, lemon zest and parsley. Reheat gently on the day.',
    ],
    notes: 'Quinoa 300 g + wild rice 200 g if available.',
  },
  {
    id: 'r8', name: 'Silky cauliflower purée', course: 'Main', img: 'd8.jpg',
    serves: 10, prepMin: 10, cookMin: 20,
    ingredients: [
      '2 large cauliflower heads', '4 garlic cloves', '~40 ml olive oil',
      'Pinch of nutmeg', 'Sea salt',
    ],
    method: [
      'Cut cauliflower into florets; simmer in lightly salted water (or steam) with the garlic until very tender.',
      'Drain well; transfer to a blender with the olive oil and a pinch of nutmeg.',
      'Blend until completely smooth and silky; season lightly. Reheat gently; do not let it catch.',
    ],
    notes: 'No cream, butter or cheese.',
  },
  {
    id: 'r9', name: 'Roasted green beans, baby carrots & courgettes', course: 'Main', img: 'd9.jpg',
    serves: 10, prepMin: 10, cookMin: 25,
    ingredients: [
      '400 g green beans', '400 g baby carrots', '400 g courgettes',
      '3 sprigs thyme', '1 lemon (zest)', 'Olive oil', 'Sea salt & black pepper',
    ],
    method: [
      'Heat oven to 200 °C. Trim beans; halve carrots lengthways if large; slice courgettes on the diagonal.',
      'Toss all with olive oil, thyme, salt and pepper.',
      'Roast ~20–25 min until tender (not al dente — soft for both hosts). Finish with lemon zest.',
    ],
    notes: 'Cook until tender, not al dente.',
  },
  {
    id: 'r10', name: 'Mushroom, leek & celery "stuffing" bake', course: 'Main', img: 'd10.jpg',
    serves: 10, prepMin: 15, cookMin: 25,
    ingredients: [
      '400 g mushrooms', '3 leeks', '1 head celery', '1 onion', '3 garlic cloves',
      '~150 g cooked brown rice (from the pilaf batch)', 'Small bunch parsley',
      'Olive oil', 'Sea salt & black pepper',
    ],
    method: [
      'Finely chop mushrooms, leeks, celery, onion and garlic.',
      'Sweat in olive oil until soft and any mushroom liquid has evaporated.',
      'Fold in cooked brown rice and chopped parsley; season.',
      'Press into a baking dish; bake at 200 °C ~25 min until hot through with a light crust on top.',
    ],
    notes: 'No bread, yeast, sausage, bacon or suet.',
  },
  {
    id: 'r11', name: 'Fresh tomato, roast pepper & basil relish', course: 'Main', img: 'd11.jpg',
    serves: 10, prepMin: 20, cookMin: 30,
    ingredients: [
      '600 g tomatoes', '3 red peppers', '1 bunch basil', '1 onion',
      '2 garlic cloves', 'Olive oil', 'Sea salt & black pepper',
    ],
    method: [
      'Roast the red peppers at 200 °C until skins blister; steam in a covered bowl, peel, and slice.',
      'Blanch, peel and dice the tomatoes. Sweat onion and garlic in olive oil until soft.',
      'Add tomatoes; simmer gently ~20 min until jammy but unsweetened. Fold in roasted peppers.',
      'Tear in basil; season. Serve at room temperature as the sugar-free, vinegar-free stand-in for cranberry sauce.',
    ],
    notes: 'No sugar, no vinegar.',
  },
  {
    id: 'r12', name: 'Slow-poached beef/ox tongue', course: 'Separate platter (for 3)', img: 'd12.jpg',
    serves: 3, prepMin: 10, cookMin: 240,
    ingredients: [
      '1 large beef/ox tongue (~1.5 kg)', '2 bay leaves', '1 tsp peppercorns',
      '1 onion', '2 celery sticks', 'Water',
    ],
    method: [
      'Order from the butcher a week ahead. Place tongue in a deep pot with bay, peppercorns, onion and celery; cover with water.',
      'Bring to a gentle simmer; poach about 4 hours until tender (no wine, no vinegar brine).',
      'Cool slightly; peel off the outer skin. Refrigerate in its own sealed container overnight.',
      'On the day, slice paper-thin on its own board with its own knife; warm gently in its own pan.',
    ],
    notes: 'Own platter, own tongs — never touches shared dishes or shared spoons. Separate from chicken-only guest.',
  },
  {
    id: 'r13', name: 'Parsley, lemon & olive oil salsa', course: 'Separate platter (for 3)', img: 'd13.jpg',
    serves: 3, prepMin: 5, cookMin: 0,
    ingredients: [
      '1 small bunch parsley', '1 lemon (zest + juice)', '1 garlic clove',
      'Olive oil', 'Sea salt',
    ],
    method: [
      'Finely chop parsley and garlic; combine with lemon zest and juice and enough olive oil to make a loose salsa.',
      'Season. Travels with the tongue platter only.',
    ],
    notes: 'No vinegar, no mustard, no brined capers.',
  },
  {
    id: 'r14', name: 'Smoked gammon', course: 'Separate platter', img: 'd14.jpg',
    serves: 0, prepMin: null, cookMin: null,
    ingredients: ['Quantity / source / preparation / labels to be supplied'],
    method: ['No recipe until source, quantity and labels are confirmed. When supplied, it will be prepared and sliced last, on its own board with its own knife and tongs, and kept on its own labelled platter apart from the shared dishes and the tongue platter.'],
    notes: 'Cured/processed pork — not for Host A or Guest B. Wash hands and change utensils before returning to shared dishes.',
    held: true,
  },
  {
    id: 'r15', name: 'Cinnamon-baked pears with toasted pecans', course: 'Dessert (shared-safe)', img: 'd16.jpg',
    serves: 10, prepMin: 10, cookMin: 35,
    ingredients: [
      '10 small pears', '1 tsp ground cinnamon', '150 g pecans (toasted, finely chopped)',
      'Water or a little rooibos to moisten the dish',
    ],
    method: [
      'Heat oven to 180 °C. Halve and core the pears; leave stems on if you like.',
      'Place cut-side up in a baking dish; dust with cinnamon; add a splash of water or rooibos.',
      'Cover with foil; bake ~30–35 min until very soft. Uncover for the last 5–10 min for colour.',
      'Toast pecans in a dry pan; chop finely for both hosts. Scatter over the pears before serving.',
    ],
    notes: 'Sweetened only by the fruit itself — no sugar, honey or syrup. Documented shared-safe dessert.',
  },
  {
    id: 'r16', name: 'Homemade ice-cream bombe', course: 'Dessert (clearance pending)', img: 'd15.jpg',
    serves: 0, prepMin: 20, cookMin: 0,
    ingredients: [
      '1 pint (≈473 ml) heavy whipping cream', '1 (14 oz / ≈397 g) can sweetened condensed milk',
      'Fruit mince + chopped pecans + glacé cherries (quantities pending)',
    ],
    method: [
      'Beat the cream in a chilled glass or metal bowl until soft peaks.',
      'Add the condensed milk; beat until thick and well combined.',
      'Line a medium round glass or stainless-steel bowl with two overlapping layers of cling wrap, leaving overhang.',
      'Fold in fruit mince + chopped pecans + glacé cherries for the classic speckled pudding look.',
      'Pack firmly, smooth the top, cover tightly, and freeze overnight.',
    ],
    notes: 'Dietary clearance pending — cream and condensed milk are dairy and contain sugar. Do not serve until Host A and dietitian clear. Crowd batch count not supplied.',
    held: true,
  },
  {
    id: 'r17', name: 'Coconut rice pudding', course: 'Dessert (clearance pending)', img: 'd17.jpg',
    serves: 0, prepMin: 10, cookMin: 25,
    ingredients: [
      '2 × 400 ml coconut milk', '150 g dessert rice', '1 vanilla pod (not extract)',
      '500 g berries', '100 g toasted coconut',
    ],
    method: [
      'Simmer the dessert rice in coconut milk with cinnamon and the vanilla pod until soft and creamy.',
      'Layer with berries and toasted coconut.',
    ],
    notes: 'Host A clearance pending — review only, not cleared. Previous description: soft, no added sugar, dairy, wheat or gelatine. Do not serve until cleared.',
    held: true,
  },
  {
    id: 'r18', name: 'Alcohol-free Christmas pudding + custard', course: 'Extras sideboard', img: 'd18.jpg',
    serves: 9, prepMin: 5, cookMin: 15,
    ingredients: [
      '1 alcohol-free Christmas pudding (PnP Fruit Cake Alcohol Free 350 g, R59.99)',
      'Custard to serve',
    ],
    method: [
      'Confirm the label for alcohol. Warm gently and serve with custard.',
      'Keep on the sideboard at the far end. Contains sugar/wheat/dairy — not for Host A.',
    ],
    notes: 'If homemade: replace all alcohol with strong rooibos or orange juice, use butter (not suet).',
  },
];
