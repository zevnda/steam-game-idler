---
name: brand-assets
description: >
  Create or edit Steam Game Idler brand assets: the logo mark, app/exe/tray/installer icons,
  SteamUtility icon, favicons, README logo, website OG/social images, GitHub social preview and org
  avatar, Discord server icon (static + animated GIF), server banner, invite background, bot avatar
  (static + animated) and bot profile banner. Knows the brand tokens, every platform's measured crop
  shape, the render pipeline (HTML -> Playwright/Edge -> PNG/ICO/GIF), the small-GIF pipeline
  (ffmpeg + gifsicle) and where every file lives. Use for "make a new icon/banner/logo/avatar",
  "update the OG image", "animate the icon", "make it smaller/under X KB", or any edit to these.
---

# Brand assets

Everything here was built and iterated with the user in one long session (2026-10). Follow these
recipes exactly; the numbers below came from measuring real screenshots, not guesses.

## How the user likes to work (read first)

- **Never replace a version the user hasn't rejected.** New attempts get a new suffix (`-v2`,
  `-v3`...). Overwrite in place only when the user asks for a tweak to "this one". They delete what
  they don't like and rename finals themselves (finals currently drop the version suffix).
- **Look at every render before reporting** (Read the PNG / a contact sheet of GIF frames). Check at
  real display size *and* zoomed. Build a simulation of the platform's crop when one is involved.
- **Measure, don't guess.** When the user sends a screenshot of a platform showing an asset wrong,
  measure the crop/radius/offset from the screenshot's pixels (see "Measuring a crop" below).
- Save finished assets to `public/` (repo root) unless told otherwise; `public/` ships inside the
  desktop app build, so mention size cost for big files. Work files go in the session scratchpad.
- Report exact numbers (px, KB, frame counts, timings) and give preview/contact-sheet links.
- Never commit (project rule).

## Brand tokens

- **Logo mark** (256 viewBox, two pieces; first subpath = bottom-right piece, second = top-left):
  `M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z`
  - Visible extent ~x 27-229, y 18-238 -> tight square crop `viewBox="18 18 220 220"` (favicons).
  - The gap between the pieces runs at 30 degrees up-right; pieces "slide" along
    `(cos30, -sin30)` / its negative. Perpendicular (lane) direction `(sin30, cos30)`.
  - Same path lives in `src/shared/components/dashboard/Logo.tsx`,
    `docs/app/(marketing)/_components/Logo.tsx` and `mockApp.ts` `LOGO_PATH` - keep in step.
- **Tile (icon) background:** `oklch(0.21 0.006 285.89)` + top sheen
  `linear-gradient(180deg, rgb(255 255 255/.08), transparent 70%)`. Mark is white `#fff`.
- **Rainbow rim (icons, "A2" choice):** `conic-gradient(from 200deg, hsl(0 60% 55%), hsl(50 60% 55%),
  hsl(100 60% 55%), hsl(160 60% 55%), hsl(210 60% 55%), hsl(265 60% 55%), hsl(315 60% 55%), hsl(360 60% 55%))`
  - App icon rim: 14px at 512 (2.7%), never below 1 full pixel at small sizes.
  - Discord icons: 36px at 1024 (thicker so it reads at 48px).
- **Site's muted rainbow** (nav PRO pill / CTA rim, docs `.rainbow-chip`): same hues at `36% 50%`,
  `from 90deg`. Brighter glow variant for blurred halos: `55% 58%`.
- **Key-word gradient** (blog cover `.hl`, OG tagline bold words):
  `linear-gradient(90deg, hsl(190 65% 74%), hsl(250 70% 80%) 55%, hsl(320 60% 78%))`, background-clip text.
- **Site look:** black `#000`/`#050506`, deterministic canvas starfield (seeded LCG, ~150-220 dots,
  alpha .12-.6), soft radial glows (purple `rgba(120,70,200,.3)`, cyan `rgba(60,170,200,.15)`,
  orange `rgba(220,120,60,.18)`), Geist (600/700) + Geist Mono for eyebrows (uppercase, tracked .3em).
- Glow behind a rimmed tile = a blurred copy of the rim's own conic gradient (`::before`, blur ~34px,
  opacity .5), not a single-colour box-shadow (user rejected "all purple").

## Tools

- `PY=~/.claude/plugins/marketplaces/AgriciDaniel-claude-seo/.venv/Scripts/python.exe` - has
  Playwright + Chromium. Always `"$PY" -I script.py ...`.
