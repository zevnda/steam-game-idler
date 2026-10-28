"""Animated Discord server icon variants v3-v5, all built on discord-server-icon.png's design (29%
corners, rainbow rim). The rim turns one full revolution per loop in every variant, and every
variant's first frame is the static icon exactly. Frames render at 1024px, downsample to 512."""
import sys, pathlib, math
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1]); OUT_DIR = pathlib.Path(sys.argv[2])
FPS, SECONDS = 20, 5
FRAMES = FPS * SECONDS

# the logo's two pieces: the first subpath is the bottom-right piece, the second the top-left
LOGO = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
RIGHT_PIECE = LOGO[:LOGO.index('Z') + 1]
LEFT_PIECE = LOGO[LOGO.index('Z') + 1:]

PAGE = f'''<html><head><style>
  html, body {{ margin: 0; background: transparent; }}
  .tile {{ position: relative; box-sizing: border-box; width: 1024px; height: 1024px; border-radius: 297px; border: 36px solid transparent;
    background: linear-gradient(180deg, rgb(255 255 255/.08), transparent 70%) padding-box,
      linear-gradient(oklch(0.21 0.006 285.89), oklch(0.21 0.006 285.89)) padding-box,
      conic-gradient(from calc(200deg + var(--a, 0deg)), hsl(0 60% 55%), hsl(50 60% 55%), hsl(100 60% 55%), hsl(160 60% 55%), hsl(210 60% 55%), hsl(265 60% 55%), hsl(315 60% 55%), hsl(360 60% 55%)) border-box;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; /* clips to the inside of the rim, so moving pieces vanish into its edge */
    perspective: 1400px; }}
  svg {{ overflow: visible; }}
  #mark {{ transform-origin: 50% 50%; }}
  #shine {{ position: absolute; inset: -40%; pointer-events: none; opacity: 0;
    background: linear-gradient(115deg, transparent 42%, rgb(255 255 255 / .22) 50%, transparent 58%); }}
</style></head><body>
  <div class="tile">
    <svg id="mark" viewBox="0 0 256 256" width="580" height="580">
      <path id="left" fill="#fff" d="{LEFT_PIECE}" />
      <path id="right" fill="#fff" d="{RIGHT_PIECE}" />
    </svg>
    <div id="shine"></div>
  </div>
</body></html>'''

# the gap between the pieces runs at ~30 degrees (up-right), so they slide out along it
DIR = (math.cos(math.radians(30)), -math.sin(math.radians(30)))
OFF = 330  # viewBox units: far enough that each piece fully clears the tile


def ease_in_cubic(x): return x ** 3
def ease_out_back(x, s=1.4): x -= 1; return x * x * ((s + 1) * x + s) + 1
def ease_in_out(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def seg(t, a, b): return min(1, max(0, (t - a) / (b - a)))


def split(t):
    # hold, slide apart (accelerating), empty beat, slide back and settle, hold
    # split starts 0.1s in: the timeline below is written for a 0.25s start, shifted 0.15s earlier
    t = t + .03
    if t < .05: d = 0
    elif t < .19: d = ease_in_cubic(seg(t, .05, .19))
    elif t < .35: d = 1
    # ease out with no overshoot: overshooting slid the pieces past each other into a wrong shape
    elif t < .53: d = 1 - (1 - (1 - seg(t, .35, .53)) ** 4)
    else: d = 0
    dx, dy = DIR[0] * OFF * d, DIR[1] * OFF * d
    return (f"document.getElementById('left').setAttribute('transform','translate({-dx:.2f} {-dy:.2f})');"
            f"document.getElementById('right').setAttribute('transform','translate({dx:.2f} {dy:.2f})');")


def shine(t):
    # one glossy sweep, top-left to bottom-right, early in the loop
    p = seg(t, .25, .55)
    x = -60 + 120 * ease_in_out(p)
    op = 1 if 0 < p < 1 else 0
    return f"const s=document.getElementById('shine'); s.style.opacity={op}; s.style.transform='translate({x:.2f}%, {x * .6:.2f}%)';"


def flip(t):
    # a single 3D coin-flip of the mark, with a soft settle
    p = seg(t, .25, .65)
    deg = 360 * ease_in_out(p)
    return f"document.getElementById('mark').style.transform='rotateY({deg:.2f}deg)';"


VARIANTS = {'v3': split}

(D / 'anim2.html').write_text(PAGE, encoding='utf-8')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1024, 'height': 1024})
    pg.goto((D / 'anim2.html').resolve().as_uri())
    for name, fn in VARIANTS.items():
        pg.reload()
        frames = []
        for i in range(FRAMES):
            t = i / FRAMES
            pg.evaluate(f"document.documentElement.style.setProperty('--a','{360 * t}deg');" + fn(t))
            png = D / 'anim2_frame.png'
            pg.screenshot(path=str(png), omit_background=True, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
            frames.append(Image.open(png).convert('RGBA').resize((512, 512), Image.LANCZOS))
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
        # contact sheet for review
        picks = [0, int(FRAMES * .05), int(FRAMES * .10), int(FRAMES * .15), int(FRAMES * .25), int(FRAMES * .40), int(FRAMES * .47), int(FRAMES * .55)]
        sheet = Image.new('RGB', (len(picks) * 200, 200), (30, 31, 34))
        for j, fi in enumerate(picks):
            fr = frames[fi].resize((196, 196), Image.LANCZOS); sheet.paste(fr, (j * 200 + 2, 2), fr)
        sheet.save(D / f'sheet_{name}.png')
        print('saved', path)
    b.close()
