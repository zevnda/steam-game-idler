"""Three extra Discord banner / invite-background variants. Same safe-padding frame as v1; the
content inside the frame changes per variant."""
import sys, subprocess, pathlib
D = pathlib.Path(sys.argv[1]); PY, RENDER = sys.argv[2], sys.argv[3]
LOGO = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
BG = 'oklch(0.21 0.006 285.89)'
RIM = 'conic-gradient(from 200deg,' + ','.join(f'hsl({h} 60% 55%)' for h in (0, 50, 100, 160, 210, 265, 315, 360)) + ')'
GLOW = 'conic-gradient(from 90deg,' + ','.join(f'hsl({h},55%,58%)' for h in (0, 60, 120, 180, 240, 300, 360)) + ')'
HL = 'linear-gradient(90deg, hsl(190, 65%, 74%), hsl(250, 70%, 80%) 55%, hsl(320, 60%, 78%))'
SVG = f'<svg viewBox="0 0 256 256"><path d="{LOGO}"/></svg>'

BASE = '''<!doctype html><html><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Geist+Mono:wght@500&display=block" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 1920px; height: 1080px; overflow: hidden; font-family: 'Geist', sans-serif; color: #f5f5f5; -webkit-font-smoothing: antialiased;
    background: linear-gradient(180deg, rgb(255 255 255 / .05), transparent 70%), {BG}; }}
  .frame {{ position: absolute; left: {pad_x}px; right: {pad_x}px; top: {pad_y}px; bottom: {pad_y}px; border-radius: {radius}px; padding: {rim}px;
    background: {RIM}; box-shadow: 0 0 70px -10px hsla(265, 60%, 60%, .5), 0 0 70px -14px hsla(160, 60%, 55%, .4); }}
  .inner {{ position: relative; width: 100%; height: 100%; border-radius: {inner_radius}px; overflow: hidden; background: #050506; isolation: isolate; }}
  canvas.stars {{ position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }}
  .hl {{ background: {HL}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; }}
  {css}
</style></head><body>
  <div class="frame"><div class="inner">
    <canvas class="stars" width="1800" height="900"></canvas>
    {html}
  </div></div>
<script>
  for (const cv of document.querySelectorAll('canvas.stars')) {{
    const c = cv.getContext('2d'); let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 220; i++) {{ c.fillStyle = `rgba(255,255,255,${{.12 + r() * .5}})`; c.beginPath(); c.arc(r() * 1800, r() * 900, r() * 1.4 + .4, 0, 7); c.fill(); }}
  }}
</script></body></html>'''

TAGLINE = 'Farm <b class="hl">trading cards</b>, manage <b class="hl">achievements</b>, boost <b class="hl">playtime</b>.'


def starfield(k, invite):
    # glows from the corners like the site hero, logo + wordmark centred; tagline only on the invite
    css = f'''
  .glows {{ position: absolute; inset: 0; z-index: 0; background:
      radial-gradient(45% 70% at 85% 110%, rgba(120,70,200,.45), transparent 70%),
      radial-gradient(40% 60% at 10% 110%, rgba(60,170,200,.32), transparent 70%),
      radial-gradient(35% 50% at 100% 0%, rgba(220,120,60,.22), transparent 70%); }}
  .c {{ position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {k*30}px; }}
  .brand {{ display: flex; align-items: center; gap: {k*34}px; }}
  .brand svg {{ width: {k*150}px; height: {k*150}px; fill: #fff; filter: drop-shadow(0 0 {k*30}px hsla(265,60%,70%,.45)); }}
  .brand span {{ font-size: {k*104}px; font-weight: 600; letter-spacing: -.04em; }}
  .tag {{ font-size: {k*40}px; color: #e8e8ec; letter-spacing: -.02em; }}
  .tag b {{ font-weight: 700; }}'''
    html = (f'<div class="glows"></div><div class="c"><div class="brand">{SVG}<span>Steam Game Idler</span></div>'
            + (f'<p class="tag">{TAGLINE}</p>' if invite else '') + '</div>')
    return css, html


