"""Build a printable PDF from MENU.md (run with .venv/bin/python make_pdf.py).

Uses only reportlab's built-in fonts, so no external assets are needed.
"""
import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

HERE = Path(__file__).parent
SRC = HERE / "MENU.md"
OUT = HERE / "Christmas-Lunch-Menu.pdf"

GREEN = colors.HexColor("#16442f")
GOLD = colors.HexColor("#b18b46")
BERRY = colors.HexColor("#8d3242")
INK = colors.HexColor("#25332b")
MUTED = colors.HexColor("#5c675e")
LINE = colors.HexColor("#e2ddcf")
CREAM = colors.HexColor("#faf7ef")
GOLDSOFT = colors.HexColor("#f5eddc")

PAGE_W, PAGE_H = A4
MARGIN = 17 * mm
AVAIL = PAGE_W - 2 * MARGIN

S = {
    "title": ParagraphStyle("title", fontName="Times-Bold", fontSize=30, leading=34,
                            textColor=GREEN, alignment=TA_CENTER, spaceAfter=8),
    "subtitle": ParagraphStyle("subtitle", fontName="Times-Italic", fontSize=12.5,
                               leading=17, textColor=MUTED, alignment=TA_CENTER, spaceAfter=4),
    "meta": ParagraphStyle("meta", fontName="Helvetica", fontSize=8.5, leading=13,
                           textColor=GOLD, alignment=TA_CENTER, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="Times-Bold", fontSize=16, leading=20,
                         textColor=GREEN, spaceBefore=15, spaceAfter=3),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.5,
                           textColor=INK, alignment=TA_LEFT, spaceAfter=5),
    "lede": ParagraphStyle("lede", fontName="Helvetica-Oblique", fontSize=9.5,
                           leading=13.5, textColor=MUTED, spaceAfter=7),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9.5, leading=13.3,
                             textColor=INK, leftIndent=13, bulletIndent=2, spaceAfter=4),
    "number": ParagraphStyle("number", fontName="Helvetica", fontSize=9.5, leading=13.3,
                             textColor=INK, leftIndent=15, bulletIndent=1, spaceAfter=4),
    "note": ParagraphStyle("note", fontName="Helvetica", fontSize=9, leading=12.8,
                           textColor=colors.HexColor("#5a4b30")),
    "th": ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, leading=10.5,
                         textColor=colors.white),
    "td": ParagraphStyle("td", fontName="Helvetica", fontSize=8.3, leading=11.2,
                         textColor=colors.HexColor("#455248")),
    "tdcenter": ParagraphStyle("tdcenter", fontName="Helvetica", fontSize=8.3,
                               leading=11.2, textColor=GREEN, alignment=TA_CENTER),
}


def inline(raw: str) -> str:
    """Escape and convert the tiny markdown subset used in MENU.md."""
    s = html.escape(raw.strip(), quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", s)
    s = s.replace("✓", '<font color="#16442f"><b>YES</b></font>')
    return s


def widths_for(n: int):
    ratios = {2: [0.30, 0.70], 3: [0.22, 0.36, 0.42],
              5: [0.36, 0.16, 0.16, 0.16, 0.16]}
    r = ratios.get(n, [1 / n] * n)
    return [AVAIL * x for x in r]


def is_separator(line: str) -> bool:
    return bool(re.fullmatch(r"\|[\s:\-|]+\|", line.strip())) and "---" in line


def cells(line: str):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def build_table(block):
    rows = [cells(l) for l in block if not is_separator(l)]
    if not rows:
        return []
    n = len(rows[0])
    data = [[Paragraph(inline(c), S["th"]) for c in rows[0]]]
    for row in rows[1:]:
        row = (row + [""] * n)[:n]
        out = []
        for c in row:
            style = S["tdcenter"] if c in ("✓", "—", "optional") else S["td"]
            txt = inline(c)
            if c == "optional":
                txt = '<font color="#b18b46" size="7">OPTIONAL</font>'
            out.append(Paragraph(txt, style))
        data.append(out)
    t = Table(data, colWidths=widths_for(n), repeatRows=1, hAlign="LEFT")
    pad = 5
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
    ]))
    return [t, Spacer(1, 9)]


def build_note(lines):
    text = " ".join(l.lstrip("> ").strip() for l in lines)
    p = Paragraph(inline(text), S["note"])
    t = Table([[p]], colWidths=[AVAIL], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLDSOFT),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return [Spacer(1, 3), t, Spacer(1, 11)]


def story_from(lines):
    story = []
    i = 0
    first = True
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if not stripped:
            i += 1
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(inline(stripped[2:]), S["title"]))
            if first:
                story.append(Spacer(1, 2))
                first = False
            i += 1
            continue

        if stripped.startswith("## "):
            story.append(Paragraph(inline(stripped[3:]), S["h2"]))
            story.append(HRFlowable(width="100%", thickness=0.6, color=GOLD,
                                    spaceBefore=2, spaceAfter=8))
            i += 1
            continue

        if stripped.startswith("### "):
            story.append(Paragraph(inline(stripped[4:]), S["h2"]))
            i += 1
            continue

        if stripped == "---":
            story.append(HRFlowable(width="100%", thickness=0.5, color=LINE,
                                    spaceBefore=4, spaceAfter=8))
            i += 1
            continue

        if stripped.startswith(">"):
            block = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                block.append(lines[i].strip())
                i += 1
            story.extend(build_note(block))
            continue

        if stripped.startswith("|"):
            block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                block.append(lines[i].strip())
                i += 1
            story.extend(build_table(block))
            continue

        m = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if m:
            story.append(Paragraph(inline(m.group(2)), S["number"],
                                   bulletText=m.group(1) + "."))
            i += 1
            continue

        if stripped.startswith("- "):
            story.append(Paragraph(inline(stripped[2:]), S["bullet"], bulletText="•"))
            i += 1
            continue

        if stripped.startswith("*") and stripped.endswith("*") and not stripped.startswith("**"):
            story.append(Paragraph(inline(stripped), S["lede"]))
            i += 1
            continue

        if stripped.startswith("**") and stripped.endswith("**"):
            story.append(Paragraph(inline(stripped), S["meta"]))
            i += 1
            continue

        story.append(Paragraph(inline(stripped), S["body"]))
        i += 1
    return story


def decorate(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 13 * mm, PAGE_W - MARGIN, 13 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 9 * mm, "CHRISTMAS LUNCH FOR TEN · PORT ALFRED · A FULLY ALCOHOL-FREE TABLE")
    canvas.drawRightString(PAGE_W - MARGIN, 9 * mm, "PAGE %d" % doc.page)
    canvas.restoreState()


def main():
    lines = SRC.read_text(encoding="utf-8").splitlines()
    doc = BaseDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=15 * mm, bottomMargin=19 * mm,
        title="Christmas Lunch for Ten", author="Arena.ai",
        subject="Christmas lunch for ten in Port Alfred — alcohol-free, with four dietary and hosting briefs",
    )
    frame = Frame(MARGIN, 19 * mm, AVAIL, PAGE_H - 15 * mm - 19 * mm, id="body")
    doc.addPageTemplates([PageTemplate(id="menu", frames=[frame], onPage=decorate)])
    doc.build(story_from(lines))
    print("wrote", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
