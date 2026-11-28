# Christmas Lunch for Ten — Menu Presentation (Christmas Edition)

A simple, image-led Google Slides deck for the meeting with Hostess A.
Built to be **presented to her** (not navigated alone): one idea per slide,
large text, and a Christmas-themed photo on every slide.

**Google Slides:** https://docs.google.com/presentation/d/1lGbwF8cXT4SrIXL45Y_fD5jOYDRbLrobnuCrFhl9peY/edit

## Structure (19 slides)

1. **Title** — Christmas Lunch for Ten (festive hero photo)
2. **The Full Menu** — all courses listed for all 10 diners
3. **Lemon-Herb White Bean Dip** — R100.98 · serves 10
4. **Rosemary Roasted Almonds & Pumpkin Seeds** — R140.00 · serves 10
5. **Chilled Fennel, Cucumber & Avocado Salad** — R228.90 · serves 10
6. **Rosemary, Lemon & Garlic Roast Chicken** — R215.98 · serves 10
7. **Olive Oil & Rosemary Roast Baby Potatoes** — R41.24 · serves 10
8. **Brown Rice & Lentil Pilaf** — R40.60 · serves 10
9. **Silky Cauliflower Purée** — R70.00 · serves 10
10. **Roasted Green Beans, Carrots & Courgettes** — R65.20 · serves 10
11. **Mushroom, Leek & Celery Stuffing Bake** — R130.99 · serves 10
12. **Fresh Tomato, Roast Pepper & Basil Relish** — R80.58 · serves 10
13. **Slow-Poached Beef / Ox Tongue** — R180.00 · serves 3
14. **Smoked Gammon** — R134.99 · serves 8
15. **Cinnamon-Baked Pears with Pecans** — R141.24 · serves 10
16. **Ice-Cream Bombe** — R502.18 · serves 10
17. **Coconut Rice Pudding** — R261.46 · serves 10
18. **Alcohol-Free Christmas Pudding** — R59.99 · serves 9
19. **About R193 Per Person** — cost scenarios
20. **Decisions for Today** — 4 questions

Each dish slide has: dish name (title), Christmas-themed photo, full ingredients
with per-item costs, and total cost at the bottom (32pt bold centered).

Ingredients double-checked against COST-BREAKDOWN.md (all 33 priced lines).
Prices verified from woolworths.co.za (28 Nov 2026) and Spar Port Alfred catalogue.
No medical advice. Gammon not for Host A or Guest B. Alcohol-free table.

## Figma note
The Figma connector is working — `validate_credential`, `get_team_styles`,
`get_team_components`, `get_file_meta`, and `get_file` all succeed.
Only `get_team_projects` returns "Invalid scope" (a known scope limitation
on that single endpoint; the connection itself is fine, no reconnect needed).
The team library file (`aInaUd1HBn2ngbCkppU4lG`) contains only default
Figma color swatches (Fuschia/Iris) and text styles — no Christmas assets.

## Complementary colour palette (applied)
A complementary palette was derived by analysing the user-uploaded food
photography image (warm dark brown, avg `#76583C`, hero hue 30°) and
computing complementary/split-complementary/analogous colours.
Full details in `FIGMA-PALETTE.md`. Applied to all 19 content slides:

- **Slide backgrounds** → Neutral Paper `#F2EEEA` (warm off-white)
- **Title text** (all 19 slides) → Deep Blue 80 `#1C4772` (primary)
- **Ingredient text** (16 dish slides) → Warm Brown 80 `#8C5B2A` (tertiary)
- **Body text** (menu, summary, decisions) → Deep Blue 60 `#446E99` (secondary)
- **Cost boxes** (16 slides) → Deep Blue 80 fill `#1C4772` + white text `#FFFFFF`,
  middle-aligned (32pt bold)

The title slide retains its Christmas hero photo as a stretched background fill.