def showcase(k, invite):
    # the main OG image's split layout inside the frame; the window runs off the frame's right edge
    css = f'''
  .glows {{ position: absolute; inset: 0; z-index: 0; background:
      radial-gradient(50% 80% at 85% 50%, rgba(120,70,200,.35), transparent 70%),
      radial-gradient(35% 50% at 100% 100%, rgba(220,120,60,.2), transparent 70%); }}
  .copy {{ position: absolute; left: {k*90}px; top: 0; bottom: 0; width: {k*720}px; z-index: 2; display: flex; flex-direction: column; justify-content: center; }}
  .brand {{ display: flex; align-items: center; gap: {k*22}px; font-size: {k*70}px; font-weight: 600; letter-spacing: -.04em; }}
  .brand svg {{ width: {k*80}px; height: {k*80}px; fill: #fff; }}
  .tag {{ margin-top: {k*34}px; font-size: {k*58}px; line-height: 1.12; letter-spacing: -.035em; }}
  .tag b {{ font-weight: 700; }}
  .win {{ position: absolute; left: {k*820}px; top: 50%; width: {k*1100}px; aspect-ratio: 1600/1000; transform-origin: 0 50%; z-index: 1;
    transform: translateY(-50%) perspective({k*2000}px) rotateY(-16deg); }}
  .win::before {{ content: ''; position: absolute; inset: -5%; z-index: -1; border-radius: 6%; background: {GLOW}; filter: blur({k*60}px); opacity: .55; }}
  .win img {{ display: block; width: 100%; border-radius: {k*16}px; box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.6); }}'''
    tag = 'Farm <b class="hl">trading cards</b>,<br />manage <b class="hl">achievements</b>,<br />boost <b class="hl">playtime</b>.'
    html = (f'<div class="glows"></div><div class="copy"><div class="brand">{SVG}Steam Game Idler</div><p class="tag">{tag}</p></div>'
            '<div class="win"><img src="sgi-mock-hero.webp" /></div>')
    return css, html


def spotlight(k, invite):
    # big glowing app-icon tile over a faint grid, rainbow aurora behind it, wordmark below
    css = f'''
  .grid {{ position: absolute; inset: 0; z-index: 0; background-image:
      linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
    background-size: {k*64}px {k*64}px; -webkit-mask-image: radial-gradient(ellipse 60% 70% at 50% 50%, #000, transparent 75%); }}
  .aura {{ position: absolute; left: 50%; top: 42%; width: {k*520}px; height: {k*520}px; margin: -{k*260}px 0 0 -{k*260}px; border-radius: 50%; z-index: 0;
    background: {GLOW}; filter: blur({k*90}px); opacity: .55; }}
  .c {{ position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: {k*34}px; }}
  .tile {{ width: {k*230}px; height: {k*230}px; border-radius: {k*66}px; padding: {k*5}px; background: {RIM};
    box-shadow: 0 0 {k*80}px -{k*10}px hsla(265,60%,60%,.7), 0 {k*30}px {k*60}px rgba(0,0,0,.6); }}
  .tile > div {{ width: 100%; height: 100%; border-radius: {k*61}px; display: grid; place-items: center;
    background: linear-gradient(180deg, rgb(255 255 255/.08), transparent 70%), {BG}; }}
  .tile svg {{ width: {k*140}px; height: {k*140}px; fill: #fff; }}
  .name {{ font-size: {k*84}px; font-weight: 600; letter-spacing: -.04em; }}
  .tag {{ font-family: 'Geist Mono', monospace; font-size: {k*24}px; letter-spacing: .32em; text-transform: uppercase; color: #a3a3a3; margin-top: -{k*12}px; }}'''
    html = (f'<div class="grid"></div><div class="aura"></div><div class="c"><div class="tile"><div>{SVG}</div></div><div class="name">Steam Game Idler</div>'
            + ('<div class="tag">The free Steam idler</div>' if invite else '') + '</div>')
    return css, html


def spotlight_clean(k, invite):
    # v4's layout without the aurora; the mono line reads "Steam automation tool", a bit larger,
    # and shows on the banner too
    css, _ = spotlight(k, True)
    css = css.replace(f"font-size: {k*24}px; letter-spacing: .32em;", f"font-size: {k*32}px; letter-spacing: .3em;")
    html = (f'<div class="grid"></div><div class="c"><div class="tile"><div>{SVG}</div></div><div class="name">Steam Game Idler</div>'
            '<div class="tag">Steam automation tool</div></div>')
    return css, html


