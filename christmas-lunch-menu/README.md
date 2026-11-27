# Christmas Lunch for Ten — Port Alfred

A Christmas lunch menu for ten on the Eastern Cape Sunshine Coast, cooked by one person.

## The brief

| Person / detail | Requirement |
| --- | --- |
| Host A (one of the hosts, stage 4 breast cancer) | No sugar, yeast, wheat, dairy, vinegar, or "foods causing cancer" |
| Guest B | Eats chicken and no other meat |
| Three guests | Asked for tongue |
| One guest | Recovering alcoholic → **the entire table is alcohol-free** |
| Location | Port Alfred, Eastern Cape — small coastal town, hot humid Christmas |
| Both hosts (including Host A) | Both in their 80s → softer textures, easier service, earlier sitting |
| Cook | One person → make-ahead plan, one oven in two batches, clock-based schedule |

**Shopping note:** Spar Port Alfred is listed as **closed on Christmas Day**, so all shopping must be done by 24 December. Verified prices from the three local shops (with sources, validity dates and gaps) are in `../recipe-apk/VERIFIED-PRICES.md` — those catalogues expire 22 November 2026, so they are a planning reference, not Christmas shopping prices.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The styled menu, with a **Print / Save as PDF** button. Self-contained — no external fonts or images. |
| `Christmas-Lunch-Menu.pdf` | The full menu and cook's notes as a 6-page A4 document, ready to print or email. |
| `MENU.md` | Plain-text source of truth — easy to copy into a shopping list, email or doc. |
| `make_pdf.py` | Regenerates the PDF from `MENU.md`. Needs `reportlab`: `python -m pip install reportlab`. |

## Key decisions

- **One shared table.** Everything on the main table is safe for all ten. Only two things are set apart: a clearly labelled tongue platter for the three who asked, and an optional sideboard of traditional extras for the rest. Only three people eat the tongue, so it has its own platter, board, knife and tongs and never touches the shared dishes or gravy. Red meat at the table is perfectly fine.
- **Fully alcohol-free, for everyone.** No wine, beer, brandy custard, rum-soaked fruit, alcohol in cooking, or vanilla extract. No "special" glass for the guest in recovery — the same alcohol-free drinks menu is served to all ten. Alcohol-free beer/wine look-alikes are left out by default (easy to add back if the guest is happy with them).
- **Local sourcing.** Specialty items (quinoa, wild rice, chia, tahini, arrowroot, pomegranate, fresh tarragon) may not be stocked in Port Alfred. Order the tongue from a butcher a week ahead, bring hard-to-find items from Gqeberha or East London, or use the pantry swaps: brown rice + lentils, cornflour (Maizena), vanilla pod, coconut milk, local berries, parsley/rosemary/thyme/mint.
- **For both hosts in their 80s, including Host A.** Boneless chicken instead of whole birds, finely chopped nuts, paper-thin tongue, tender vegetables, gentle seasoning with salt at the table, large-print labels, shorter service, and the cook handles setup and clearing.
- **For one cook.** Almost everything is made the day before; Christmas morning is just the chicken, potatoes, vegetables, gravy and the final salad toss.

> **Note on the cancer restriction:** "Foods causing cancer" is not a single defined list. The menu reads it as the categories most consistently flagged in cancer-prevention guidance — processed/cured meats, alcohol, charred meat, added sugar and heavily processed foods — and uses whole, fresh ingredients. This is a menu, not medical advice. Please confirm the final ingredient list with Host A and her oncology dietitian, check every packaged label, and quietly check with both hosts (Host A included) about any medication-related diets (warfarin/vitamin K, low salt, diabetes) and chewing/swallowing considerations.

**Still worth confirming:** the final ingredient list with Host A's dietitian and every packaged label; any medication-related diets, chewing/swallowing or denture considerations for both hosts (Host A included); and — discreetly — whether the fully alcohol-free plan suits the guest in recovery. Red meat at the table is settled: the tongue platter stays.
