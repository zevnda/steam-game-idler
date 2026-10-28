"""'The Original 10' role icons, round 3 (v6-v8): meaning-led, no awards. Orbit (ten dots around the
SGI mark), founder's key, seedling. 256x256 transparent PNG, role gradient #39ff14 -> #1c95ff."""
import sys, pathlib, math
from playwright.sync_api import sync_playwright
from PIL import Image

D = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
A, B = '#00f0ff', '#b100ff'  # role colour updated from #39ff14 -> #1c95ff
GRAD = f'<linearGradient id="gs" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="256" y2="256"><stop offset="0" stop-color="{A}"/><stop offset="1" stop-color="{B}"/></linearGradient>'
NUM = "font-family:'Geist',sans-serif;font-weight:800;letter-spacing:-5px"
DARK = '#0b1410'
LOGO = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'

# v6 orbit: SGI mark in the gradient at the centre, a thin orbit ring, ten dots evenly around it
dots = ''.join(f'<circle cx="{128 + 106 * math.cos(math.radians(-90 + i * 36)):.1f}" cy="{128 + 106 * math.sin(math.radians(-90 + i * 36)):.1f}" r="15" fill="url(#gs)"/>'
               for i in range(10))
orbit = (f'<circle cx="128" cy="128" r="106" fill="none" stroke="url(#gs)" stroke-width="5" stroke-opacity=".45"/>'
         + dots +
         f'<text x="128" y="129" text-anchor="middle" dominant-baseline="central" fill="url(#gs)" font-size="104" style="{NUM}">10</text>')

# v7 founder's key: round bow with a dark "10" window, shaft, two bits; set on the diagonal
key = (f'<g transform="rotate(-45 128 128)">'
       f'<circle cx="74" cy="128" r="62" fill="url(#gs)"/>'
       f'<circle cx="74" cy="128" r="44" fill="{DARK}" fill-opacity=".88"/>'
       f'<rect x="128" y="114" width="118" height="28" rx="10" fill="url(#gs)"/>'
       f'<rect x="200" y="138" width="20" height="34" rx="5" fill="url(#gs)"/>'
       f'<rect x="170" y="138" width="18" height="24" rx="5" fill="url(#gs)"/>'
       f'<text x="74" y="129" text-anchor="middle" dominant-baseline="central" fill="url(#gs)" font-size="58" style="{NUM}" transform="rotate(45 74 128)">10</text>'
       f'</g>')

# v8 seedling: stem rising from a ring (the year come full circle), two leaves, a new bud
seed = (f'<circle cx="128" cy="128" r="112" fill="none" stroke="url(#gs)" stroke-width="12"/>'
        f'<path d="M128 214 C128 170 128 140 128 104" fill="none" stroke="url(#gs)" stroke-width="13" stroke-linecap="round"/>'
        f'<path d="M126 150 C 86 156 54 134 50 92 C 94 86 124 110 126 150 Z" fill="url(#gs)"/>'
        f'<path d="M130 124 C 168 128 200 104 204 62 C 160 56 132 82 130 124 Z" fill="url(#gs)"/>'
        f'<path d="M128 106 C 112 92 112 70 128 52 C 144 70 144 92 128 106 Z" fill="url(#gs)"/>'
        f'<path d="M84 214 Q128 196 172 214" fill="none" stroke="url(#gs)" stroke-width="12" stroke-linecap="round"/>')

ICONS = {6: ('orbit', orbit)}  # v7 key / v8 seedling unchanged; add them back to re-render
PAGE = '''<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Geist:wght@800&display=block" rel="stylesheet"/>
<style>html,body{{margin:0;background:transparent}}</style></head><body>
<svg width="1024" height="1024" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs>{grad}</defs>{body}</svg></body></html>'''
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1024, 'height': 1024})
    for n, (name, body) in ICONS.items():
        html = D / f'role3_{name}.html'
        html.write_text(PAGE.format(grad=GRAD, body=body), encoding='utf-8')
        pg.goto(html.resolve().as_uri(), wait_until='networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(200)
        pg.screenshot(path=str(D / 'r.png'), omit_background=True, clip={'x': 0, 'y': 0, 'width': 1024, 'height': 1024})
        out = OUT / f'discord-role-original-10-v{n}.png'
        Image.open(D / 'r.png').convert('RGBA').resize((256, 256), Image.LANCZOS).save(out, optimize=True)
        print(out.name, name)
    b.close()