def spotlight_v8(k, invite):
    # v7 with a bolder wordmark (700, from 600) and the line reading "A Steam automation tool"
    css, html = spotlight_clean(k, invite)
    css = css.replace('font-weight: 600; letter-spacing: -.04em; }', 'font-weight: 700; letter-spacing: -.04em; }')
    # the tile's glow in the rim's own rainbow (a blurred copy of it behind the tile) instead of the
    # single purple box-shadow, so each side glows the colour of the rim next to it
    css = css.replace(f'box-shadow: 0 0 {k*80}px -{k*10}px hsla(265,60%,60%,.7), ', 'position: relative; box-shadow: ')
    css += f"""
  .tile::before {{ content: ''; position: absolute; inset: -{k*10}px; z-index: -1; border-radius: {k*76}px;
    background: {RIM}; filter: blur({k*34}px); opacity: .5; }}"""
    # no grid: it showed as a faint pattern when zoomed in
    html = html.replace('Steam automation tool', 'A Steam automation tool').replace('<div class="grid"></div>', '')
    # spread the line's letters so its visible width equals the wordmark's: measure both once the
    # fonts are in, spread the difference over the gaps between letters, and cancel the trailing
    # spacing after the last letter (margin-right) so the box is exactly the visible text
    html += '''<script>
  document.fonts.ready.then(() => {
    const name = document.querySelector('.name'), tag = document.querySelector('.tag');
    tag.style.letterSpacing = '0px'; tag.style.display = 'inline-block'; tag.style.whiteSpace = 'nowrap';
    const ls = (name.getBoundingClientRect().width - tag.getBoundingClientRect().width) / (tag.textContent.length - 1);
    tag.style.letterSpacing = ls + 'px'; tag.style.marginRight = -ls + 'px';
  });
</script>'''
    return css, html


def banner_row(k, invite):
    # v8 laid out in a row (tile left, wordmark + line right) for the channel-list banner. Discord
    # shows that banner width-fitted and centre-cropped to roughly image rows 137-909, and the
    # server-name header covers the top of that, so the visible band is about rows 410-880; the
    # row is centred in it (centre ~645, i.e. 105px below the image's middle)
    css, html = spotlight_v8(k, invite)
    css += f"""
  .c {{ flex-direction: row; gap: {k*84}px; padding-top: 210px; }}
  .text {{ display: flex; flex-direction: column; align-items: flex-start; }}
  .text .tag {{ margin-top: {k*14}px; }}"""
    # wrap the wordmark + line in one left-aligned column beside the tile
    html = html.replace('<div class="name">', '<div class="text"><div class="name">')
    html = html.replace('A Steam automation tool</div>', 'A Steam automation tool</div></div>')
    return css, html


# same frame geometry as v1; the banner's content is scaled up (k) since it's shown ~1/8 size
KINDS = {
    'discord-server-banner': dict(pad_x=33, pad_y=39, radius=90, rim=12, k=1.25, invite=False),
    'discord-invite-background': dict(pad_x=60, pad_y=51, radius=72, rim=12, k=1.25, invite=True),
}
# v6: no padding at all, the frame runs to the image edges; content scaled up by the frame's growth
# over v5 (~1.1x in height, the tighter axis), so it fills the bigger frame the same way
V6 = {k: dict(g, pad_x=0, pad_y=0, k=1.375) for k, g in KINDS.items()}
# Discord shows the banner height-fitted (~17px trimmed off each side) with ~68px rounded corners,
# which cut the v6 banner's side rims and top corners; pull the frame just inside that
# ...and round the frame concentric with that clip: 8px inside it on every side, so 68 - 8 = 60px
V6['discord-server-banner'].update(pad_x=25, pad_y=8, radius=60)
V6 = {'discord-server-banner': V6['discord-server-banner']}  # only the banner changes
# v7: no rainbow frame at all (Discord crops it differently everywhere), the starfield fills the
# image edge to edge; content two 5% steps smaller than v6
V7 = {k: dict(g, pad_x=0, pad_y=0, rim=0, radius=0, k=1.375 * 0.95 * 0.95) for k, g in KINDS.items()}
for vname, fn, kinds in (('v9', banner_row, {'discord-server-banner': V7['discord-server-banner']}),
                         ('v8', spotlight_v8, {'discord-invite-background': V7['discord-invite-background']})):
    for kind, g in kinds.items():
        css, html = fn(g['k'], g['invite'])
        page = D / f'{kind}-{vname}.html'
        page.write_text(BASE.format(BG=BG, RIM=RIM, HL=HL, css=css, html=html, inner_radius=g['radius'] - g['rim'],
                                    **{x: g[x] for x in ('pad_x', 'pad_y', 'radius', 'rim')}), encoding='utf-8')
        subprocess.run([PY, '-I', RENDER, str(page), str(D / f'{kind}-{vname}.png'), '--width', '1920', '--height', '1080', '--scale', '1'],
                       check=True, capture_output=True)
        print('rendered', kind, vname)
