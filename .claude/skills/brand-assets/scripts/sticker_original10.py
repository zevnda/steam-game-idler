"""Animated 'The Original 10' Discord stickers (320x320 GIF, transparent, <512KB). Based on the role
icon (ten dots on a ring around a bold "10", gradient #00f0ff -> #b100ff). Four variants; each frame
is an SVG string rendered with Playwright at 640px, then downsampled. 20fps (50ms) - the
Discord-safe rate."""
import sys, math, pathlib, random
from playwright.sync_api import sync_playwright
from PIL import Image

OUT = pathlib.Path(sys.argv[1]); ONLY = sys.argv[2:]
A, B = '#00f0ff', '#b100ff'
FPS = 20
CX = CY = 128
RING_R, DOT_R = 100, 14
NUM = "font-family:'Geist',sans-serif;font-weight:800;letter-spacing:-5px"
DEFS = (f'<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="236" y2="236">'
        f'<stop offset="0" stop-color="{A}"/><stop offset="1" stop-color="{B}"/></linearGradient>'
        '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>'
        '<linearGradient id="shine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="60" y2="0">'
        '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/>'
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>')


def dot_xy(i, rot=0.0, r=RING_R):
    a = math.radians(-90 + i * 36 + rot)
    return CX + r * math.cos(a), CY + r * math.sin(a)


def ring(opacity=.4):
    return f'<circle cx="{CX}" cy="{CY}" r="{RING_R}" fill="none" stroke="url(#g)" stroke-width="5" stroke-opacity="{opacity}"/>'


def number(scale=1.0, opacity=1.0, glow=0.0, extra=''):
    t = f'<text x="{CX}" y="{CY + 1}" text-anchor="middle" dominant-baseline="central" font-size="100" style="{NUM}"'
    g = (f'<g opacity="{glow:.3f}" filter="url(#glow)">{t} fill="url(#g)">10</text></g>' if glow > 0 else '')
    return (f'<g transform="translate({CX} {CY}) scale({scale:.4f}) translate({-CX} {-CY})" opacity="{opacity:.3f}">'
            f'{g}{t} fill="url(#g)">10</text>{extra}</g>')


def ease_out_back(x, s=1.7): x -= 1; return x * x * ((s + 1) * x + s) + 1
def ease_in_out(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def seg(t, a, b): return min(1, max(0, (t - a) / (b - a)))


# 1. roll call: dots light one by one (dim -> bright pop), "10" punches in on the tenth, hold, fade
def roll_call(t):  # t in seconds, loop 3.2s
    out = [ring(.3)]
    for i in range(10):
        on = seg(t, .15 + i * .14, .15 + i * .14 + .12)
        fade = seg(t, 2.7, 3.05)
        lit = on * (1 - fade)
        pop = 1 + .45 * math.sin(math.pi * on) * (1 - fade)
        x, y = dot_xy(i)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * pop:.2f}" fill="url(#g)" opacity="{.22 + .78 * lit:.3f}"/>')
    hit = seg(t, 1.55, 1.85)
    fade = seg(t, 2.7, 3.05)
    scale = (.6 + .4 * ease_out_back(hit)) if hit < 1 else 1
    glow = max(0, 1 - abs(t - 1.75) / .35) * (1 - fade)
    out.append(number(scale, (.25 + .75 * hit) * (1 - .75 * fade), glow))
    return ''.join(out)


# 2. orbit: dots circle the 10 with fading trails; one dot-spacing (36 deg) per 1.2s loop = seamless
def orbit(t):  # loop 1.2s
    rot = 36 * t / 1.2
    out = [ring(.3)]
    for i in range(10):
        for k in range(1, 6):  # trail ghosts behind each dot
            x, y = dot_xy(i, rot - k * 4.5)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * (1 - k * .13):.2f}" fill="url(#g)" opacity="{.38 - k * .065:.3f}"/>')
        x, y = dot_xy(i, rot)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R}" fill="url(#g)"/>')
    out.append(number(1 + .03 * math.sin(2 * math.pi * t / 1.2)))
    return ''.join(out)


# 3. assemble: dots fly in from outside (staggered, back-ease), 10 pops with a sparkle burst, hold,
# dots fly back out, repeat
SPARK = [(random.Random(3).uniform(0, 360), random.Random(i).uniform(40, 70)) for i in range(12)]
def assemble(t):  # loop 3.6s
    out = []
    ring_in = seg(t, .9, 1.2) * (1 - seg(t, 3.1, 3.3))
    out.append(ring(.3 * ring_in))
    for i in range(10):
        p_in = ease_out_back(seg(t, .1 + i * .07, .1 + i * .07 + .35), 1.3)
        p_out = ease_in_out(seg(t, 2.9 + i * .03, 3.3 + i * .03))
        r = RING_R + (1 - p_in) * 150 + p_out * 150
        x, y = dot_xy(i, 0, r)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R}" fill="url(#g)" opacity="{min(1, p_in * 1.5) * (1 - p_out):.3f}"/>')
    pop = seg(t, 1.0, 1.35); gone = seg(t, 3.0, 3.3)
    scale = ease_out_back(pop, 2.2) * (1 - .4 * gone) if pop > 0 else 0
    out.append(number(max(scale, .001), (1 - gone) if pop > 0 else 0, max(0, 1 - abs(t - 1.3) / .3)))
    burst = seg(t, 1.2, 1.75)
    if 0 < burst < 1:
        for k in range(12):
            a = math.radians(k * 30 + 15)
            d = 58 + 52 * burst
            x, y = CX + d * math.cos(a), CY + d * math.sin(a)
            s = 7 * (1 - burst)
            out.append(f'<path d="M{x:.1f} {y - s:.1f} L{x + s * .3:.1f} {y:.1f} L{x:.1f} {y + s:.1f} L{x - s * .3:.1f} {y:.1f}Z '
                       f'M{x - s:.1f} {y:.1f} L{x:.1f} {y - s * .3:.1f} L{x + s:.1f} {y:.1f} L{x:.1f} {y + s * .3:.1f}Z" fill="#fff" opacity="{1 - burst:.3f}"/>')
    return ''.join(out)


# 4. wave: a swell travels round the ring (two laps per loop), a shine sweeps across the 10
def wave(t):  # loop 2.0s
    out = [ring(.3)]
    head = (t / 2.0 * 2 * 360) % 360  # deg, clockwise from the top
    for i in range(10):
        da = ((i * 36 - head + 540) % 360) - 180
        s = math.exp(-(da / 40) ** 2)
        x, y = dot_xy(i, 0, RING_R + 8 * s)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * (1 + .55 * s):.2f}" fill="url(#g)" opacity="{.55 + .45 * s:.3f}"/>')
    # shine: a second "10" on top filled with a moving white band (a clipped, skewed rect drew
    # nothing), so the highlight only ever shows inside the number
    # gradient vector runs almost horizontally (slight tilt), so the band is a narrow diagonal
    # stripe that crosses the number left to right
    sx = 40 + 180 * ease_in_out(seg(t, .3, 1.1))
    shine = (f'<defs><linearGradient id="sh" gradientUnits="userSpaceOnUse" x1="{sx - 22:.1f}" y1="0" x2="{sx + 22:.1f}" y2="16">'
             '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/>'
             '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'
             f'<text x="{CX}" y="{CY + 1}" text-anchor="middle" dominant-baseline="central" font-size="100" style="{NUM}" fill="url(#sh)">10</text>')
    out.append(number(1, 1, 0, shine if 0 < seg(t, .3, 1.1) < 1 else ''))
    return ''.join(out)


# 5. power-up: each dot is a member joining - it ignites and beams energy into the 10, and every
# member raises the power level P: bigger glow, rising aura flames, harder shaking, lightning from
# 7+ members; at 10 a white flash + shockwave and the 10 goes "super" (white-hot, roaring aura,
# ring spinning), then it powers down and loops. Captain Planet / Super Saiyan.
JOIN0, JOIN_STEP = .25, .19                 # member i joins at JOIN0 + i*JOIN_STEP seconds
SUPER = JOIN0 + 9 * JOIN_STEP + .12         # all ten in -> transformation
DOWN0, DOWN1 = 3.1, 3.55                    # power down (super form held ~1s); loop 3.8s - all sized for the 512KB sticker cap
FLAMES = [((1 if k % 2 else -1) * random.Random(k).uniform(34, 66), random.Random(k + 99).uniform(0, 1), random.Random(k + 7).uniform(.8, 1.4))
          for k in range(22)]               # (x offset, life phase, size): on both flanks of the 10, not through it


def noise(t, k):
    # cheap deterministic jitter in [-1, 1]
    return math.sin(t * 91.7 + k * 12.9) * math.cos(t * 57.3 + k * 4.1)


def power(t):  # loop 5.0s
    joined = [seg(t, JOIN0 + i * JOIN_STEP, JOIN0 + i * JOIN_STEP + .1) for i in range(10)]
    down = seg(t, DOWN0, DOWN1)
    P = sum(joined) / 10 * (1 - down)                 # power level 0..1
    sup = seg(t, SUPER, SUPER + .25) * (1 - down)     # super form 0..1
    flash = max(0, 1 - (t - SUPER) / .3) if t >= SUPER else 0
    out = []

    # shake grows with power (and peaks in super form)
    amp = 3.2 * P ** 2 + 2.5 * sup * (.6 + .4 * abs(noise(t, 9)))
    # snapped to whole output pixels (1 unit = 320/280 px): sub-pixel shake re-rasterised the whole core every frame
    px = 280 / 320
    sx, sy = round(amp * noise(t, 1) / px) * px, round(amp * noise(t, 2) / px) * px

    # power glow behind the 10, stepping up as each member joins (steady between joins - cheap to encode)
    glow_r = 30 + 55 * P + 20 * sup
    out.append(f'<circle cx="{CX}" cy="{CY}" r="{glow_r:.1f}" fill="url(#g)" opacity="{.15 + .45 * P:.3f}" filter="url(#glow)"/>')
    if sup > 0:
        out.append(f'<circle cx="{CX}" cy="{CY}" r="82" fill="#fff" opacity="{.12 * sup:.3f}" filter="url(#glow)"/>')

    # aura flames rising around the 10 - more of them, taller and faster as power builds
    n_flames = int(len(FLAMES) * min(1, P * 1.1 + .3 * sup))
    for k in range(n_flames):
        xo, ph, sz = FLAMES[k]
        life = (t * (1.6 + 1.4 * P + sup) + ph) % 1
        x = CX + xo * (1 - .45 * life) + 3 * noise(t, k)
        y = CY + 46 - life * (70 + 60 * P + 30 * sup)
        h = (13 + 22 * P + 12 * sup) * sz * (1 - life)
        out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{h * .32:.1f}" ry="{h:.1f}" fill="url(#g)" opacity="{(1 - life) * (.35 + .5 * P):.3f}"/>')
    # (only the 10 itself shakes; glow, flames, ring and members hold steady - far smaller GIF)

    # ring: brighter with power, members slowly circling in super form
    rot = 60 * max(0, t - SUPER) * sup
    out.append(ring(.25 + .5 * P))

    # lightning between the ring and the core once 7+ members are in
    if P >= .65:
        rnd = random.Random(int(t * 10))  # new bolts every other frame
        for _ in range(1 + int(3 * sup) + (1 if P > .85 else 0)):
            i = rnd.randrange(10)
            x0, y0 = dot_xy(i, rot)
            pts = [(x0, y0)]
            for s in range(1, 6):
                f = s / 6
                px, py = x0 + (CX - x0) * f, y0 + (CY - y0) * f
                pts.append((px + rnd.uniform(-9, 9), py + rnd.uniform(-9, 9)))
            pts.append((CX + rnd.uniform(-20, 20), CY + rnd.uniform(-20, 20)))
            d = 'M' + ' L'.join(f'{px:.1f} {py:.1f}' for px, py in pts)
            out.append(f'<path d="{d}" fill="none" stroke="url(#g)" stroke-width="5" opacity=".6" filter="url(#glow)"/>'
                       f'<path d="{d}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>')

    # members: each dot ignites with a pop and fires a beam into the core
    for i in range(10):
        j = joined[i] * (1 - down)
        x, y = dot_xy(i, rot)
        t_in = t - (JOIN0 + i * JOIN_STEP)
        if 0 <= t_in < .22 and down == 0:  # beam
            b = 1 - t_in / .22
            out.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{CX}" y2="{CY}" stroke="url(#g)" stroke-width="{9 * b:.1f}" opacity="{b:.3f}" filter="url(#glow)"/>'
                       f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{CX}" y2="{CY}" stroke="#fff" stroke-width="{3 * b:.1f}" opacity="{b:.3f}"/>')
        pop = 1 + .7 * math.sin(math.pi * min(1, max(0, t_in) / .25)) if 0 <= t_in < .25 else 1
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * pop * (1 + .15 * sup):.2f}" fill="url(#g)" opacity="{.18 + .82 * j:.3f}"/>')
        if j > 0:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * .45:.2f}" fill="#fff" opacity="{.5 * j + .3 * sup:.3f}"/>')

    # the 10: kicks on every hit, grows with power, white-hot in super form
    kick = sum(.07 * max(0, 1 - (t - (JOIN0 + i * JOIN_STEP + .1)) / .2)
               for i in range(10) if t >= JOIN0 + i * JOIN_STEP + .1) if down == 0 else 0
    scale = .88 + .12 * P + .14 * sup + kick
    hot = (f'<text x="{CX}" y="{CY + 1}" text-anchor="middle" dominant-baseline="central" font-size="100" style="{NUM}" '
           f'fill="#fff" opacity="{.65 * sup:.3f}">10</text>') if sup > 0 else ''
    out.append(f'<g transform="translate({sx:.2f} {sy:.2f})">')
    out.append(number(scale, .6 + .4 * P, .6 * P + .4 * sup, hot))
    out.append('</g>')

    # transformation: white flash + expanding shockwave
    if flash > 0:
        out.append('<defs><radialGradient id="fl"><stop offset="0" stop-color="#fff" stop-opacity="1"/>'
                   '<stop offset=".55" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
                   f'<circle cx="{CX}" cy="{CY}" r="138" fill="url(#fl)" opacity="{flash:.3f}"/>')
    sw = seg(t, SUPER, SUPER + .55)
    if 0 < sw < 1:
        out.append(f'<circle cx="{CX}" cy="{CY}" r="{60 + 110 * sw:.1f}" fill="none" stroke="#fff" stroke-width="{10 * (1 - sw):.1f}" opacity="{1 - sw:.3f}"/>'
                   f'<circle cx="{CX}" cy="{CY}" r="{50 + 95 * sw:.1f}" fill="none" stroke="url(#g)" stroke-width="{16 * (1 - sw):.1f}" opacity="{.8 * (1 - sw):.3f}" filter="url(#glow)"/>')
    return ''.join(out)


# 5 (reworked). The 10 is hidden until the end: an energy core sits in the middle; one by one each
# member's orb shoots out of it to its spot on the ring, and the core swells, shakes and (from 7
# members) throws lightning; when the tenth lands the core blasts - flash + shockwave - and the 10
# is revealed, white-hot settling into the gradient. Then a calm hold, fade out, loop.
# Kept lean for the 512KB cap: things change only when something actually happens.
L0, LSTEP, FLY = .3, .17, .2                       # orb i launches at L0 + i*LSTEP, flies FLY seconds
BLAST = L0 + 9 * LSTEP + FLY + .08                 # tenth orb has landed
OUT0, OUT1 = 3.05, 3.45                            # fade out; loop 3.6s
def ease_out(x): return 1 - (1 - x) ** 3


def reveal(t):  # loop 3.6s
    landed = [seg(t, L0 + i * LSTEP + FLY - .02, L0 + i * LSTEP + FLY) for i in range(10)]
    fade = seg(t, OUT0, OUT1)
    P = sum(landed) / 10                                   # power: steady between landings
    blast = seg(t, BLAST, BLAST + .05)
    vis = 1 - fade
    out = []
    # ring outline appears as members arrive
    out.append(ring((.15 + .35 * P) * vis))
    # energy core: glow + white-hot ball, growing in a step per member; gone at the blast
    if blast < 1:
        r = 9 + 16 * P
        amp = 3.5 * P ** 2
        px = 280 / 320
        sx, sy = (round(amp * noise(t, 1) / px) * px, round(amp * noise(t, 2) / px) * px) if P > .3 else (0, 0)
        out.append(f'<circle cx="{CX}" cy="{CY}" r="{r * 2.4:.1f}" fill="url(#g)" opacity="{.25 + .4 * P:.3f}" filter="url(#glow)"/>')
        out.append(f'<g transform="translate({sx:.2f} {sy:.2f})"><circle cx="{CX}" cy="{CY}" r="{r:.1f}" fill="url(#g)"/>'
                   f'<circle cx="{CX}" cy="{CY}" r="{r * .55:.1f}" fill="#fff" opacity=".9"/></g>')
        if P >= .65:  # lightning from the core to landed members
            rnd = random.Random(int(t * 10))
            for _ in range(1 + (1 if P > .85 else 0)):
                i = rnd.randrange(10)
                x0, y0 = dot_xy(i)
                pts = [(CX, CY)] + [(CX + (x0 - CX) * s / 5 + rnd.uniform(-8, 8), CY + (y0 - CY) * s / 5 + rnd.uniform(-8, 8)) for s in range(1, 5)] + [(x0, y0)]
                out.append('<path d="M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in pts) + '" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>')
    # members: orbs fly out from the core to the ring with a short trail, then sit there
    for i in range(10):
        t0 = L0 + i * LSTEP
        if t < t0:
            continue
        p = ease_out(min(1, (t - t0) / FLY))
        for k in (3, 2, 1) if p < 1 else ():
            pk = ease_out(max(0, min(1, (t - t0 - k * .025) / FLY)))
            x, y = dot_xy(i, 0, RING_R * pk)
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * (1 - k * .2):.1f}" fill="url(#g)" opacity="{.5 - k * .12:.2f}"/>')
        x, y = dot_xy(i, 0, RING_R * p)
        land_pop = 1 + .5 * max(0, 1 - (t - t0 - FLY) / .15) if t >= t0 + FLY else 1
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * land_pop:.2f}" fill="url(#g)" opacity="{vis:.3f}"/>'
                   f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R * .45:.2f}" fill="#fff" opacity="{.7 * vis:.3f}"/>')
    # the blast: flash, shockwave, and the 10 bursting out of the core
    if t >= BLAST:
        b = t - BLAST
        if b < .3:
            out.append('<defs><radialGradient id="fl"><stop offset="0" stop-color="#fff" stop-opacity="1"/>'
                       '<stop offset=".55" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
                       f'<circle cx="{CX}" cy="{CY}" r="138" fill="url(#fl)" opacity="{1 - b / .3:.3f}"/>')
        sw = seg(b, 0, .5)
        if sw < 1:
            out.append(f'<circle cx="{CX}" cy="{CY}" r="{40 + 120 * sw:.1f}" fill="none" stroke="#fff" stroke-width="{12 * (1 - sw):.1f}" opacity="{1 - sw:.3f}"/>')
        grow = ease_out_back(seg(b, .02, .4), 2.0)
        hot = max(0, 1 - b / .6)
        halo = (f'<circle cx="{CX}" cy="{CY}" r="70" fill="url(#g)" opacity="{(.35 + .3 * hot) * vis:.3f}" filter="url(#glow)"/>')
        white = (f'<text x="{CX}" y="{CY + 1}" text-anchor="middle" dominant-baseline="central" font-size="100" style="{NUM}" '
                 f'fill="#fff" opacity="{hot:.3f}">10</text>') if hot > 0 else ''
        out.append(halo + number(max(.001, .3 + .7 * grow), vis, 0, white))
    return ''.join(out)


VARIANTS = {'v1': (roll_call, 3.2), 'v2': (orbit, 1.2), 'v3': (assemble, 3.6), 'v4': (wave, 2.0), 'v5': (reveal, 3.6)}
if ONLY:
    VARIANTS = {k: v for k, v in VARIANTS.items() if k in ONLY}

PAGE = ('<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Geist:wght@800&display=block" rel="stylesheet"/>'
        '<style>html,body{margin:0;background:transparent}</style></head><body>'
        '<svg id="s" width="640" height="640" viewBox="-12 -12 280 280" xmlns="http://www.w3.org/2000/svg"><defs>' + DEFS + '</defs><g id="c"></g></svg></body></html>')
(OUT / 'page.html').write_text(PAGE, encoding='utf-8')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 640, 'height': 640})
    pg.goto((OUT / 'page.html').resolve().as_uri(), wait_until='networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(300)
    for name, (fn, secs) in VARIANTS.items():
        fdir = OUT / f'frames_{name}'; fdir.mkdir(exist_ok=True)
        for old in fdir.glob('*.png'): old.unlink()
        n = round(secs * FPS)
        for i in range(n):
            svg = fn(i / FPS).replace('\\', '\\\\').replace('`', '\\`')
            pg.evaluate(f"document.getElementById('c').innerHTML = `{svg}`")
            pg.screenshot(path=str(OUT / 'f.png'), omit_background=True, clip={'x': 0, 'y': 0, 'width': 640, 'height': 640})
            Image.open(OUT / 'f.png').convert('RGBA').resize((320, 320), Image.LANCZOS).save(fdir / f'{i:03d}.png')
        print(name, n, 'frames')
    b.close()
