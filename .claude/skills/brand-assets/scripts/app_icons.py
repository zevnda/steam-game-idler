import pathlib
import subprocess, sys, os
from PIL import Image
S = sys.argv[1]; OUT = os.path.join(S, 'gen')
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
P = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
RAINBOW = 'conic-gradient(from 200deg,' + ','.join(f'hsl({h} 60% 55%)' for h in (0,50,100,160,210,265,315,360)) + ')'
NEUTRAL = 'linear-gradient(#5a5d66,#5a5d66)'
BG = 'oklch(0.21 0.006 285.89)'
SIZES = [16, 24, 32, 48, 64, 72, 96, 128, 256, 512]

def render(rim_bg, n, path):
    rim = max(1, round(n * 14 / 512))  # A2's 14px-at-512 rim, never thinner than one full pixel
    html = f'''<html><body style="margin:0;background:transparent">
<div style="box-sizing:border-box;width:{n}px;height:{n}px;border-radius:{n*156/512}px;border:{rim}px solid transparent;
background:linear-gradient(180deg,rgb(255 255 255/.08),transparent 70%) padding-box,linear-gradient({BG},{BG}) padding-box,{rim_bg} border-box;
display:flex;align-items:center;justify-content:center">
<svg viewBox="0 0 256 256" width="{n*300/512}" height="{n*300/512}"><path fill="#fff" d="{P}"/></svg></div></body></html>'''
    h = os.path.join(OUT, 'tmp.html'); open(h, 'w').write(html)
    shot = os.path.join(OUT, 'tmp.png')
    subprocess.run([EDGE, '--headless', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
                    '--force-device-scale-factor=1', '--window-size=600,600', f'--screenshot={shot}', pathlib.Path(h).resolve().as_uri()],
                   check=True, capture_output=True)
    Image.open(shot).convert('RGBA').crop((0, 0, n, n)).save(path)

for name, rim_bg in (('app', RAINBOW), ('su', NEUTRAL)):
    for n in SIZES:
        render(rim_bg, n, os.path.join(OUT, f'{name}_{n}.png'))
print('ok')
