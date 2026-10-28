"""Animated Discord server icon variants v4-v6 (conveyor, glitch, draw-on). Same base as v3: the
29% rainbow-rim icon, rim turning once per 5s loop, first frame = the static icon, motion starting
0.25s in. Frames render at 1024px and downsample to 512."""
import sys, pathlib, math, random
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1]); OUT_DIR = pathlib.Path(sys.argv[2])
ONLY = sys.argv[3:]  # optional: render just these variants
FPS, SECONDS = int(__import__("os").environ.get("FPS", 20)), 5  # GIF max reliable fps is 50 (20ms delays)
FRAMES = FPS * SECONDS

LOGO = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
RIGHT = LOGO[:LOGO.index('Z') + 1]
LEFT = LOGO[LOGO.index('Z') + 1:]
STOPS = ''.join(f'<stop offset="{i / 6:.3f}" stop-color="hsl({h} 60% 62%)"/>' for i, h in enumerate((100, 160, 210, 265, 315, 0, 50)))

PAGE = f'''<html><head><style>
  html, body {{ margin: 0; background: transparent; }}
  .tile {{ position: relative; box-sizing: border-box; width: 1024px; height: 1024px; border-radius: 297px; border: 36px solid transparent;
    background: linear-gradient(180deg, rgb(255 255 255/.08), transparent 70%) padding-box,
      linear-gradient(oklch(0.21 0.006 285.89), oklch(0.21 0.006 285.89)) padding-box,
      conic-gradient(from calc(200deg + var(--a, 0deg)), hsl(0 60% 55%), hsl(50 60% 55%), hsl(100 60% 55%), hsl(160 60% 55%), hsl(210 60% 55%), hsl(265 60% 55%), hsl(315 60% 55%), hsl(360 60% 55%)) border-box;
    overflow: hidden; }}
  svg.layer {{ position: absolute; left: 186px; top: 186px; width: 580px; height: 580px; overflow: visible; }}
</style></head><body>
  <div class="tile">
    <!-- glitch channels, under the white mark -->
    <svg class="layer" id="gr" viewBox="0 0 256 256" style="opacity:0;mix-blend-mode:screen"><path fill="hsl(350 90% 60%)" d="{LOGO}"/></svg>
    <svg class="layer" id="gc" viewBox="0 0 256 256" style="opacity:0;mix-blend-mode:screen"><path fill="hsl(185 90% 55%)" d="{LOGO}"/></svg>
    <!-- the white mark as two pieces, each with a wrap-around twin for the conveyor -->
    <svg class="layer" id="mark" viewBox="0 0 256 256">
      <path id="L" fill="#fff" d="{LEFT}"/><path id="L2" fill="#fff" d="{LEFT}" transform="translate(9999 9999)"/>
      <path id="R" fill="#fff" d="{RIGHT}"/><path id="R2" fill="#fff" d="{RIGHT}" transform="translate(9999 9999)"/>
    </svg>
    <!-- glitch slices: copies of the mark cut to a horizontal band and shoved sideways -->
    <svg class="layer" id="s1" viewBox="0 0 256 256" style="opacity:0"><path fill="#fff" d="{LOGO}"/></svg>
    <svg class="layer" id="s2" viewBox="0 0 256 256" style="opacity:0"><path fill="#fff" d="{LOGO}"/></svg>
    <!-- draw-on outline in the rim's rainbow -->
    <svg class="layer" id="ol" viewBox="0 0 256 256" style="opacity:0">
      <defs><linearGradient id="rb" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="236" y2="236">{STOPS}</linearGradient></defs>
      <path id="o1" d="{LEFT}" pathLength="1" fill="none" stroke="url(#rb)" stroke-width="4.5" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1"/>
      <path id="o2" d="{RIGHT}" pathLength="1" fill="none" stroke="url(#rb)" stroke-width="4.5" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1"/>
    </svg>
  </div>
</body></html>'''

