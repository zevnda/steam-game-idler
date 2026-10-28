"""Split-layout main OG image (and the GitHub social preview): brand pill + tagline left, the app
window right, angled toward the copy and running off the right edge."""
import sys, subprocess, pathlib
D = pathlib.Path(sys.argv[1]); PY, RENDER = sys.argv[2], sys.argv[3]
LOGO = 'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
RIM = 'from 90deg, ' + ', '.join(f'hsl({h},{{s}}%,{{l}}%)' for h in (0, 60, 120, 180, 240, 300, 360))
T = '''<!doctype html><html><head><meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=block" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: {W}px; height: {H}px; background: #000; overflow: hidden; font-family: 'Geist', sans-serif; color: #f5f5f5; -webkit-font-smoothing: antialiased; }}
  .stage {{ position: relative; width: {W}px; height: {H}px; overflow: hidden;
    background:
      radial-gradient(45% 70% at 80% 50%, rgba(120, 70, 200, .26), transparent 70%),
      radial-gradient(35% 50% at 100% 100%, rgba(220, 120, 60, .16), transparent 70%),
      radial-gradient(35% 45% at 0% 100%, rgba(60, 170, 200, .12), transparent 70%),
      #000; }}
  #stars {{ position: absolute; inset: 0; }}
  .copy {{ position: absolute; left: 64px; top: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; justify-content: center; z-index: 3; }}
  /* the docs nav's PRO pill (.rainbow-chip + .rainbow-chip--glow), as the brand */
  .chip {{ position: relative; align-self: flex-start; display: inline-flex; padding: 2px; border-radius: 999px; overflow: hidden; isolation: isolate;
    box-shadow: 0 0 28px -4px hsla(265, 60%, 60%, .55), 0 0 28px -6px hsla(160, 60%, 55%, .45); }}
  .chip::before {{ content: ''; position: absolute; inset: 0; z-index: -1; background: conic-gradient({chip_rim}); }}
  .chip__inner {{ display: inline-flex; align-items: center; gap: 14px; padding: 13px 30px 13px 24px; border-radius: 999px; background: #050505;
    font-size: 32px; font-weight: 600; letter-spacing: -.02em; }}
  .chip__inner svg {{ width: 34px; height: 34px; fill: #fff; }}
  .tag {{ margin-top: 40px; font-size: 50px; line-height: 1.14; font-weight: 400; letter-spacing: -.035em; color: #f5f5f5; }}
  .tag b {{ font-weight: 700; white-space: nowrap; padding-bottom: .1em;
    /* the blog covers' key-word gradient (.hl in blog-shared/templates/cover.html) */
    background: linear-gradient(90deg, hsl(190, 65%, 74%), hsl(250, 70%, 80%) 55%, hsl(320, 60%, 78%));
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }}
  /* the app window, angled toward the copy, off the right edge, over the site's rim glow */
  .win {{ position: absolute; left: {win_left}px; top: 50%; width: {win_w}px; aspect-ratio: 1600 / 1000; transform-origin: 0 50%;
    transform: translateY(-50%) perspective(1600px) rotateY(-16deg); z-index: 2; }}
  .win::before {{ content: ''; position: absolute; inset: -5%; z-index: -1; border-radius: 6%; background: conic-gradient({glow_rim});
    filter: blur(55px); opacity: .6; }}
  .win img {{ display: block; width: 100%; border-radius: 14px; box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.6); }}
</style></head><body><div class="stage">
  <canvas id="stars" width="{W}" height="{H}"></canvas>
  <div class="copy">
    <span class="chip"><span class="chip__inner"><svg viewBox="0 0 256 256"><path d="{logo}"/></svg>Steam Game Idler</span></span>
    <p class="tag">Farm <b>trading cards</b>,<br />manage <b>achievements</b>,<br />boost <b>playtime</b>.</p>
  </div>
  <div class="win"><img src="sgi-mock-hero.webp" /></div>
</div>
<script>
  const c = document.getElementById('stars').getContext('2d'); let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 170; i++) {{ c.fillStyle = `rgba(255,255,255,${{.15 + r() * .5}})`; c.beginPath(); c.arc(r() * {W}, r() * {H}, r() * 1.1 + .3, 0, 7); c.fill(); }}
</script></body></html>'''
# GitHub's repo header crops the social preview to ~2.65:1 (about 80px off the top and bottom of
# 1280x640), so its window is smaller to stay inside the band that always shows
for name, W, H, win_w, win_left in (('split_og', 1200, 630, 820, 640), ('split_github', 1280, 640, 660, 760)):
    html = T.format(W=W, H=H, win_w=win_w, win_left=win_left, logo=LOGO, chip_rim=RIM.format(s=36, l=50), glow_rim=RIM.format(s=55, l=58))
    (D / f'{name}.html').write_text(html, encoding='utf-8')
    subprocess.run([PY, '-I', RENDER, str(D / f'{name}.html'), str(D / f'{name}@2x.png'), '--width', str(W), '--height', str(H)], check=True, capture_output=True)
    print('rendered', name)
