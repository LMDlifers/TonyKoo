#!/usr/bin/env python3
"""Draws the four featured-project images: flat geometric SVGs, 800x500, no text.

Each picture is one idea from its project, in two theme colours on paper:
  healthcare   a question routed through agents to one reviewed answer
  extraction   scattered document fields sorted into a clean grid
  yield-curve  a smooth curve fitted through market points
  judicial     a timeline with a hard wall between past and future (no leakage)

Run: python3 scripts/build-card-art.py
"""
import pathlib
import xml.dom.minidom

OUT = pathlib.Path(__file__).resolve().parent.parent / "images" / "cards"
PAPER = "#f6f4ee"
W, H = 800, 500


def svg(bg, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'<rect width="{W}" height="{H}" fill="{bg}"/>{body}</svg>\n')


def healthcare():
    bg, ink = "#2f5d50", "#1f4238"
    out = []
    for i, y in enumerate((110, 250, 390)):
        out.append(f'<path d="M130,250 L374,{y} L640,250" fill="none" stroke="{ink}" stroke-width="10"/>')
        out.append(f'<rect x="330" y="{y - 44}" width="88" height="88" fill="{PAPER if i == 1 else ink}"/>')
    out.append(f'<circle cx="130" cy="250" r="56" fill="{PAPER}"/>')
    out.append(f'<circle cx="640" cy="250" r="84" fill="{ink}"/><circle cx="640" cy="250" r="52" fill="{PAPER}"/>')
    return svg(bg, "".join(out))


def extraction():
    bg, ink = "#c0623f", "#8f4428"
    out = []
    # Left: fields at odd angles. Right: the same fields in a strict grid.
    loose = [(70, 90, 110, 34, -14), (190, 170, 90, 34, 9), (80, 250, 130, 34, 21), (210, 330, 100, 34, -8), (90, 400, 80, 34, 12), (230, 70, 70, 34, 17)]
    for x, y, w, h, a in loose:
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{ink}" transform="rotate({a} {x + w / 2} {y + h / 2})"/>')
    out.append(f'<polygon points="360,220 420,250 360,280" fill="{PAPER}"/>')
    for r in range(5):
        for c in range(3):
            fill = PAPER if (r + c) % 4 else ink
            out.append(f'<rect x="{470 + c * 92}" y="{80 + r * 72}" width="76" height="52" fill="{fill}"/>')
    return svg(bg, "".join(out))


def yield_curve():
    bg, ink = "#33507a", "#243a5c"
    pts = [(90, 400), (190, 318), (300, 250), (420, 200), (550, 168), (700, 150)]
    out = [f'<rect x="{x - 26}" y="{y}" width="52" height="{H - y}" fill="{ink}"/>' for x, y in pts]
    # Catmull-Rom through the points, written as cubic Beziers, so the fit is smooth.
    ext = [pts[0]] + pts + [pts[-1]]
    d = f"M{pts[0][0]},{pts[0][1]}"
    for p0, p1, p2, p3 in zip(ext, ext[1:], ext[2:], ext[3:]):
        d += f" C{p1[0] + (p2[0] - p0[0]) / 6:.0f},{p1[1] + (p2[1] - p0[1]) / 6:.0f} {p2[0] - (p3[0] - p1[0]) / 6:.0f},{p2[1] - (p3[1] - p1[1]) / 6:.0f} {p2[0]},{p2[1]}"
    out.append(f'<path d="{d}" fill="none" stroke="{PAPER}" stroke-width="10" stroke-linecap="round"/>')
    out += [f'<circle cx="{x}" cy="{y}" r="17" fill="{PAPER}"/>' for x, y in pts]
    return svg(bg, "".join(out))


def judicial():
    bg, ink = "#d9b44a", "#2a3540"
    out = [f'<rect x="60" y="244" width="680" height="12" fill="{ink}"/>']
    for i in range(9):
        x = 90 + i * 76
        past = x < 520
        out.append(f'<circle cx="{x}" cy="250" r="26" fill="{ink if past else bg}" stroke="{ink}" stroke-width="{0 if past else 8}"/>')
    # The wall: nothing after the decision date reaches the model.
    out.append(f'<rect x="497" y="60" width="22" height="380" fill="{PAPER}"/>')
    return svg(bg, "".join(out))


ART = {"healthcare": healthcare, "extraction": extraction, "yield-curve": yield_curve, "judicial": judicial}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, draw in ART.items():
        text = draw()
        (OUT / f"{name}.svg").write_text(text)
        # Self-check: valid XML, fixed size, shapes only.
        root = xml.dom.minidom.parseString(text).documentElement
        assert root.getAttribute("viewBox") == f"0 0 {W} {H}", name
        assert "<text" not in text and "<image" not in text, name
    print(f"Wrote {len(ART)} card images to {OUT}")
