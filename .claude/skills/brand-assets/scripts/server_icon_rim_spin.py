"""Animated Discord server icon: discord-server-icon.png's design (29% corners) with the rainbow rim
turning one full revolution per loop. Frames are rendered at 1024px and downsampled to 512 for clean
edges, then assembled into a looping GIF."""
import sys, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1]); OUT = sys.argv[2]
FRAMES, LOOP_MS = 60, 4000  # one turn every 4s, ~15fps
src = (D / 'server-icon-squircle.html').read_text(encoding='utf-8')
# drive the rim's start angle from a CSS variable so each frame only changes that
src = src.replace('conic-gradient(from 200deg,', 'conic-gradient(from calc(200deg + var(--a, 0deg)),')
assert 'var(--a' in src
page_file = D / 'anim.html'
page_file.write_text(src, encoding='utf-8')

frames = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1024, 'height': 1024})
    pg.goto(page_file.resolve().as_uri())
    for i in range(FRAMES):
        pg.evaluate(f"document.documentElement.style.setProperty('--a', '{360 * i / FRAMES}deg')")
        png = D / 'anim_frame.png'
        pg.screenshot(path=str(png), omit_background=True, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
        frames.append(Image.open(png).convert('RGBA').resize((512, 512), Image.LANCZOS))
    b.close()

# GIF has 1-bit transparency: keep the transparent corners (Discord crops them away anyway) and
# quantize each frame to its own palette so the gradient stays smooth
out = []
for f in frames:
    alpha = f.getchannel('A')
    rgb = Image.new('RGB', f.size, (30, 31, 34)); rgb.paste(f, mask=alpha)
    q = rgb.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    q.paste(255, mask=alpha.point(lambda a: 255 if a < 128 else 0))
    q.info['transparency'] = 255
    out.append(q)
out[0].save(OUT, save_all=True, append_images=out[1:], duration=LOOP_MS // FRAMES, loop=0, disposal=2, transparency=255, optimize=False)
print('saved', OUT, len(out), 'frames')