- `.claude/skills/blog-shared/scripts/render_html.py page.html out.png --width W --height H [--scale 2]`
  - waits for Google Fonts; default 2x then downscale with Pillow LANCZOS.
- Headless Edge also works for one-offs: `msedge --headless --default-background-color=00000000
  --window-size=W,H --screenshot=out.png file:///page.html` (transparent background).
- `ffmpeg` (installed), `gifsicle` (installed via `scoop install gifsicle`), Pillow (system python).
- Docs dev server is usually on `http://localhost:3001` (app on 3000).

## Scripts (`scripts/`) and sources (`sources/`)

Copy the needed `sources/*.html` (and `docs/public/landing/sgi-mock-hero.webp` where noted) into a
fresh scratchpad work dir, then run the script with that dir. Every script is parameterised by its
constants at the top - edit there.

| Script | Makes | Run |
|---|---|---|
| `app_icons.py` | per-size app (rainbow rim) + SteamUtility (grey `#5a5d66` rim) tile renders 16-512 via Edge | `python app_icons.py <work>` -> `<work>/gen/app_*.png`, `su_*.png`; then build files (below) |
| `server_icon_rim_spin.py` | animated server icon, rim spin only | needs `sources/server-icon-squircle.html` in work dir |
| `server_icon_split.py` | "split" GIF (pieces slide apart along the gap, return) | `"$PY" -I server_icon_split.py <work> <outdir>` |
| `server_icon_anims.py` | v4 conveyor (current `discord-server-icon.gif`), v5 glitch, v6 draw-on; also dumps clean frames to `<work>/frames_<v>/` | `... <work> <outdir> v4` |
| `bot_icon_anim.py` | bot avatar GIF (rim spin + antenna wiggle at 100ms); dumps `frames_bot_icon/` | needs `sources/robot_circle.html` |
| `bot_banner.py` | bot profile banner 960x540: flowing-rainbow line; arg2 = hump radius, arg3 `ecg` = heartbeat (current) | `"$PY" -I bot_banner.py <work> 82 ecg` -> `frames_bot_banner/` |
| `og_split.py` | main OG 1200x630 + GitHub social preview 1280x640 (split layout) | needs `sgi-mock-hero.webp` in work dir |
| `og_centered.py` | /alternatives OG images (centred headline + comparison table) | needs `table_*.png` from `og_table_capture.py` (docs dev server) |
| `og_table_capture.py` | captures the real `.cmp` table from each /alternatives page, trimmed to 6 rows | needs docs dev server on :3001 |
| `discord_backgrounds.py` | server banner (v9 row layout, current) + invite background (v8, current) 1920x1080 | `"$PY" -I discord_backgrounds.py <work> "$PY" <render_html.py>` |
| `hero_snapshot.ps1` | re-snapshots the docs hero placeholder `sgi-mock-hero*.webp` via the dev hook `__sgiMockSnapshot` | see "Website hero" below |

