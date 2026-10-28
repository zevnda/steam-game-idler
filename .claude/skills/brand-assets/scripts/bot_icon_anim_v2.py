"""Animated bot icon v2: the rim turns once per 5s loop; from 100ms the robot swirls a full turn
(with a slight scale dip mid-spin) and eases back upright, then wiggles its antennas. Reads
robot_circle.html (already recoloured) from the work dir and writes clean frames."""
import sys, pathlib, math
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1])
FPS, SECONDS = int(__import__("os").environ.get("FPS", 50)), 5  # 50fps = GIF max (20ms delays)
FRAMES = FPS * SECONDS
RES = int(__import__('os').environ.get('RES', 1024))  # frame size; renders are 1024, so 1024 = no downscale

src = (D / 'robot_circle.html').read_text(encoding='utf-8')
src = src.replace('conic-gradient(from 200deg,', 'conic-gradient(from calc(200deg + var(--a, 0deg)),')
# antennas as pivotable groups (stalk + tip), as in bot_icon_anim.py
src = src.replace('<line x1="98" y1="82" x2="84" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/>',
                  '<g id="aL"><line x1="98" y1="82" x2="84" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="82" cy="45" r="12"/></g>')
src = src.replace('<line x1="158" y1="82" x2="172" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/>',
                  '<g id="aR"><line x1="158" y1="82" x2="172" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="174" cy="45" r="12"/></g>')
src = src.replace('<circle cx="82" cy="45" r="12"/>\n', '', 1).replace('<circle cx="174" cy="45" r="12"/>\n', '', 1)
# wrap the whole robot so it can swirl about the icon's centre
src = src.replace('<g fill="#fff" mask="url(#face)" transform="translate(0 10)">', '<g id="bot"><g fill="#fff" mask="url(#face)" transform="translate(0 10)">')
src = src.replace('</g></svg>', '</g></g></svg>')
assert all(x in src for x in ('id="aL"', 'id="aR"', 'id="bot"', 'var(--a'))
page = D / 'bot_anim_v2.html'; page.write_text(src, encoding='utf-8')

SPIN_START, SPIN_END = 0.10, 1.10   # seconds
WIGGLE_START = 1.15


def ease_in_out(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2


def swirl(ts):
    p = min(1, max(0, (ts - SPIN_START) / (SPIN_END - SPIN_START)))
    deg = 360 * ease_in_out(p)
    scale = 1 - 0.14 * math.sin(math.pi * p)  # dips to 0.86 mid-spin, back to 1
    return deg, scale


def wiggle(ts, phase):
    # the v1 damped spring, now starting once the swirl has settled
    s = ts - WIGGLE_START
    if s <= 0:
        return 0.0
    return 16 * math.sin(2 * math.pi * 2.6 * s + phase) * math.exp(-3.2 * s) * min(1, s / 0.05)


fdir = D / 'frames_bot_icon_v2'; fdir.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1024, 'height': 1024})
    pg.goto(page.resolve().as_uri())
    for i in range(FRAMES):
        t = i / FRAMES; ts = t * SECONDS
        deg, scale = swirl(ts)
        aL, aR = wiggle(ts, 0), wiggle(ts, math.pi * .6)
        pg.evaluate(f"document.documentElement.style.setProperty('--a','{360 * t}deg');"
                    f"document.getElementById('bot').setAttribute('transform','translate(128 128) rotate({deg:.2f}) scale({scale:.4f}) translate(-128 -128)');"
                    f"document.getElementById('aL').setAttribute('transform','rotate({aL:.2f} 98 82)');"
                    f"document.getElementById('aR').setAttribute('transform','rotate({aR:.2f} 158 82)');")
        pg.screenshot(path=str(D / 'bf2.png'), omit_background=True, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
        f = Image.open(D / 'bf2.png').convert('RGBA').resize((RES, RES), Image.LANCZOS)
        flat = Image.new('RGB', f.size, (30, 31, 34)); flat.paste(f, mask=f.getchannel('A')); flat.save(fdir / f'{i:03d}.png')
    b.close()
print('frames ->', fdir)
