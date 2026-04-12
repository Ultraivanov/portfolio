#!/usr/bin/env python3
"""Generate case study diagrams for portfolio. Dark/product style."""

import os
from pathlib import Path

# ─── Design tokens ────────────────────────────────────────────────────────────
BG       = "#151414"
BOX      = "#1e1e20"
BOX2     = "#252528"
BORDER   = "#2f2f32"
TEXT_PRI = "#fefaec"
TEXT_SEC = "#a3a3a3"
TEXT_MUT = "#6d6d6d"
ARROW    = "#4b5563"
FONT     = "IBM Plex Sans, system-ui, sans-serif"

ACCENT = {
    "travel":  "#4b9cf5",
    "railway": "#f59e0b",
    "megamod": "#a855f7",
    "greek":   "#10b981",
    "design":  "#f87171",
}

# ─── SVG helpers ──────────────────────────────────────────────────────────────

def header(w, h, case_key):
    a = ACCENT[case_key]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" style="background:{BG}">
<defs>
  <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M0 0 L10 5 L0 10 z" fill="{ARROW}"/>
  </marker>
  <marker id="arr-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M0 0 L10 5 L0 10 z" fill="{a}"/>
  </marker>
</defs>'''

def footer():
    return "\n</svg>"

def box(x, y, w, h, label, sub="", accent_key=None, highlighted=False, rx=4):
    if accent_key:
        stroke = ACCENT[accent_key]
        sw = "1.5"
        fill = BOX2 if highlighted else BOX
    else:
        stroke = BORDER
        sw = "1"
        fill = BOX
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
    mid_x = x + w // 2
    if sub:
        out += f'<text x="{mid_x}" y="{y + h//2 - 9}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="13" font-weight="500" fill="{TEXT_PRI}">{label}</text>'
        out += f'<text x="{mid_x}" y="{y + h//2 + 10}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">{sub}</text>'
    else:
        out += f'<text x="{mid_x}" y="{y + h//2}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="13" font-weight="500" fill="{TEXT_PRI}">{label}</text>'
    return out

def label_box(x, y, w, h, label, sub="", color=None):
    """Accent-bordered box with colored top stripe."""
    c = color or TEXT_SEC
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>'
    out += f'<rect x="{x}" y="{y}" width="{w}" height="3" rx="2" fill="{c}"/>'
    if sub:
        out += f'<text x="{x + w//2}" y="{y + h//2 - 9}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="13" font-weight="500" fill="{TEXT_PRI}">{label}</text>'
        out += f'<text x="{x + w//2}" y="{y + h//2 + 11}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">{sub}</text>'
    else:
        out += f'<text x="{x + w//2}" y="{y + h//2 + 2}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="13" font-weight="500" fill="{TEXT_PRI}">{label}</text>'
    return out

def arr(x1, y1, x2, y2, lbl="", accent=False):
    marker = "url(#arr-a)" if accent else "url(#arr)"
    col = ARROW
    out = f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="1.5" marker-end="{marker}"/>'
    if lbl:
        mx, my = (x1 + x2) // 2, (y1 + y2) // 2 - 8
        out += f'<text x="{mx}" y="{my}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_MUT}">{lbl}</text>'
    return out

def path_arr(d, accent=False):
    marker = "url(#arr-a)" if accent else "url(#arr)"
    return f'<path d="{d}" stroke="{ARROW}" stroke-width="1.5" fill="none" marker-end="{marker}"/>'

def title(text, w=1200, y=34):
    return f'<text x="{w//2}" y="{y}" text-anchor="middle" font-family="{FONT}" font-size="11" font-weight="600" letter-spacing="0.12em" fill="{TEXT_MUT}">{text.upper()}</text>'

def note(text, x, y, size=11, color=None, anchor="middle"):
    c = color or TEXT_MUT
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{FONT}" font-size="{size}" fill="{c}">{text}</text>'

def hline(x1, y, x2, dashed=False):
    dash = ' stroke-dasharray="4 4"' if dashed else ""
    return f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{BORDER}"{dash} stroke-width="1"/>'

def vline(x, y1, y2, dashed=False):
    dash = ' stroke-dasharray="4 4"' if dashed else ""
    return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="{BORDER}"{dash} stroke-width="1"/>'

def circle(cx, cy, r, accent_key=None, filled=False):
    stroke = ACCENT[accent_key] if accent_key else BORDER
    fill_col = ACCENT[accent_key] if filled else BOX
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill_col}" stroke="{stroke}" stroke-width="1.5"/>'


# ─── Diagram generators ───────────────────────────────────────────────────────

def travel_behavioral_model():
    """Old linear model vs new trust loop."""
    W, H = 1200, 500
    a = ACCENT["travel"]
    parts = [header(W, H, "travel"), title("Behavioral Model — RZD Sanatorium Booking", W)]

    # Section labels
    parts.append(note("BEFORE — transaction model", 300, 80, 11, TEXT_MUT))
    parts.append(note("AFTER — trust loop", 900, 80, 11, TEXT_MUT))
    parts.append(vline(600, 60, H - 40, dashed=True))

    # BEFORE: linear flow that breaks
    bx = [60, 180, 300, 420]
    labels = ["Search", "Browse", "Attempt", "Abandon"]
    subs   = ["enter with intent", "lose confidence", "interpret rules", "distrust system"]
    for i, (x, lbl, s) in enumerate(zip(bx, labels, subs)):
        parts.append(box(x, 160, 100, 70, lbl, s))
        if i < 3:
            parts.append(arr(x + 100, 195, bx[i+1], 195))

    # "breaks here" annotation
    parts.append(note("✕ breaks", 470, 215, 11, "#ef4444"))
    parts.append(note("no trust built", 300, 270, 11, TEXT_MUT))

    # AFTER: circular loop
    cx, cy, r = 900, 270, 130
    nodes = [
        (cx,        cy - r,      "Experience"),
        (cx + r,    cy,          "Trust"),
        (cx,        cy + r,      "Return"),
        (cx - r,    cy,          "Habit"),
    ]
    # draw arcs between nodes (approximate with lines)
    for i, (nx, ny, lbl) in enumerate(nodes):
        nxt = nodes[(i+1) % 4]
        mx = (nx + nxt[0]) // 2
        my = (ny + nxt[1]) // 2
        parts.append(arr(nx, ny, nxt[0], nxt[1], accent=True))
        parts.append(circle(nx, ny, 36, "travel"))
        parts.append(f'<text x="{nx}" y="{ny}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')

    parts.append(note("North Star: Repeat Usage Share", cx, H - 44, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def travel_system_stages():
    """6-stage system flow with design decision annotations."""
    W, H = 1200, 380
    a = ACCENT["travel"]
    parts = [header(W, H, "travel"), title("Service Architecture — Stage Flow", W)]

    stages = [
        ("Discovery",    "history / price\nlocation / search"),
        ("Comparison",   "structured side-by-side\nnot manual tabs"),
        ("Eligibility",  "subsidy / quota\nchecked early"),
        ("Booking",      "form with\nreal-time validation"),
        ("Approval",     "decision\n+ alternatives"),
        ("Outcome",      "confirmation\n+ pre-trip info"),
    ]
    bw, bh = 155, 72
    gap = 18
    total_w = len(stages) * bw + (len(stages) - 1) * gap
    start_x = (W - total_w) // 2
    y = 110

    for i, (lbl, sub) in enumerate(stages):
        x = start_x + i * (bw + gap)
        highlighted = i in (2, 3)  # eligibility + booking as key redesign areas
        stroke = a if highlighted else BORDER
        sw = "1.5" if highlighted else "1"
        fill = BOX2 if highlighted else BOX
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        # stage number
        parts.append(f'<text x="{x+10}" y="{y+16}" font-family="{FONT}" font-size="10" fill="{TEXT_MUT}">{i+1:02d}</text>')
        # label
        parts.append(f'<text x="{x + bw//2}" y="{y + 32}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')
        # sub (split by \n)
        for j, line in enumerate(sub.split("\n")):
            parts.append(f'<text x="{x + bw//2}" y="{y + 49 + j*14}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">{line}</text>')
        # arrow
        if i < len(stages) - 1:
            ax = x + bw
            parts.append(arr(ax, y + bh//2, ax + gap, y + bh//2))

    # annotations below key stages
    annot = {
        2: ("moved before booking", "reduces failed attempts"),
        3: ("inline validation", "no failed submissions"),
    }
    for i, (line1, line2) in annot.items():
        x = start_x + i * (bw + gap) + bw // 2
        parts.append(note(line1, x, y + bh + 28, 10, a))
        parts.append(note(line2, x, y + bh + 42, 10, TEXT_MUT))

    parts.append(note("Goal: make the system learnable — not just usable once", W // 2, H - 30, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def travel_journey_types():
    """Three user types: first-time / returning / habitual."""
    W, H = 1200, 440
    a = ACCENT["travel"]
    parts = [header(W, H, "travel"), title("User Journey Types — Trust Progression", W)]

    types = [
        ("First-time",  "Full uncertainty. Needs guidance at every step.\nHigh interpretation cost. Low confidence.",  "#ef4444"),
        ("Returning",   "Partial trust. Remembers flow structure.\nValidates key steps. Shorter recovery loops.",    a),
        ("Habitual",    "Pattern established. Moves directly to known paths.\nSystem feels predictable. High retention.", "#10b981"),
    ]
    stages = ["Discovery", "Eligibility", "Booking", "Approval", "Outcome"]
    col_w = 156
    col_gap = 16
    total_w = len(stages) * col_w + (len(stages)-1) * col_gap
    sx = (W - total_w) // 2
    ty = 90

    # Stage headers
    for i, s in enumerate(stages):
        x = sx + i * (col_w + col_gap) + col_w // 2
        parts.append(note(s, x, ty, 11, TEXT_MUT))
        parts.append(vline(sx + i * (col_w + col_gap), ty + 10, H - 50, dashed=True))

    for row, (user_type, desc, color) in enumerate(types):
        y = ty + 40 + row * 100
        # user type label
        parts.append(f'<rect x="40" y="{y}" width="100" height="60" rx="4" fill="{BOX}" stroke="{color}" stroke-width="1.5"/>')
        parts.append(f'<text x="90" y="{y+24}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="600" fill="{TEXT_PRI}">{user_type}</text>')
        parts.append(f'<text x="90" y="{y+40}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">user</text>')
        # nodes
        for i in range(len(stages)):
            opacity = 0.3 + (i / (len(stages)-1)) * 0.7 if row == 0 else (0.6 + row * 0.15)
            nx = sx + i * (col_w + col_gap) + col_w // 2
            ny = y + 30
            parts.append(f'<circle cx="{nx}" cy="{ny}" r="16" fill="{BOX}" stroke="{color}" stroke-width="1.5" opacity="0.9"/>')
            # different fill per user type — first-time has gaps
            if row == 0 and i > 1:
                parts.append(f'<text x="{nx}" y="{ny+1}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="9" fill="#ef4444">?</text>')
            if i < len(stages) - 1:
                parts.append(f'<line x1="{nx+16}" y1="{ny}" x2="{nx + col_w + col_gap - 16}" y2="{ny}" stroke="{color}" stroke-width="1.5" stroke-dasharray="{"4 4" if row == 0 else "none"}" marker-end="url(#arr-a)"/>')

    parts.append(note("Design goal: reduce first-time uncertainty → accelerate path to habitual usage", W//2, H - 28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


# ─── Railway Booking Flow ─────────────────────────────────────────────────────

def railway_state_machine():
    """Request lifecycle: Draft → Sent → Received → Answered → Closed + Escalation."""
    W, H = 1200, 480
    a = ACCENT["railway"]
    parts = [header(W, H, "railway"), title("Request State Machine", W)]

    states = ["Draft", "Sent", "Received", "Answered", "Closed"]
    bw, bh = 140, 56
    gap = 60
    total_w = len(states) * bw + (len(states)-1) * gap
    sx = (W - total_w) // 2
    y = 180

    for i, s in enumerate(states):
        x = sx + i * (bw + gap)
        is_acc = i in (2, 3)
        stroke = a if is_acc else BORDER
        sw = "1.5" if is_acc else "1"
        fill = BOX2 if is_acc else BOX
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        parts.append(f'<text x="{x+bw//2}" y="{y+bh//2}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="14" font-weight="500" fill="{TEXT_PRI}">{s}</text>')
        if i < len(states) - 1:
            ax = x + bw
            parts.append(arr(ax, y + bh//2, ax + gap, y + bh//2))

    # Escalation branch: from Answered → up → loop back to Received
    answered_x = sx + 3 * (bw + gap)
    received_x = sx + 2 * (bw + gap)
    esc_y = 100

    # Escalation node
    esc_bx = (answered_x + received_x) // 2 + bw // 2 - 70
    parts.append(f'<rect x="{esc_bx}" y="{esc_y - 30}" width="140" height="50" rx="4" fill="{BOX}" stroke="{a}" stroke-width="1.5" stroke-dasharray="5 3"/>')
    parts.append(f'<text x="{esc_bx + 70}" y="{esc_y - 5}" text-anchor="middle" font-family="{FONT}" font-size="13" fill="{TEXT_PRI}">Escalated</text>')

    # Arrows for escalation
    parts.append(path_arr(f"M {answered_x + bw//2} {y} L {answered_x + bw//2} {esc_y + 20}"))
    parts.append(path_arr(f"M {esc_bx} {esc_y - 5} L {received_x + bw//2} {esc_y - 5} L {received_x + bw//2} {y}"))

    parts.append(note("escalation", answered_x + bw//2 + 8, y - 20, 10, TEXT_MUT, "start"))
    parts.append(note("re-routes to Received", received_x + bw//2 + 8, esc_y - 20, 10, TEXT_MUT, "start"))

    # Legend
    parts.append(f'<rect x="{sx}" y="{y + bh + 40}" width="12" height="12" rx="2" fill="{BOX}" stroke="{a}" stroke-width="1.5"/>')
    parts.append(note("Active processing state", sx + 20, y + bh + 51, 11, TEXT_SEC, "start"))
    parts.append(f'<rect x="{sx + 220}" y="{y + bh + 40}" width="12" height="12" rx="2" fill="{BOX}" stroke="{a}" stroke-width="1.5" stroke-dasharray="4 2"/>')
    parts.append(note("Exception path", sx + 240, y + bh + 51, 11, TEXT_SEC, "start"))

    parts.append(note("All states are explicit — no ambiguity, no silent failures", W // 2, H - 28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def railway_system_layers():
    """Layered architecture: UI is the last layer."""
    W, H = 1200, 500
    a = ACCENT["railway"]
    parts = [header(W, H, "railway"), title("System Architecture — Layered Model", W)]

    layers = [
        ("Interfaces",       "Mobile  ·  Web",               a),
        ("Notifications",    "Push  ·  Email  ·  In-app",    "#94a3b8"),
        ("State Machine",    "Draft → Sent → Received → Answered → Closed",  "#94a3b8"),
        ("Routing Logic",    "Category-based  ·  Priority rules",             "#94a3b8"),
        ("User Input",       "Request form  ·  Attachment  ·  Category",      "#94a3b8"),
    ]
    bh = 62
    gap = 6
    bw = 780
    sx = (W - bw) // 2
    total_h = len(layers) * (bh + gap) - gap
    start_y = (H - total_h) // 2 + 20

    for i, (lbl, sub, color) in enumerate(layers):
        y = start_y + i * (bh + gap)
        is_top = i == 0
        stroke = color if is_top else BORDER
        sw = "1.5" if is_top else "1"
        fill = BOX2 if is_top else BOX
        parts.append(f'<rect x="{sx}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        # Layer number (bottom = 1)
        ln = len(layers) - i
        parts.append(f'<text x="{sx+14}" y="{y + bh//2}" dominant-baseline="middle" font-family="{FONT}" font-size="10" fill="{TEXT_MUT}">L{ln}</text>')
        parts.append(f'<text x="{sx + bw//2 - 60}" y="{y + bh//2 - 8}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="600" fill="{TEXT_PRI}">{lbl}</text>')
        parts.append(f'<text x="{sx + bw//2 - 60}" y="{y + bh//2 + 12}" text-anchor="middle" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">{sub}</text>')
        # connector arrows between layers
        if i < len(layers) - 1:
            cy = y + bh + gap // 2
            parts.append(f'<line x1="{W//2}" y1="{y+bh}" x2="{W//2}" y2="{y+bh+gap}" stroke="{BORDER}" stroke-width="1.5" marker-end="url(#arr)"/>')

    # Right-side annotation
    ann_x = sx + bw + 30
    parts.append(f'<text x="{ann_x}" y="{start_y + bh//2}" text-anchor="start" font-family="{FONT}" font-size="11" fill="{a}">← UI layer</text>')
    parts.append(note("last, not first", ann_x, start_y + bh//2 + 16, 10, TEXT_MUT, "start"))

    parts.append(note("Interface reflects system logic — it does not define it", W//2, H - 28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def railway_communication_loop():
    """Closed communication loop."""
    W, H = 1200, 460
    a = ACCENT["railway"]
    parts = [header(W, H, "railway"), title("Communication Loop — Closed System", W)]

    steps = [
        ("Submit Request",   "form + category\n+ attachment"),
        ("Classification",   "type detection\n+ priority"),
        ("Routing",          "department\nassignment"),
        ("Processing",       "response\n+ timeline"),
        ("Response",         "answer\n+ status update"),
        ("Feedback",         "user evaluation\n+ close / escalate"),
    ]
    bw, bh = 148, 72
    gap = 28
    total = len(steps) * bw + (len(steps)-1) * gap
    sx = (W - total) // 2
    y = 160

    for i, (lbl, sub) in enumerate(steps):
        x = sx + i * (bw + gap)
        is_key = i in (0, 5)
        stroke = a if is_key else BORDER
        sw = "1.5" if is_key else "1"
        fill = BOX2 if is_key else BOX
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        parts.append(f'<text x="{x+bw//2}" y="{y+24}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')
        for j, line in enumerate(sub.split("\n")):
            parts.append(f'<text x="{x+bw//2}" y="{y+43+j*14}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">{line}</text>')
        if i < len(steps) - 1:
            ax = x + bw
            is_acc = is_key or i == 4
            parts.append(arr(ax, y + bh//2, ax + gap, y + bh//2, accent=is_acc))

    # Return arc bottom
    last_x = sx + (len(steps)-1) * (bw + gap) + bw
    first_x = sx
    loop_y = y + bh + 50
    parts.append(f'<path d="M {last_x} {y+bh//2} L {last_x + 20} {y+bh//2} L {last_x + 20} {loop_y} L {first_x - 20} {loop_y} L {first_x - 20} {y+bh//2} L {first_x} {y+bh//2}" stroke="{ARROW}" stroke-width="1.5" fill="none" marker-end="url(#arr)"/>')
    parts.append(note("closed loop — no open-ended threads", W//2, loop_y + 18, 10, TEXT_MUT))

    # Branch to escalation
    resp_x = sx + 4 * (bw + gap) + bw // 2
    parts.append(f'<line x1="{resp_x}" y1="{y}" x2="{resp_x}" y2="{y-40}" stroke="{a}" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arr-a)"/>')
    parts.append(note("escalation path", resp_x + 8, y - 22, 10, a, "start"))

    parts.append(note("Every request has a defined lifecycle — no ambiguous states", W//2, H - 28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


# ─── MegaMod ──────────────────────────────────────────────────────────────────

def megamod_ecosystem_map():
    """Two-layer architecture: ecosystem + 7 verticals."""
    W, H = 1200, 500
    a = ACCENT["megamod"]
    parts = [header(W, H, "megamod"), title("Ecosystem Architecture — Two-Layer Model", W)]

    # Ecosystem layer
    ex, ey, ew, eh = 200, 90, 800, 70
    parts.append(f'<rect x="{ex}" y="{ey}" width="{ew}" height="{eh}" rx="4" fill="{BOX2}" stroke="{a}" stroke-width="1.5"/>')
    parts.append(f'<text x="{ex+ew//2}" y="{ey+26}" text-anchor="middle" font-family="{FONT}" font-size="14" font-weight="600" fill="{TEXT_PRI}">Ecosystem Layer — Main Page</text>')
    parts.append(f'<text x="{ex+ew//2}" y="{ey+48}" text-anchor="middle" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">frames the system · routes audiences · does not sell</text>')
    # Layer label
    parts.append(note("L2", ex - 30, ey + eh//2, 11, a))

    # Vertical pages
    verticals = ["Creators", "Streamers", "Platforms", "Events &\nBrands", "Education", "B2G", "Developers"]
    vbw = 120
    vbh = 80
    vgap = (W - 80 - len(verticals) * vbw) // (len(verticals) - 1)
    vy = 260
    vx_start = 40

    parts.append(note("L1", ex - 30, vy + vbh//2, 11, TEXT_MUT))

    for i, v in enumerate(verticals):
        vx = vx_start + i * (vbw + vgap)
        parts.append(f'<rect x="{vx}" y="{vy}" width="{vbw}" height="{vbh}" rx="4" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>')
        for j, line in enumerate(v.split("\n")):
            offset = -7 if "\n" in v else 0
            parts.append(f'<text x="{vx+vbw//2}" y="{vy+vbh//2+offset+j*17}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{line}</text>')
        # Arrow from ecosystem down
        from_x = ex + (i * ew // len(verticals)) + ew // (len(verticals) * 2)
        to_x = vx + vbw // 2
        parts.append(f'<path d="M {from_x} {ey+eh} L {from_x} {vy - 30} L {to_x} {vy - 30} L {to_x} {vy}" stroke="{ARROW}" stroke-width="1" fill="none" marker-end="url(#arr)"/>')

    # Annotation
    parts.append(note("same structural rhythm · different language per audience", W//2, vy + vbh + 36, 11, TEXT_SEC))
    parts.append(note("adding a vertical = following a pattern, not reinventing a narrative", W//2, vy + vbh + 54, 11, TEXT_MUT))
    parts.append(footer())
    return "\n".join(parts)


def megamod_narrative_rhythm():
    """Consistent narrative structure across all vertical pages."""
    W, H = 1200, 540
    a = ACCENT["megamod"]
    parts = [header(W, H, "megamod"), title("Narrative Rhythm — Structural Consistency", W)]

    blocks = [
        ("Hero",           "audience problem,\nnot brand intro"),
        ("Problem Framing","specific pain point\nin their language"),
        ("How It Works",   "capability →\ntheir outcome"),
        ("Proof",          "evidence relevant\nto their context"),
        ("Use Cases",      "their scenarios,\nnot generic"),
        ("CTA",            "action aligned\nwith their goal"),
    ]

    columns = [
        ("Creators",   ACCENT["megamod"]),
        ("Streamers",  "#60a5fa"),
        ("Platforms",  "#94a3b8"),
    ]

    bw = 200
    gap = 60
    total_w = len(columns) * bw + (len(columns)-1) * gap
    sx = (W - total_w) // 2
    block_h = 50
    block_gap = 8
    start_y = 100

    # Column headers
    for j, (col_name, col_color) in enumerate(columns):
        cx = sx + j * (bw + gap) + bw // 2
        parts.append(f'<text x="{cx}" y="{start_y - 16}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="600" fill="{col_color}">{col_name}</text>')

    for i, (block_name, block_desc) in enumerate(blocks):
        y = start_y + i * (block_h + block_gap)
        for j, (col_name, col_color) in enumerate(columns):
            x = sx + j * (bw + gap)
            is_first = j == 0
            stroke = col_color if is_first else BORDER
            sw = "1.5" if is_first else "1"
            fill = BOX2 if is_first else BOX
            parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{block_h}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
            parts.append(f'<text x="{x+bw//2}" y="{y+18}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{block_name}</text>')
            for k, line in enumerate(block_desc.split("\n")):
                parts.append(f'<text x="{x+bw//2}" y="{y+33+k*12}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">{line}</text>')

        # left annotation
        parts.append(note(f"{i+1}", sx - 28, y + block_h//2, 11, TEXT_MUT))

    # Equivalence connectors
    for i in range(len(blocks)):
        y = start_y + i * (block_h + block_gap) + block_h // 2
        for j in range(len(columns) - 1):
            x1 = sx + j * (bw + gap) + bw
            x2 = x1 + gap
            parts.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{BORDER}" stroke-width="1" stroke-dasharray="3 3"/>')

    parts.append(note("same structure, different language — the system is scalable by design", W//2, H - 28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def megamod_audience_matrix():
    """7 audiences with their key question and outcome."""
    W, H = 1200, 420
    a = ACCENT["megamod"]
    parts = [header(W, H, "megamod"), title("Audience Matrix — Segmentation Model", W)]

    audiences = [
        ("Creators",       "Can I build &\nmonetize here?",        "revenue &\naudience"),
        ("Streamers",      "Will this improve\nretention?",         "engagement\nmetrics"),
        ("Platforms",      "What's the\nintegration path?",         "adoption &\nROI"),
        ("Events &\nBrands","Can I reach\nmy audience?",            "reach &\nconversion"),
        ("Education",      "Is this structured\nfor learning?",     "completion\nrate"),
        ("B2G",            "Is this enterprise\n& compliant?",      "infrastructure\nfit"),
        ("Developers",     "Where do I\nstart building?",           "API &\ndocs"),
    ]

    bw = 138
    bh = 130
    gap = (W - 80 - len(audiences) * bw) // (len(audiences) - 1)
    sx = 40
    y = 120

    for i, (name, question, outcome) in enumerate(audiences):
        x = sx + i * (bw + gap)
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>')
        # Accent top bar
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="3" rx="2" fill="{a}" opacity="0.6"/>')
        # Name
        for j, line in enumerate(name.split("\n")):
            parts.append(f'<text x="{x+bw//2}" y="{y+22+j*16}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="600" fill="{TEXT_PRI}">{line}</text>')
        # Question
        parts.append(hline(x+10, y+44, x+bw-10, dashed=True))
        parts.append(note("arrives with:", x+bw//2, y+56, 9, TEXT_MUT))
        for j, line in enumerate(question.split("\n")):
            parts.append(f'<text x="{x+bw//2}" y="{y+70+j*14}" text-anchor="middle" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">{line}</text>')
        # Outcome
        parts.append(hline(x+10, y+100, x+bw-10, dashed=True))
        parts.append(note("measures:", x+bw//2, y+111, 9, TEXT_MUT))
        for j, line in enumerate(outcome.split("\n")):
            parts.append(f'<text x="{x+bw//2}" y="{y+121+j*13}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{a}">{line}</text>')

    parts.append(note("Segment first — relevance precedes brand storytelling", W//2, H - 30, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


# ─── Greek Vacation ───────────────────────────────────────────────────────────

def greek_decision_flow():
    """Old broken flow vs new decision-first architecture."""
    W, H = 1200, 500
    a = ACCENT["greek"]
    parts = [header(W, H, "greek"), title("Decision Flow Architecture", W)]

    parts.append(vline(W//2, 60, H - 40, dashed=True))
    parts.append(note("CURRENT STATE — search-driven", W//4, 76, 11, TEXT_MUT))
    parts.append(note("PROPOSED — decision-first", 3*W//4, 76, 11, TEXT_MUT))

    # OLD flow
    old_steps = [
        ("Vague Intent",       "I want a vacation"),
        ("Search",             "keyword / date / location"),
        ("Browse",             "scroll 100+ results"),
        ("Multiple Tabs",      "open, compare, forget"),
        ("External Validation","Google / review sites"),
        ("Abandon / Delay",    "decision fatigue"),
    ]
    bw, bh = 180, 56
    sx_old = 40
    gap = 18
    total_h = len(old_steps) * bh + (len(old_steps)-1) * gap
    sy = (H - total_h) // 2 + 10
    for i, (lbl, sub) in enumerate(old_steps):
        y = sy + i * (bh + gap)
        col = "#ef4444" if i == 5 else BORDER
        sw = "1.5" if i == 5 else "1"
        fill = BOX2 if i == 5 else BOX
        parts.append(f'<rect x="{sx_old}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{col}" stroke-width="{sw}"/>')
        parts.append(f'<text x="{sx_old+bw//2}" y="{y+20}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')
        parts.append(f'<text x="{sx_old+bw//2}" y="{y+37}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">{sub}</text>')
        if i < len(old_steps) - 1:
            parts.append(arr(sx_old + bw//2, y + bh, sx_old + bw//2, y + bh + gap))

    # NEW flow
    new_steps = [
        ("Intent Capture",    "preferences, not keywords", True),
        ("Option Reduction",  "curated set, not full catalog", False),
        ("Curated Options",   "3–5 relevant results", True),
        ("Reasoning",         "why this matches your criteria", False),
        ("Iterative Loop",    "refine without starting over", False),
        ("Confident Decision","book without second-guessing", True),
    ]
    sx_new = W//2 + 40
    for i, (lbl, sub, highlight) in enumerate(new_steps):
        y = sy + i * (bh + gap)
        col = a if highlight else BORDER
        sw = "1.5" if highlight else "1"
        fill = BOX2 if highlight else BOX
        parts.append(f'<rect x="{sx_new}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{col}" stroke-width="{sw}"/>')
        parts.append(f'<text x="{sx_new+bw//2}" y="{y+20}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')
        parts.append(f'<text x="{sx_new+bw//2}" y="{y+37}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">{sub}</text>')
        if i < len(new_steps) - 1:
            parts.append(arr(sx_new + bw//2, y + bh, sx_new + bw//2, y + bh + gap, accent=(highlight or new_steps[i+1][2])))

    parts.append(note("North Star: Decision Confidence Rate", W//2 + 200, H - 28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def greek_behavior_pattern():
    """The reinforcing loop of decision fatigue."""
    W, H = 1200, 460
    a = ACCENT["greek"]
    parts = [header(W, H, "greek"), title("Behavior Model — Decision Fatigue Loop", W)]

    cx, cy = W//2, H//2 + 10
    nodes = [
        (cx,       cy-160,  "Vague Intent",      "I want a trip, but where?"),
        (cx+170,   cy-80,   "Over-browsing",      "scroll without criteria"),
        (cx+170,   cy+80,   "Tab Accumulation",   "compare without framework"),
        (cx,       cy+160,  "External Validation","search reviews, ask friends"),
        (cx-170,   cy+80,   "Postponed Decision", "\"I'll decide tomorrow\""),
        (cx-170,   cy-80,   "Decision Fatigue",   "options feel equal / overwhelming"),
    ]

    for i, (nx, ny, lbl, sub) in enumerate(nodes):
        r = 52
        nxt = nodes[(i+1) % len(nodes)]
        # Arrow
        dx = nxt[0] - nx
        dy = nxt[1] - ny
        dist = (dx**2 + dy**2)**0.5
        ux, uy = dx/dist, dy/dist
        parts.append(f'<line x1="{int(nx + ux*r)}" y1="{int(ny + uy*r)}" x2="{int(nxt[0] - ux*r)}" y2="{int(nxt[1] - uy*r)}" stroke="{ARROW}" stroke-width="1.5" marker-end="url(#arr)"/>')
        # Node
        parts.append(f'<ellipse cx="{nx}" cy="{ny}" rx="52" ry="32" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>')
        parts.append(f'<text x="{nx}" y="{ny-4}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')
        parts.append(f'<text x="{nx}" y="{ny+12}" text-anchor="middle" font-family="{FONT}" font-size="9" fill="{TEXT_MUT}">{sub}</text>')

    # Center intervention label
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="50" fill="{BOX}" stroke="{a}" stroke-width="1.5" stroke-dasharray="4 3"/>')
    parts.append(f'<text x="{cx}" y="{cy-8}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="600" fill="{a}">Design</text>')
    parts.append(f'<text x="{cx}" y="{cy+8}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="600" fill="{a}">Intervention</text>')

    parts.append(note("Users aren't solving a search problem — they're solving a decision problem", W//2, H-28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def greek_design_tradeoffs():
    """4 design tradeoff spectrums."""
    W, H = 1200, 420
    a = ACCENT["greek"]
    parts = [header(W, H, "greek"), title("Design Tradeoffs", W)]

    tradeoffs = [
        ("Breadth", "Clarity",     "Clarity",     "Limit visible options to reduce cognitive load"),
        ("Speed",   "Confidence",  "Confidence",  "Add upfront steps to increase decision quality"),
        ("Control", "Guidance",    "Guidance",    "Reduce free exploration in favor of structured flow"),
        ("Funnel",  "Loop",        "Loop",        "Support iterative refinement, not linear pressure"),
    ]
    bar_w = 500
    bar_h = 10
    sx = (W - bar_w) // 2
    row_h = 80
    start_y = 100

    for i, (left, right, chosen, rationale) in enumerate(tradeoffs):
        y = start_y + i * row_h
        # Labels
        parts.append(f'<text x="{sx - 14}" y="{y+bar_h//2+5}" text-anchor="end" font-family="{FONT}" font-size="13" fill="{TEXT_MUT}">{left}</text>')
        parts.append(f'<text x="{sx + bar_w + 14}" y="{y+bar_h//2+5}" text-anchor="start" font-family="{FONT}" font-size="13" fill="{a}" font-weight="500">{right}</text>')
        # Bar track
        parts.append(f'<rect x="{sx}" y="{y}" width="{bar_w}" height="{bar_h}" rx="5" fill="{BOX2}" stroke="{BORDER}" stroke-width="1"/>')
        # Fill
        chosen_frac = 0.8
        parts.append(f'<rect x="{sx}" y="{y}" width="{int(bar_w * chosen_frac)}" height="{bar_h}" rx="5" fill="{a}" opacity="0.25"/>')
        # Marker
        mx = sx + int(bar_w * chosen_frac)
        parts.append(f'<circle cx="{mx}" cy="{y+bar_h//2}" r="8" fill="{a}" stroke="{BG}" stroke-width="2"/>')
        # Rationale
        parts.append(note(rationale, sx + bar_w//2, y + 30, 11, TEXT_SEC))

    parts.append(note("Each tradeoff chosen to reduce cognitive load and increase decision confidence", W//2, H-28, 11, TEXT_MUT))
    parts.append(footer())
    return "\n".join(parts)


# ─── Design System Runtime ────────────────────────────────────────────────────

def design_three_layer():
    """Three-layer runtime system."""
    W, H = 1200, 520
    a = ACCENT["design"]
    parts = [header(W, H, "design"), title("Three-Layer Runtime Architecture", W)]

    layers = [
        (
            "Token Normalization Engine",
            a,
            [
                "Figma API → pull tokens",
                "Naming convention validation",
                "TypeScript type generation",
                "npm publish  ·  < 5 min pipeline",
            ]
        ),
        (
            "Pattern Validation Layer",
            "#f59e0b",
            [
                "200+ automated checks",
                "ESLint rules at build time",
                "Jest component tests",
                "Non-blocking warnings",
            ]
        ),
        (
            "Governance Dashboard",
            "#10b981",
            [
                "Real-time health score: 87%",
                "Token drift tracking",
                "Adoption rate per team",
                "IDE: Figma + VS Code plugins",
            ]
        ),
    ]

    bh = 120
    gap = 16
    bw = 320
    total_w = len(layers) * bw + (len(layers)-1) * gap
    sx = (W - total_w) // 2
    y = 130

    for i, (title_text, color, items) in enumerate(layers):
        x = sx + i * (bw + gap)
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{BOX}" stroke="{color}" stroke-width="1.5"/>')
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="3" rx="2" fill="{color}"/>')
        # Layer number
        parts.append(f'<text x="{x+12}" y="{y+20}" font-family="{FONT}" font-size="10" fill="{TEXT_MUT}">L{i+1}</text>')
        parts.append(f'<text x="{x+bw//2}" y="{y+22}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="600" fill="{TEXT_PRI}">{title_text}</text>')
        for j, item in enumerate(items):
            parts.append(f'<text x="{x+16}" y="{y+44+j*18}" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">· {item}</text>')
        # Arrow between layers
        if i < len(layers) - 1:
            ax = x + bw
            parts.append(arr(ax, y + bh//2, ax + gap, y + bh//2))

    # Token source (top)
    src_y = y - 70
    parts.append(f'<rect x="{sx + (total_w - 200)//2}" y="{src_y}" width="200" height="44" rx="4" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>')
    parts.append(f'<text x="{W//2}" y="{src_y+22}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="12" fill="{TEXT_SEC}">Figma Design System</text>')
    parts.append(arr(W//2, src_y+44, W//2, y))

    # Output (bottom)
    out_y = y + bh + 50
    outputs = ["CI/CD pipeline", "IDE feedback", "Quality dashboard", "npm packages"]
    out_bw = 160
    out_gap = 20
    out_total = len(outputs) * out_bw + (len(outputs)-1) * out_gap
    out_sx = (W - out_total) // 2
    for i, o in enumerate(outputs):
        ox = out_sx + i * (out_bw + out_gap)
        parts.append(f'<rect x="{ox}" y="{out_y}" width="{out_bw}" height="40" rx="4" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>')
        parts.append(f'<text x="{ox+out_bw//2}" y="{out_y+20}" text-anchor="middle" dominant-baseline="middle" font-family="{FONT}" font-size="11" fill="{TEXT_SEC}">{o}</text>')
        parts.append(arr(W//2 - out_total//2 + i*(out_bw+out_gap) + out_bw//2, y+bh, ox+out_bw//2, out_y))

    parts.append(note("Design rules as code — enforcement without human bottlenecks", W//2, H-28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


def design_token_pipeline():
    """Figma → TypeScript → CI/CD pipeline."""
    W, H = 1200, 340
    a = ACCENT["design"]
    parts = [header(W, H, "design"), title("Token Pipeline — Figma to Production", W)]

    steps = [
        ("Figma API",       "design tokens\nsource of truth"),
        ("Pull Tokens",     "fetch raw\nJSON values"),
        ("Validate Names",  "convention check\nformat rules"),
        ("Generate Types",  "TypeScript\n+ constants"),
        ("npm publish",     "versioned\npackage"),
        ("CI/CD check",     "build-time\nenforcement"),
        ("Production",      "consistent\ntokens"),
    ]
    bw, bh = 132, 72
    gap = 20
    total_w = len(steps) * bw + (len(steps)-1) * gap
    sx = (W - total_w) // 2
    y = 130

    for i, (lbl, sub) in enumerate(steps):
        x = sx + i * (bw + gap)
        is_src = i == 0
        is_out = i == len(steps) - 1
        stroke = a if (is_src or is_out) else BORDER
        sw = "1.5" if (is_src or is_out) else "1"
        fill = BOX2 if (is_src or is_out) else BOX
        parts.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        parts.append(f'<text x="{x+bw//2}" y="{y+22}" text-anchor="middle" font-family="{FONT}" font-size="12" font-weight="500" fill="{TEXT_PRI}">{lbl}</text>')
        for j, line in enumerate(sub.split("\n")):
            parts.append(f'<text x="{x+bw//2}" y="{y+40+j*14}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="{TEXT_SEC}">{line}</text>')
        if i < len(steps) - 1:
            ax = x + bw
            parts.append(arr(ax, y+bh//2, ax+gap, y+bh//2))

    # Timing annotation
    parts.append(note("< 5 minutes end-to-end", W//2, y + bh + 36, 12, a))
    parts.append(note("Figma change → production tokens in one automated run", W//2, y + bh + 54, 11, TEXT_MUT))
    parts.append(footer())
    return "\n".join(parts)


def design_metrics_delta():
    """Before → After metrics."""
    W, H = 1200, 440
    a = ACCENT["design"]
    parts = [header(W, H, "design"), title("Results — Before vs After", W)]

    metrics = [
        ("Token Consistency",       "53%",  "95%",   "+42pp"),
        ("Handoff Time",            "3 days","2 hours","-95%"),
        ("Design Maintenance",      "95% of time", "5% of time", "-90pp"),
        ("Automated Component Reviews", "0%", "80%",  "+80pp"),
    ]

    col_w = 220
    total_w = (len(metrics) * col_w) + (len(metrics)-1) * 40
    sx = (W - total_w) // 2
    col_gap = 40
    card_h = 180
    y = 110

    for i, (metric, before, after, delta) in enumerate(metrics):
        x = sx + i * (col_w + col_gap)
        parts.append(f'<rect x="{x}" y="{y}" width="{col_w}" height="{card_h}" rx="4" fill="{BOX}" stroke="{BORDER}" stroke-width="1"/>')
        parts.append(f'<rect x="{x}" y="{y}" width="{col_w}" height="3" rx="2" fill="{a}"/>')
        # metric name
        parts.append(f'<text x="{x+col_w//2}" y="{y+22}" text-anchor="middle" font-family="{FONT}" font-size="11" font-weight="600" fill="{TEXT_SEC}">{metric}</text>')
        # before
        parts.append(hline(x+16, y+36, x+col_w-16, dashed=True))
        parts.append(note("before", x+col_w//2, y+52, 9, TEXT_MUT))
        parts.append(f'<text x="{x+col_w//2}" y="{y+76}" text-anchor="middle" font-family="{FONT}" font-size="20" fill="#ef4444" font-weight="700">{before}</text>')
        # arrow
        parts.append(arr(x+col_w//2, y+88, x+col_w//2, y+106, accent=True))
        # after
        parts.append(f'<text x="{x+col_w//2}" y="{y+128}" text-anchor="middle" font-family="{FONT}" font-size="20" fill="{a}" font-weight="700">{after}</text>')
        parts.append(note("after", x+col_w//2, y+148, 9, TEXT_MUT))
        # delta
        parts.append(f'<text x="{x+col_w//2}" y="{y+168}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="600" fill="#10b981">{delta}</text>')

    parts.append(note("87% system health score — trend direction, not just current state", W//2, H-28, 11, TEXT_SEC))
    parts.append(footer())
    return "\n".join(parts)


# ─── Output ───────────────────────────────────────────────────────────────────

DIAGRAMS = {
    "travel-booking-platform": [
        ("behavioral-model",   travel_behavioral_model),
        ("system-stages",      travel_system_stages),
        ("journey-types",      travel_journey_types),
    ],
    "railway-booking-flow": [
        ("state-machine",      railway_state_machine),
        ("system-layers",      railway_system_layers),
        ("communication-loop", railway_communication_loop),
    ],
    "megamod": [
        ("ecosystem-map",      megamod_ecosystem_map),
        ("narrative-rhythm",   megamod_narrative_rhythm),
        ("audience-matrix",    megamod_audience_matrix),
    ],
    "my-perfect-greek-vacation": [
        ("decision-flow",      greek_decision_flow),
        ("behavior-pattern",   greek_behavior_pattern),
        ("design-tradeoffs",   greek_design_tradeoffs),
    ],
    "design-system-runtime": [
        ("three-layer-runtime", design_three_layer),
        ("token-pipeline",      design_token_pipeline),
        ("metrics-delta",       design_metrics_delta),
    ],
}

CASE_LABELS = {
    "travel-booking-platform":    "RZD — Sanatorium Booking",
    "railway-booking-flow":       "RZD — Communication System",
    "megamod":                    "MegaMod — Multi-Product Ecosystem",
    "my-perfect-greek-vacation":  "Travel Booking — Decision UX",
    "design-system-runtime":      "Design System Runtime",
}

ACCENT_MAP = {
    "travel-booking-platform":    ACCENT["travel"],
    "railway-booking-flow":       ACCENT["railway"],
    "megamod":                    ACCENT["megamod"],
    "my-perfect-greek-vacation":  ACCENT["greek"],
    "design-system-runtime":      ACCENT["design"],
}


def generate_all():
    root = Path(__file__).parent.parent
    public_cases = root / "public" / "cases"
    downloads = Path.home() / "Downloads"

    svgs_generated = []

    for case_slug, diagrams in DIAGRAMS.items():
        out_dir = public_cases / case_slug
        out_dir.mkdir(parents=True, exist_ok=True)
        for name, fn in diagrams:
            svg_content = fn()
            path = out_dir / f"{name}.svg"
            path.write_text(svg_content, encoding="utf-8")
            svgs_generated.append((case_slug, name, path, svg_content))
            print(f"  ✓  {case_slug}/{name}.svg")

    # ── HTML preview ──────────────────────────────────────────────────────────
    html_parts = [f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Case Diagrams Preview</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: {BG};
    color: {TEXT_PRI};
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    padding: 40px 48px;
  }}
  .page-title {{
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: {TEXT_MUT};
    text-transform: uppercase;
    margin-bottom: 48px;
  }}
  .case-section {{
    margin-bottom: 64px;
  }}
  .case-header {{
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid {BORDER};
  }}
  .case-dot {{
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }}
  .case-title {{
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: {TEXT_SEC};
  }}
  .diagrams-grid {{
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }}
  .diagram-card {{
    border: 1px solid {BORDER};
    border-radius: 4px;
    overflow: hidden;
  }}
  .diagram-label {{
    padding: 8px 14px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: {TEXT_MUT};
    border-bottom: 1px solid {BORDER};
    background: {BOX};
  }}
  .diagram-card svg {{
    display: block;
    width: 100%;
    height: auto;
  }}
  .footer {{
    margin-top: 48px;
    font-size: 11px;
    color: {TEXT_MUT};
    border-top: 1px solid {BORDER};
    padding-top: 16px;
  }}
</style>
</head>
<body>
<div class="page-title">Portfolio — Case Diagrams Preview · {len(svgs_generated)} diagrams across 5 cases</div>
"""]

    # Group by case
    from collections import defaultdict
    by_case = defaultdict(list)
    for case_slug, name, path, svg_content in svgs_generated:
        by_case[case_slug].append((name, svg_content))

    for case_slug, diagrams in DIAGRAMS.items():
        accent = ACCENT_MAP[case_slug]
        label = CASE_LABELS[case_slug]
        html_parts.append(f'<div class="case-section">')
        html_parts.append(f'<div class="case-header"><div class="case-dot" style="background:{accent}"></div><div class="case-title">{label}</div></div>')
        html_parts.append(f'<div class="diagrams-grid">')
        for name, svg_content in by_case[case_slug]:
            html_parts.append(f'<div class="diagram-card"><div class="diagram-label">{name.replace("-", " ")}</div>{svg_content}</div>')
        html_parts.append('</div></div>')

    html_parts.append(f'<div class="footer">Generated · {len(svgs_generated)} diagrams · ginzburg.work portfolio</div>')
    html_parts.append('</body></html>')

    preview_path = downloads / "diagrams-preview.html"
    preview_path.write_text("\n".join(html_parts), encoding="utf-8")
    print(f"\n  ✓  Preview → {preview_path}")
    print(f"\nDone. {len(svgs_generated)} SVGs generated.")


if __name__ == "__main__":
    generate_all()
