"""Animated bot profile banner, 960x540: one rainbow line across the visible strip with a half-circle
hump near its left end, colours flowing along it in a seamless loop."""
import sys, pathlib, math
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1])
W, H = 960, 540
FPS, SECONDS = int(__import__("os").environ.get("FPS", 50)), 3  # 50fps = GIF max (20ms delays)
FRAMES = FPS * SECONDS

# Discord shows profile banners as a ~17:6 strip: about the middle 960x340 of this image (y 100-440)
BAND_TOP, BAND_H = 100, 340
BASE_Y = BAND_TOP + .37 * BAND_H       # the line's height, from the sketch (~37% down the strip)
# the half circle's radius: v1 used 82, which matches the avatar slot's radius; v2 is 15% bigger
R = float(sys.argv[2]) if len(sys.argv) > 2 else 82
CX = 142                               # centre, lined up over the avatar slot (fixed as R changes)
F = 10                                 # tiny fillets where the circle meets the line

# A true half circle (one radius) on the line, joined by two fillet arcs tangent to both the line and
# the circle, so only the two right-angle corners round off and the hump itself stays a perfect
# half circle. Fillet centre: F above the line, R + F from the circle's centre.
y = BASE_Y
d = math.sqrt((R + F) ** 2 - F ** 2)            # horizontal offset of each fillet's centre
tx, ty = d * R / (R + F), -F * R / (R + F)      # fillet/circle touch point, relative to the centre
path = (f'M -20 {y:.2f} L {CX - d:.2f} {y:.2f} '
        f'A {F} {F} 0 0 0 {CX - tx:.2f} {y + ty:.2f} '
        f'A {R} {R} 0 0 1 {CX + tx:.2f} {y + ty:.2f} '
        f'A {F} {F} 0 0 0 {CX + d:.2f} {y:.2f} '
        f'L {W + 20} {y:.2f}')

if len(sys.argv) > 3 and sys.argv[3] == 'ecg':
    # heartbeat (ECG) trace instead of the hump, on the right side of the line (spike at x ~700,
    # clear of the profile's "..." button over the far right): flat, P wave, Q dip, tall R spike,
    # deep S drop, recovery, T wave, flat. All straight segments - a monitor trace is sharp, not
    # rounded. Offsets are (dx, dy) steps from the previous point; negative dy is up.
    x0 = 700 - 66
    seq = [('L', 0, 0), ('L', 10, -14), ('L', 10, 14),     # P wave: small sharp peak
           ('L', 12, 0), ('L', 7, 12),                     # Q dip
           ('L', 11, -104),                                # R spike
           ('L', 13, 136),                                 # S drop
           ('L', 10, -44),                                 # back to the baseline
           ('L', 16, 0), ('L', 18, -26), ('L', 18, 26)]    # T wave: wider sharp peak
    pts, cx, cy = [f'M -20 {y:.2f} L {x0:.2f} {y:.2f}'], x0, y
    for s in seq[1:]:
        if s[0] == 'L':
            cx += s[1]; cy += s[2]; pts.append(f'L {cx:.2f} {cy:.2f}')
        else:
            qx, qy = cx + s[1], cy + s[2]; cx += s[3]; cy += s[4]; pts.append(f'Q {qx:.2f} {qy:.2f} {cx:.2f} {cy:.2f}')
    pts.append(f'L {W + 20} {y:.2f}')
    path = ' '.join(pts)

PERIOD = W  # one full rainbow per image width; it moves one period per loop, so the loop is seamless
stops = ''.join(f'<stop offset="{i / 12:.4f}" stop-color="hsl({(i * 30) % 360} 60% 58%)"/>' for i in range(13))
PAGE = f'''<html><head><style>html,body{{margin:0;background:oklch(0.21 0.006 285.89);}}</style></head><body>
<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{PERIOD}" y2="0" spreadMethod="repeat">{stops}</linearGradient>
    <filter id="glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <path d="{path}" fill="none" stroke="url(#rb)" stroke-width="10" stroke-linecap="round" opacity=".55" filter="url(#glow)"/>
  <path d="{path}" fill="none" stroke="url(#rb)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg></body></html>'''
(D / 'bot_banner.html').write_text(PAGE, encoding='utf-8')

fdir = D / 'frames_bot_banner'; fdir.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
    pg.goto((D / 'bot_banner.html').resolve().as_uri())
    for i in range(FRAMES):
        shift = PERIOD * i / FRAMES  # colours flow left to right
        pg.evaluate(f"document.getElementById('rb').setAttribute('gradientTransform','translate({shift:.2f} 0)')")
        pg.screenshot(path=str(D / 'bb.png'), clip={'x': 0, 'y': 0, 'width': W, 'height': H})
        Image.open(D / 'bb.png').convert('RGB').resize((W, H), Image.LANCZOS).save(fdir / f'{i:03d}.png')
    b.close()
print('frames ->', fdir)