`server_icon_anims.py` / `bot_icon_anim.py` / `bot_banner.py` write clean undithered frames; the
GIF is then built with the small-GIF pipeline below (not Pillow's quantizer).

## Asset inventory (current finals)

| Asset | File | Spec |
|---|---|---|
| App/exe/taskbar/installer/window/tray icon | `src-tauri/icons/{32x32,128x128,128x128@2x,icon}.png`, `icon.ico` | dark tile, rainbow rim (A2), 30% corners (156/512), mark 300/512 wide; ICO frames 16,24,32,48,64,256 |
| SteamUtility exe icon | `libs/SteamUtility/icon.ico` | same tile, grey rim; ICO frames 16,24,32,48,64,72,96,128,256 |
| Titlebar/in-app logo | `src/shared/components/dashboard/Logo.tsx` | inline SVG, `fill-current` |
| Sign-in screen logo | `src/shared/components/AuthLayout.tsx` + `.auth-logo` in `src/styles/globals.css` | rounded tile, rotating rainbow rim + glow |
| Website logo | `docs/app/(marketing)/_components/Logo.tsx` | inline SVG, white |
| Favicons | `docs/app/icon.svg` (cropped viewBox, light/dark media query), `docs/app/favicon.ico`, `public/favicon.ico` | ICO: white mark on transparent, 16-256 |
| JSON-LD / RSS logo | `docs/public/logo.png` | 128px white mark on transparent (user wants the raw mark, NOT the tile) |
| README logo | `src-tauri/icons/icon.png` referenced directly | |
| Main OG / GitHub social | `docs/public/og-image.png`, `public/github-social-preview.png` | split layout (see below) |
| /alternatives OG | `docs/public/{asf,im,sam}-og-image.png` | centred headline + real comparison table |
| Blog covers | `docs/public/blog/*/cover.webp` | template `.claude/skills/blog-shared/templates/cover.html` |
| Discord server icon | `public/discord-server-icon.png` (29% corners), `public/discord-server-icon.gif` (v4 conveyor) | |
| Discord server banner / invite bg | `public/discord-server-banner.png` (v9), `public/discord-invite-background.png` (v8) | |
| Discord bot avatar | `public/discord-bot-icon.png` (circle), `public/discord-bot-icon.gif` (antenna wiggle) | |
| Discord bot profile banner | `public/discord-bot-banner.gif` | ECG heartbeat line |
| GitHub org avatar | `public/github-org-avatar.png` | 3.6% corners |
| Discord stickers "The Original 10" | `public/discord-sticker-original-10-v1..v5.gif` (v5 = favourite concept: orbs shoot out of a charging core one per member, lightning from 7, blast reveals the "10" - the number stays hidden until the blast; user wants "epic power-up" ideas, not generic loops) **GIF alpha gotcha: GIF transparency is 1-bit, so anything semi-transparent (dim dots, faint ring, glows, trails) vanishes on encode - matte every frame onto Discord's dark chat colour `#313338` (49,51,56) and keep alpha>=10 as solid before encoding.** The 512KB cap is real (Discord's "auto-resize" note doesn't lift it); cost drivers are things that change every frame (whole-image shake, big moving glows, many particles) - change things only when an event happens, shake only small elements, 128 colours. | Discord sticker spec: **320x320, <=512KB**, transparent. `scripts/sticker_original10.py <outdir> [v1..v4]` renders frames (each frame = an SVG string at 640px -> 320), then encode per variant: ffmpeg 255 colours + reserved transparency + `gifsicle -O3` (no lossy needed: 73-319KB). v1 roll call, v2 orbit (36 deg per loop = seamless), v3 assemble + sparkle burst, v4 wave + shine. 20fps (Discord-safe). SVG gotcha: a clipPath+skewed rect drew nothing - put a shine on text as a second text filled with a moving userSpaceOnUse gradient (vector near-horizontal for a narrow band) |
| Discord role icon "The Original 10" | `public/discord-role-original-10.png` | 256px transparent; ten dots on a ring around a bold "10", in the role's gradient (`#00f0ff -> #b100ff`, diagonal). `scripts/role_icon_original10.py` (`A, B` = role colours; `ICONS` picks which designs render). Role icons show at ~16-20px: bold silhouettes only. User rejected trophy/award/medal designs - wants meaning-led ones (orbit, key, seedling were liked) |

## Platform crop shapes (measured from screenshots)

- **Discord server icon:** rounded square, corner radius **28%** (measured, fit error 0.5px). The
  upload preview showed 25%. Make the asset's own corners **29%** (`border-radius:297px` at 1024) so
  the crop never cuts the rim; user preferred 29% over 30%. Not a circle anymore ("things are
  squircles"). People/bots are circles.
- **Discord bot avatar:** circle (`border-radius:50%`).
- **Discord server banner** (channel list): width-fitted to the sidebar, centre-cropped to roughly
  image rows **137-909 of 1080**, and the server-name header covers the top of that -> the truly
  visible band is about rows **410-880**. Put content in that band (v9 row is centred at y~645).
  In the banner *settings preview* it shows height-fitted (~17px trimmed each side) with ~68px
  rounded corners. Borders near the edge get cut in one place or another -> user dropped borders.
- **Discord invite background:** full-screen cover crop (16:10 window trims ~96px per side; 21:9
  trims ~128px top/bottom). Keep important content central; no edge borders.
- **Discord bot profile banner:** shown as a ~17:6 strip = middle ~960x340 of a 960x540 image
  (y 100-440). Avatar overlaps bottom-left (centre ~x145); "..." button top-right (~x832-928,
  strip y 40-137) - keep features clear of it.
- **GitHub org avatar:** fixed-px corner radius, so % varies by display size; on the large profile
  avatar it measured **3.2%** -> asset corners **3.6%** (`37px` at 1024). Small avatars trim a pixel
  of rim, invisible.
- **GitHub repo social preview:** header crops to ~**2.65:1** (~80px off top and bottom of
  1280x640). Keep everything inside the central band (the GitHub variant uses a smaller window).
- **OG images:** shown uncropped by most platforms at 1200x630. Socials cache by URL: refresh via
  Facebook Sharing Debugger / LinkedIn Post Inspector after deploy.
- **Windows taskbar:** no plate-less mark works (white vanishes on light taskbar, black on dark) ->
  the dark tile with rim is the answer.

### Measuring a crop from a screenshot

Load the screenshot with Pillow, find the page background colour at a corner, scan rows/columns for
the first non-background pixel to get the shown box, then fit a rounded-rect radius: for candidate
`r`, predicted inset at row `dy` is `r - sqrt(r^2 - (r-dy)^2)`; pick the `r` with the smallest mean
error. Convert display px to image px with the box's scale. To check a design, simulate the crop
(resize + crop + rounded/ellipse mask) on the render and Read it.

## Recipes

### App + SteamUtility icons
1. `python app_icons.py <work>` renders every size separately (rim = max(1, round(n*14/512)) px) -
   per-size rendering keeps a crisp 1px rim at 16px instead of a blurred downscale.
2. PNGs: `app_32/128/256/512` -> `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`.
3. ICO with Pillow using the per-size renders: `base.save(dst, format='ICO', sizes=[(s,s)...],
   append_images=[img(s) for s in sizes if s != max])`; verify frames byte-match the renders via
   `IcoImagePlugin.IcoFile(...).getimage((s,s))`.
4. **Dev build gotcha:** `tauri_build` embeds `icon.ico` as an exe resource that the window/taskbar
   icon loads from; `src-tauri/build.rs` now has `cargo:rerun-if-changed=icons` so changes are picked
   up. If a stale icon still shows: `cargo clean -p steam-game-idler` then relaunch. Icon cache
   clears don't fix a stale embedded resource.

### Favicons
- SVG: tight `viewBox="18 18 220 220"`, `<style>path{fill:#1d1d1d}@media (prefers-color-scheme:dark){path{fill:#fff}}</style>`
  plus `fill="#FFFFFF"` attribute fallback. Next app router serves `app/icon.svg` automatically.
- Chrome picks the `.ico` (Next labels it `sizes="256x256"`), so the `.ico` must be updated too:
  render white-on-transparent 256 via Edge, save ICO sizes 16-256.

### Website OG / GitHub social preview (split layout)
Left: rainbow pill (`.chip` 2px conic rim `36% 50%` + glow, `#050505` fill, logo + "Steam Game
Idler", 32px/600) then tagline 50px: "Farm **trading cards**, / manage **achievements**, / boost
**playtime**." - regular words `#f5f5f5`, bold words use the key-word gradient. Right:
`sgi-mock-hero.webp` 820px wide, `perspective(1600px) rotateY(-16deg)`, running off the right edge,
blurred rainbow glow behind (opacity .6). GitHub version: window 660px, left 760 (crop-safe).
Render 2x, downscale, PNG optimize. /alternatives keep the centred layout with the captured table.

### Blog covers
Use the blog-shared template (rainbow pill brand, mono eyebrow, auto-fit title, glass visual). See
`create-blog-post/references/post-format.md`. Swapping covers in place is SEO-safe if URL, size and
alt stay the same; never bump `updated:` for it.

### Discord server banner / invite background
1920x1080. Black starfield (no grid - user saw it when zoomed), app-icon tile (rim + rainbow blurred
glow at opacity .5), wordmark Geist 700, mono line "A STEAM AUTOMATION TOOL" letter-spaced by JS to
exactly the wordmark's width (`(nameW - tagW)/(chars-1)`, plus `margin-right:-ls`). Banner = row
layout (tile left, text right, gap k*84) centred in the visible band; invite = stacked, centred.
Content scale k = 1.375*0.95*0.95. No border.

### Animated GIFs (icons)
- **Frame rate:** GIF delays are in centiseconds and browsers (Chromium, so Discord too) bump any
  delay under 20ms to ~100ms, so **50fps (20ms) is the maximum** - "60fps" is impossible and would
  play at 10fps. **Discord caveat (2026-10-28):** a 50fps (20ms) bot avatar uploaded to the
  Discord developer portal played at **0.5x speed** - Discord re-encodes every uploaded GIF
  (media proxy / Lilliput). 25fps (40ms) and 33fps (30ms) 1024px re-renders and a 50fps <1MB
  448px version ALSO played slow. **What works (user-kept, 2026-10-28): the original recipe -
  20fps (50ms frames), 512px, solid corners (no transparency), ffmpeg 256 colours + gifsicle
  `-O3 --lossy=20`** (`FPS=20 RES=512 bot_icon_anim.py`, ~1.08MB). Root cause unconfirmed (the
  wiggle has little motion, so subtle slowdowns are hard to judge); until proven otherwise,
  **anything uploaded to Discord uses that recipe**, whatever the 50fps preference says.
  **The user wants every animation at 50fps** (outside that Discord limit). The bot scripts default to 50
  (`FPS` env overrides); `server_icon_anims.py` needs `FPS=50`. Encode with `ffmpeg -framerate 50`.
  **Bot avatar + bot banner may be up to 10MB: always ship the highest resolution that fits** (user,
  2026-10-28). The bot scripts render at 1024 and keep it (`RES` env, default 1024): encode 255
  colours + reserved transparency, no `--lossy`, just `gifsicle -O3` -> v1 4.9MB, v2 5.5MB at
  1024px/50fps. Banner: 960x540 (user's chosen size), 256 colours, no lossy, 1.2MB. Only drop
  resolution/colours when a target has a real cap (e.g. the 512KB server-icon variants).
- Loop 5s @ 20fps = 100 frames (banner line: 3s / 60 frames). Rim turns exactly 360 deg per loop
  (`--a` CSS var in `from calc(200deg + var(--a))`) -> seamless.
- **First frame = the static icon exactly** (Discord shows frame 1 when not hovered).
- Motion starts at **100ms** (user's preference across all variants).
- Render at 1024, LANCZOS to 512. Clip moving parts to the tile interior (`overflow:hidden` on the
  bordered div clips to the padding box) so pieces vanish into the rim.
- Easing lessons: no overshoot when pieces interlock (overshoot slides them past each other into a
  wrong "S"); when pieces must pass each other, step them apart perpendicular to the gap first
  ("lanes"), then click back together. To lengthen an off-screen beat, lengthen the travel and/or
  freeze the timeline while everything is off-tile (invisible).
- Liked: v3 split, v4 conveyor (final), v6 draw-on (rainbow outline trace -> white fill flash),
  antenna wiggle (damped spring, 16 deg, 2.6Hz, out of phase). Rejected: plain spin, shine sweep,
  3D coin flip.

### Small GIFs (size targets)
Don't drop frame rate. Pipeline from clean frames:
```bash
ffmpeg -framerate 20 -i frames/%03d.png -vf "scale=S:S:flags=lanczos,split[a][b];[a]palettegen=max_colors=C:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" ff.gif
gifsicle -O3 --lossy=20 ff.gif -o out.gif
```
Dithered GIFs barely compress (noise every frame) - always start from undithered frames. Lossy above
~40 saves little and smears the dark tile. Measured for the v4 icon: 256px/48 colours = 249.9KB
(<256KB); 384px/72 colours = 503,317 bytes (<512KB). The rim (changes every frame) dominates size.

### Website hero placeholder (`docs/public/landing/sgi-mock-hero*.webp`)
`hero_snapshot.ps1` drives headless Edge over CDP against the docs dev server and calls
`__sgiMockSnapshot(w)` (1600/960 desktop window, 900/560 at a 430x900 phone window). Headless is
slower than a real browser, so the mock's timers drift (01:59:58 vs 02:00:00): for a logo-only
change, paste just the changed region into the original images instead of replacing them.

### Bot avatar + banner: always the rainbow
The rim and the banner line are **rainbow** - the user corrected a recolour to the role's
`#00f0ff -> #b100ff` ("the border/rgb is supposed to be a rainbow"). Only the role icon uses role
colours. (To recolour a turning rim/flowing line anyway: make the gradient start and end on the same
colour so the loop has no seam; two-colour gradients compress *worse* than the rainbow.)
- `discord-bot-icon.gif` = v1 (antenna wiggle) in the Discord-safe recipe: 512px, 20fps, solid
  corners, ~1.08MB - **the one the user kept**.
- `discord-bot-icon-v2.gif` = `bot_icon_anim_v2.py`: from 100ms a 360-degree swirl (ease in-out,
  scale dips to 0.86 mid-spin) over 1s, then the antenna wiggle from 1.15s. 1024px, 50fps,
  transparent corners, ~5.5MB. (If ever size-capped: rainbow at 48 colours bands - stay at 64+.)

### Bot profile banner (ECG)
`bot_banner.py <work> 82 ecg`: baseline at 37% down the visible strip, straight-segment heartbeat
(sharp P and T peaks - user rejected rounded bumps) with the spike at x~700, rainbow
`linearGradient` (`spreadMethod="repeat"`, period = width) translated one period per loop, 5px
stroke + 10px blurred glow at .55. For a hump instead: perfect half circle (single radius) with 10px
tangent fillets; radius 82 matches the avatar slot.