DIR = (math.cos(math.radians(30)), -math.sin(math.radians(30)))  # along the gap, up-right
def seg(t, a, b): return min(1, max(0, (t - a) / (b - a)))
def ease_in_out(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def ease_out(x): return 1 - (1 - x) ** 4
def tr(i, dx, dy): return f"document.getElementById('{i}').setAttribute('transform','translate({dx:.2f} {dy:.2f})');"
def css(i, prop, val): return f"document.getElementById('{i}').style.{prop}='{val}';"


def conveyor(t):
    # each piece travels a full wrap period along the gap (right piece up-right, left piece
    # down-left); its twin trails one period behind, so as one exits an edge the twin enters from
    # the opposite edge and lands exactly in place
    # The twins arrive from the side where the interlocking pieces overlap, so on their own they'd
    # merge into a solid shape for the whole slow final approach. The pieces first step apart
    # sideways (perpendicular to the gap) onto separate lanes, travel, then click back together.
    # W is long enough that around the halfway point both pieces and both twins are fully off the
    # tile for ~150ms (at 660 they only grazed its edges for an instant)
    W = 780
    t = t + .03  # starts 100ms in, like the others (timeline shifted 0.15s earlier)
    # plus a 100ms (t .02) freeze at the halfway point, where everything is already off-screen, for
    # ~250ms empty in total; the freeze happens off-tile, so the visible motion never stutters
    if .27 <= t < .29: t = .27
    elif t >= .29: t -= .02
    d = W * ease_in_out(seg(t, .09, .45))
    s = 34 * (ease_out(seg(t, .05, .11)) - ease_in_out(seg(t, .45, .53)))
    nx, ny = math.sin(math.radians(30)), math.cos(math.radians(30))  # perpendicular, toward the right piece
    x, y = DIR[0] * d, DIR[1] * d
    wx, wy = DIR[0] * W, DIR[1] * W
    px, py = nx * s, ny * s
    return (tr('R', x + px, y + py) + tr('R2', x - wx + px, y - wy + py)
            + tr('L', -x - px, -y - py) + tr('L2', -x + wx - px, -y + wy - py))


GLITCH_RNG = random.Random(7)
GLITCH = {}
for i in range(FRAMES):
    t = i / FRAMES
    # two bursts: a longer one early, a short aftershock
    # starts 100ms in (t .02), like the others
    on = .02 <= t < .16 or .24 <= t < .28
    if on:
        g = GLITCH_RNG
        GLITCH[i] = dict(rx=g.uniform(-14, 14), cx=g.uniform(-14, 14), jx=g.uniform(-6, 6),
                         s1=(g.uniform(10, 60), g.uniform(4, 14), g.uniform(-40, 40)),
                         s2=(g.uniform(45, 90), g.uniform(3, 10), g.uniform(-40, 40)))


def glitch(t):
    i = round(t * FRAMES)
    g = GLITCH.get(i)
    if not g:
        return (css('gr', 'opacity', '0') + css('gc', 'opacity', '0') + css('s1', 'opacity', '0') + css('s2', 'opacity', '0')
                + css('mark', 'transform', 'none'))
    out = (css('gr', 'opacity', '1') + css('gr', 'transform', f"translateX({g['rx']:.1f}px)")
           + css('gc', 'opacity', '1') + css('gc', 'transform', f"translateX({g['cx']:.1f}px)")
           + css('mark', 'transform', f"translateX({g['jx']:.1f}px)"))
    for sid in ('s1', 's2'):
        top, h, dx = g[sid]
        out += (css(sid, 'opacity', '1') + css(sid, 'clipPath', f'inset({top:.1f}% 0 {max(0, 100 - top - h):.1f}% 0)')
                + css(sid, 'transform', f'translateX({dx:.1f}px)'))
    return out


def draw_on(t):
    # mark fades out, outline traces in, fill returns with a brief glow, outline fades.
    # Starts 100ms in: the whole timeline is shifted 0.15s (t .03) earlier than the other variants.
    t = t + .03
    fade_out = seg(t, .05, .09)
    draw = ease_in_out(seg(t, .08, .42))
    fill_in = ease_out(seg(t, .42, .50))
    glow = max(0, 1 - abs(t - .48) / .06)
    outline_op = 1 if t < .48 else 1 - seg(t, .48, .58)
    mark_op = 1 - fade_out if t < .42 else fill_in
    return (css('mark', 'opacity', f'{mark_op:.3f}')
            + css('mark', 'filter', f'drop-shadow(0 0 {12 * glow:.1f}px rgba(255,255,255,{.9 * glow:.2f}))')
            + css('ol', 'opacity', f'{outline_op if t >= .08 else 0:.3f}')
            + f"document.getElementById('o1').setAttribute('stroke-dashoffset','{1 - draw:.4f}');"
            + f"document.getElementById('o2').setAttribute('stroke-dashoffset','{1 - draw:.4f}');")


VARIANTS = {'v4': (conveyor, [.0, .1, .17, .22, .24, .27, .33, .40, .5]),
            'v5': (glitch, [.0, .06, .09, .12, .16, .28, .35]),
            'v6': (draw_on, [.0, .08, .16, .26, .36, .44, .48, .6])}
if ONLY:
    VARIANTS = {k: v for k, v in VARIANTS.items() if k in ONLY}

(D / 'anim3.html').write_text(PAGE, encoding='utf-8')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1024, 'height': 1024})
    for name, (fn, pick_ts) in VARIANTS.items():
        pg.goto((D / 'anim3.html').resolve().as_uri())
        frames = []
        for i in range(FRAMES):
            t = i / FRAMES
            pg.evaluate(f"document.documentElement.style.setProperty('--a','{360 * t}deg');" + fn(t))
            png = D / 'anim3_frame.png'
            pg.screenshot(path=str(png), omit_background=True, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
            frames.append(Image.open(png).convert('RGBA').resize((512, 512), Image.LANCZOS))
        # keep the clean (undithered) frames too, for building small GIFs with ffmpeg/gifsicle
        fdir = D / f'frames_{name}'; fdir.mkdir(exist_ok=True)
        for i, f in enumerate(frames):
            flat = Image.new('RGB', f.size, (30, 31, 34)); flat.paste(f, mask=f.getchannel('A')); flat.save(fdir / f'{i:03d}.png')
        out = []
        for f in frames:
            alpha = f.getchannel('A')
            rgb = Image.new('RGB', f.size, (30, 31, 34)); rgb.paste(f, mask=alpha)
            q = rgb.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
            q.paste(255, mask=alpha.point(lambda a: 255 if a < 128 else 0))
            q.info['transparency'] = 255
            out.append(q)
        path = OUT_DIR / f'discord-server-icon-{name}.gif'
        out[0].save(path, save_all=True, append_images=out[1:], duration=1000 // FPS, loop=0, disposal=2, transparency=255)
        sheet = Image.new('RGB', (len(pick_ts) * 200, 200), (30, 31, 34))
        for j, pt in enumerate(pick_ts):
            fr = frames[min(FRAMES - 1, round(pt * FRAMES))].resize((196, 196), Image.LANCZOS); sheet.paste(fr, (j * 200 + 2, 2), fr)
        sheet.save(D / f'sheet_{name}.png')
        print('saved', path)
    b.close()
