"""One template for every OG image: same brand pill, headline block and visual slot positions."""
import sys, subprocess, pathlib
D = pathlib.Path(sys.argv[1])
PY, RENDER = sys.argv[2], sys.argv[3]
LOGO = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
RIM = 'from 90deg, hsl(0,{s}%,{l}%), hsl(60,{s}%,{l}%), hsl(120,{s}%,{l}%), hsl(180,{s}%,{l}%), hsl(240,{s}%,{l}%), hsl(300,{s}%,{l}%), hsl(360,{s}%,{l}%)'
TEMPLATE = '''<!doctype html><html><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=block" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 1200px; height: 630px; background: #000; overflow: hidden; font-family: 'Geist', sans-serif; color: #f5f5f5; }}
  .stage {{ position: relative; width: 1200px; height: 630px; overflow: hidden;
    background:
      radial-gradient(60% 55% at 50% 100%, rgba(120, 70, 200, .30), transparent 70%),
      radial-gradient(40% 35% at 78% 92%, rgba(220, 120, 60, .18), transparent 70%),
      radial-gradient(40% 35% at 22% 92%, rgba(60, 170, 200, .16), transparent 70%),
      #000; }}
  #stars {{ position: absolute; inset: 0; }}
  .copy {{ position: absolute; top: 34px; left: 0; right: 0; text-align: center; z-index: 3; }}
  /* the docs nav's PRO pill (.rainbow-chip + .rainbow-chip--glow), scaled up */
  .chip {{ position: relative; display: inline-flex; padding: 1.5px; border-radius: 999px; overflow: hidden; isolation: isolate;
    box-shadow: 0 0 22px -4px hsla(265, 60%, 60%, .55), 0 0 22px -6px hsla(160, 60%, 55%, .45); }}
  .chip::before {{ content: ''; position: absolute; inset: 0; z-index: -1; background: conic-gradient({chip_rim}); }}
  .chip__inner {{ display: inline-flex; align-items: center; gap: 10px; padding: 9px 22px 9px 18px; border-radius: 999px; background: #050505;
    font-size: 20px; font-weight: 600; letter-spacing: -.01em; }}
  .chip__inner svg {{ width: 22px; height: 22px; fill: #fff; }}
  h1 {{ margin-top: 42px; font-size: 66px; line-height: 1; font-weight: 600; letter-spacing: -.045em; }}
  .grad {{ background: linear-gradient(135deg, #f5f5f5 20%, #909090); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; padding-bottom: .12em; }}
  /* the visual slot: same top edge and tilt origin for every image, with the site's rim glow */
  .vis {{ position: absolute; left: 50%; top: 326px; width: {w}px; margin-left: -{hw}px; transform-origin: 50% 0;
    transform: perspective(1500px) rotateX({tilt}deg); z-index: 2; }}
  .vis::before {{ content: ''; position: absolute; inset: -4%; z-index: -1; border-radius: 6%; background: conic-gradient({glow_rim});
    filter: blur(50px); opacity: .62; }}
  .vis img {{ display: block; width: 100%; border-radius: {radius}px; box-shadow: 0 0 0 1px rgba(255,255,255,.08); }}
  .floor {{ position: absolute; left: 0; right: 0; bottom: 0; height: 90px; z-index: 4; background: linear-gradient(to bottom, transparent, rgba(0,0,0,.7)); }}
</style></head><body><div class="stage">
  <canvas id="stars" width="1200" height="630"></canvas>
  <div class="copy">
    <span class="chip"><span class="chip__inner"><svg viewBox="0 0 256 256"><path d="{logo}"/></svg>Steam Game Idler</span></span>
    <h1>{line1}<br /><span class="grad">{line2}</span></h1>
  </div>
  <div class="vis"><img src="{img}" /></div>
  <div class="floor"></div>
</div>
<script>
  const c = document.getElementById('stars').getContext('2d'); let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 170; i++) {{ c.fillStyle = `rgba(255,255,255,${{.15 + r() * .5}})`; c.beginPath(); c.arc(r() * 1200, r() * 630, r() * 1.1 + .3, 0, 7); c.fill(); }}
</script></body></html>'''

WINDOW = dict(img='sgi-mock-hero.webp', w=1000, tilt=22, radius=14)
TABLE = dict(w=770, tilt=14, radius=18)
IMAGES = {
    'main': dict(line1='Your Steam library,', line2='on autopilot.', **WINDOW),
    'asf': dict(line1='ArchiSteamFarm vs', line2='Steam Game Idler', img='table_asf.png', **TABLE),
    'im': dict(line1='Idle Master vs', line2='Steam Game Idler', img='table_im.png', **TABLE),
    'sam': dict(line1='Steam Achievement Manager vs', line2='Steam Game Idler', img='table_sam.png', **TABLE),
}
for name, v in IMAGES.items():
    html = TEMPLATE.format(logo=LOGO, hw=v['w'] // 2, chip_rim=RIM.format(s=36, l=50), glow_rim=RIM.format(s=55, l=58), **v)
    (D / f'{name}.html').write_text(html, encoding='utf-8')
    subprocess.run([PY, '-I', RENDER, str(D / f'{name}.html'), str(D / f'{name}@2x.png')], check=True, capture_output=True)
    print('rendered', name)
