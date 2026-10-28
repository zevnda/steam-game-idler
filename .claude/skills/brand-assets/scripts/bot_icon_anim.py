"""Animated bot icon: discord-bot-icon.png's design with the rainbow rim turning once per loop and the
antennas wiggling from 100ms in (springy, out of step with each other, settling by ~1.4s). Writes
clean frames for the ffmpeg + gifsicle encode."""
import sys, pathlib, math
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1])
FPS, SECONDS = int(__import__("os").environ.get("FPS", 50)), 5  # 50fps = GIF max (20ms delays)
FRAMES = FPS * SECONDS
RES = int(__import__('os').environ.get('RES', 1024))  # frame size; renders are 1024, so 1024 = no downscale

src = (D / 'robot_circle.html').read_text(encoding='utf-8')
src = src.replace('conic-gradient(from 200deg,', 'conic-gradient(from calc(200deg + var(--a, 0deg)),')
# group each antenna's stalk + tip so it can pivot from its base
src = src.replace('<line x1="98" y1="82" x2="84" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/>',
                  '<g id="aL"><line x1="98" y1="82" x2="84" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="82" cy="45" r="12"/></g>')
src = src.replace('<line x1="158" y1="82" x2="172" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/>',
                  '<g id="aR"><line x1="158" y1="82" x2="172" y2="50" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="174" cy="45" r="12"/></g>')
src = src.replace('<circle cx="82" cy="45" r="12"/>\n', '', 1).replace('<circle cx="174" cy="45" r="12"/>\n', '', 1)
assert 'id="aL"' in src and 'id="aR"' in src and 'var(--a' in src
assert src.count('cx="82" cy="45"') == 1 and src.count('cx="174" cy="45"') == 1
page = D / 'bot_anim.html'; page.write_text(src, encoding='utf-8')


def wiggle(t_s, phase):
    # damped spring: starts 0.1s in, ~3 swings, settled by ~1.4s
    s = t_s - 0.1
    if s <= 0:
        return 0.0
    return 16 * math.sin(2 * math.pi * 2.6 * s + phase) * math.exp(-3.2 * s) * min(1, s / 0.05)


fdir = D / 'frames_bot_icon'; fdir.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1024, 'height': 1024})
    pg.goto(page.resolve().as_uri())
    for i in range(FRAMES):
        t = i / FRAMES; ts = t * SECONDS
        aL, aR = wiggle(ts, 0), wiggle(ts, math.pi * .6)  # out of step, like two springs
        pg.evaluate(f"document.documentElement.style.setProperty('--a','{360 * t}deg');"
                    f"document.getElementById('aL').setAttribute('transform','rotate({aL:.2f} 98 82)');"
                    f"document.getElementById('aR').setAttribute('transform','rotate({aR:.2f} 158 82)');")
        pg.screenshot(path=str(D / 'bf.png'), omit_background=True, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
        f = Image.open(D / 'bf.png').convert('RGBA').resize((RES, RES), Image.LANCZOS)
        flat = Image.new('RGB', f.size, (30, 31, 34)); flat.paste(f, mask=f.getchannel('A')); flat.save(fdir / f'{i:03d}.png')
    b.close()
print('frames ->', fdir)
