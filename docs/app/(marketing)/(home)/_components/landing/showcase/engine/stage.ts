// The three.js stage behind the landing page's showcase: one floating glass "app window" whose
// screen is the live, clickable MockApp canvas, a damped camera rig that frames it wherever the
// page asks (`setView`), and the payoff effects (cards, sparks, coins, confetti) that burst out of
// the screen into the scene.
//
// Loaded lazily (dynamic import from Showcase.tsx) so three.js never weighs on first paint, and
// only ever renders while the showcase is on screen (`setActive`).

import type { Fonts } from './draw'
import type { ThemeId } from './palette'
import type { DemoStats, Frame, PageId, Pose } from './types'
import { Coins, Confetti, Shockwaves, Sparks, TradingCards } from './effects'
import { loadGameArt } from './games'
import { drawLogo, MockApp, mockLayout } from './mockApp'
import { beaconMaterial, dustMaterial, rimMaterial, sheenMaterial } from './shaders'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/** Window thickness; its width/height come from the mock's layout at 300 UI px per world unit. */
const WIN_D = 0.08
const FOV = 26

export interface StageOptions {
  fonts: Fonts
  reducedMotion: boolean
  /** lower texture/pixel budgets for phones and tablets */
  lowPower: boolean
  /** draw the mock in its compact (narrow portrait window) layout - see mockLayout() */
  compact: boolean
  /** optional: running totals of what the visitor has done in the demo */
  onStats?(stats: DemoStats): void
  onNavigate(page: PageId, byUser: boolean): void
}

export interface StageHandle {
  /**
   * Where the window should sit (`frame`, container px) and how it should be posed. Both are eased
   * toward, never snapped (except on the first frame), so stepped wheel scrolling still glides.
   */
  setView(frame: Frame, pose: Pose): void
  /**
   * The page has scrolled the window fully into its docked position. The stage then waits for
   * its camera to finish easing in before telling the mock it's settled (auto-demo may start).
   */
  setDocked(docked: boolean): void
  navigate(page: PageId): void
  setTheme(theme: ThemeId): void
  /** pauses the render loop entirely while the section is off screen */
  setActive(active: boolean): void
  dispose(): void
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const deg = THREE.MathUtils.degToRad

/**
 * Yields to the browser so a long setup becomes many short tasks (input, painting and hydration
 * get a turn in between) - keeps the stage from adding Total Blocking Time / hurting INP.
 */
const yieldToMain = () =>
  new Promise<void>(resolve => {
    const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
    if (s?.yield) s.yield().then(resolve)
    else setTimeout(resolve, 0)
  })

function backTexture(fonts: Fonts) {
  const cv = document.createElement('canvas')
  cv.width = 1024
  cv.height = 640
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(512, 300, 40, 512, 320, 640)
  g.addColorStop(0, '#1b1c24')
  g.addColorStop(1, '#09090c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 640)
  drawLogo(ctx, 512 - 70, 210, 140, 'rgba(255,255,255,.9)')
  ctx.fillStyle = 'rgba(255,255,255,.55)'
  ctx.font = `600 30px ${fonts.display}`
  ctx.textAlign = 'center'
  ctx.fillText('Steam Game Idler', 512, 420)
  return cv
}

export async function createStage(container: HTMLElement, opts: StageOptions) {
  // ---- renderer (throws if WebGL is unavailable; the caller falls back to a static image)
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  let pixelRatio = Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.5 : 2)
  renderer.setPixelRatio(pixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;outline:none'
  canvas.setAttribute('aria-hidden', 'true')

  const scene = new THREE.Scene()
  // No PMREM environment map on purpose: generating one (RoomEnvironment) was ~0.9s of blocking
  // main-thread work at Lighthouse's mobile CPU throttle - by far the biggest cost of starting the
  // stage - for faint reflections on the window's thin edge. Plain lights give the same look.
  scene.add(new THREE.AmbientLight(0xffffff, 0.45))
  scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x16121f, 0.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(4, 5, 6)
  scene.add(key)
  const rimLight = new THREE.PointLight(0x7aa2ff, 6, 14)
  rimLight.position.set(-5, 2, -2)
  scene.add(rimLight)

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 80)
  const maxAniso = renderer.capabilities.getMaxAnisotropy()

  // ---- the app mock (canvas texture)
  // Draw the app's UI at about the resolution it's actually shown at (the hero frame is the
  // biggest it ever gets). Every UI change re-uploads this whole canvas to the GPU, so a fixed
  // 1.6x on a 1x display was ~2.5x the pixels for no visible gain.
  const layout = mockLayout(opts.compact)
  const UI_W = layout.W
  const UI_H = layout.H
  const WIN_W = UI_W / 300
  const WIN_H = UI_H / 300
  /**
   * Effect scale: cards, coins, confetti, sparks and rings are sized for the wide (4.8-unit)
   * window; the compact window is much smaller, so they shrink with it (not fully - a little
   * larger than proportional keeps them a satisfying size on a phone).
   */
  const FX = Math.min(1, (WIN_W / 4.8) * 1.35)
  /** UI px -> window-local position on the screen surface. */
  const uiToLocal = (x: number, y: number, out = new THREE.Vector3(), lift = 0.004) =>
    out.set((x / UI_W - 0.5) * WIN_W, (0.5 - y / UI_H) * WIN_H, WIN_D / 2 + lift)
  // compact is shown nearly full-width on a phone; the canvas is small (560px wide), so it can
  // afford a higher scale than the wide one while staying well under its pixel count
  const shownPx =
    (opts.compact
      ? Math.min(window.innerWidth * 0.94, 640)
      : Math.min(window.innerWidth * 0.74, 1180)) * pixelRatio
  const uiScale = clamp(
    Math.ceil((shownPx / UI_W) * 10) / 10,
    1,
    opts.compact ? 2.2 : opts.lowPower ? 1.2 : 1.6,
  )
  await yieldToMain()
  const art = await loadGameArt(Math.min(1.8, uiScale + 0.2), yieldToMain)
  const stats: DemoStats = {
    cardsDropped: 0,
    achievementsUnlocked: 0,
    gamesIdling: 2,
    itemsListed: 0,
    cardsCaught: 0,
  }
  const emitStats = () => opts.onStats?.({ ...stats })

  const win = new THREE.Group()
  win.rotation.order = 'YXZ'
  scene.add(win)
  const tmp = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const worldAt = (x: number, y: number) => {
    win.updateMatrixWorld()
    return win.localToWorld(uiToLocal(x, y, new THREE.Vector3(), 0.02))
  }
  const screenNormal = () =>
    normal.set(0, 0, 1).applyQuaternion(win.getWorldQuaternion(new THREE.Quaternion())).normalize()

  const mock = new MockApp(
    opts.fonts,
    art,
    uiScale,
    {
      cardDrop: (at, g) => {
        cards.spawn(
          worldAt(...at),
          screenNormal(),
          win.getWorldQuaternion(new THREE.Quaternion()),
          g,
        )
      },
      achievement: at => {
        waves.fire(uiToLocal(at[0], at[1], new THREE.Vector3(), 0.006), 0.9 * FX)
        sparks.emit(worldAt(...at), opts.reducedMotion ? 14 : 36, {
          colors: ['#ffd36b', '#fff2c4', '#ffb547', '#ffffff'],
          speed: [0.8 * FX, 2.4 * FX],
          dir: screenNormal().clone(),
          cone: 0.55,
          size: [3, 8],
          gravity: -0.6,
        })
      },
      coins: at => {
        coins.burst(worldAt(...at), screenNormal().clone(), opts.reducedMotion ? 2 : 5)
        sparks.emit(worldAt(...at), 12, {
          colors: ['#ffe08a', '#ffffff'],
          speed: [0.6 * FX, 1.6 * FX],
          dir: screenNormal().clone(),
          cone: 0.4,
        })
      },
      confetti: at => {
        confetti.burst(worldAt(...at), screenNormal().clone(), opts.reducedMotion ? 24 : 80)
        waves.fire(uiToLocal(at[0], at[1], new THREE.Vector3(), 0.006), 1.4 * FX, '#ffc700')
      },
      navigate: (page, byUser) => opts.onNavigate(page, byUser),
      stats: s => {
        Object.assign(stats, s)
        emitStats()
      },
      windowButton: kind => {
        bump = { kind, t: clock }
      },
    },
    opts.compact,
  )
  // paint the expensive sprites (capsule titles with their shadows) a few at a time, then the
  // first full frame is just cheap blits
  await mock.warm(yieldToMain)
  mock.update(0)
  // Dev-only: regenerates public/landing/sgi-mock-hero*.webp, the hero placeholder (an exact
  // snapshot of this opening frame). Run `__sgiMockSnapshot(1600)` / `(960)` in the dev page's
  // console and save the data URLs - redo this whenever the mock's Games page changes.
  if (process.env.NODE_ENV !== 'production') {
    ;(window as unknown as { __sgiMockSnapshot?: (w: number) => string }).__sgiMockSnapshot = w => {
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = Math.round((w * UI_H) / UI_W)
      const c = cv.getContext('2d')!
      c.imageSmoothingQuality = 'high'
      c.drawImage(mock.canvas, 0, 0, cv.width, cv.height)
      return cv.toDataURL('image/webp', 0.86)
    }
  }
  await yieldToMain()

  const screenTex = new THREE.CanvasTexture(mock.canvas)
  screenTex.colorSpace = THREE.SRGBColorSpace
  screenTex.anisotropy = maxAniso
  // No mipmaps: the canvas is drawn at ~display size (see uiScale), so mips bought nothing but
  // a full mip-chain rebuild on every UI re-upload.
  screenTex.generateMipmaps = false
  screenTex.minFilter = THREE.LinearFilter

  // body: a thin, rounded, lacquered slab - its metal edge catches the environment as it turns
  const bodyGeo = new RoundedBoxGeometry(WIN_W, WIN_H, WIN_D, 5, 0.05)
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#121218',
    metalness: 0.25,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  win.add(body)

  const planeGeo = new THREE.PlaneGeometry(WIN_W, WIN_H)
  // toneMapped:false keeps the UI's colours exactly the app's tokens (no ACES curve on them)
  const screenMat = new THREE.MeshBasicMaterial({
    map: screenTex,
    transparent: true,
    toneMapped: false,
  })
  const screen = new THREE.Mesh(planeGeo, screenMat)
  screen.position.z = WIN_D / 2 + 0.001
  win.add(screen)

  const sheen = new THREE.Mesh(planeGeo, sheenMaterial())
  sheen.position.z = WIN_D / 2 + 0.003
  sheen.renderOrder = 2
  win.add(sheen)

  const backTex = new THREE.CanvasTexture(backTexture(opts.fonts))
  backTex.colorSpace = THREE.SRGBColorSpace
  const backMat = new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false })
  const back = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W - 0.06, WIN_H - 0.06), backMat)
  back.position.z = -WIN_D / 2 - 0.001
  back.rotation.y = Math.PI
  win.add(back)

  const RIM_PAD = 1.3
  const rimMat = rimMaterial(WIN_W, WIN_H, RIM_PAD)
  const rim = new THREE.Mesh(
    new THREE.PlaneGeometry(WIN_W + RIM_PAD * 2, WIN_H + RIM_PAD * 2),
    rimMat,
  )
  rim.position.z = -WIN_D / 2 - 0.06
  win.add(rim)

  const beaconMat = beaconMaterial(new THREE.Color('#5fb6ff'))
  const beacon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beaconMat)
  beacon.renderOrder = 4
  win.add(beacon)

  const waves = new Shockwaves(5)
  win.add(waves.group)

  // Partial screen uploads: when only a localised animation ran (a farm card ticking, the unlocker
  // feed), copy just that region into the existing GPU texture with texSubImage2D instead of
  // re-uploading the whole canvas. Falls back to a full upload until three has created the texture.
  const gl = renderer.getContext()
  const scratch = document.createElement('canvas')
  const scratchCtx = scratch.getContext('2d')!
  const uploadRect = (r: [number, number, number, number]) => {
    const glTex = (renderer.properties.get(screenTex) as { __webglTexture?: WebGLTexture })
      .__webglTexture
    if (!glTex || screenTex.version === 0 || screenTex.needsUpdate) {
      screenTex.needsUpdate = true
      return
    }
    const cw = mock.canvas.width
    const ch = mock.canvas.height
    const x = clamp(Math.floor(r[0] * uiScale) - 2, 0, cw)
    const y = clamp(Math.floor(r[1] * uiScale) - 2, 0, ch)
    const w = clamp(Math.ceil(r[2] * uiScale) + 4, 0, cw - x)
    const h = clamp(Math.ceil(r[3] * uiScale) + 4, 0, ch - y)
    if (!w || !h) return
    if (scratch.width !== w || scratch.height !== h) {
      scratch.width = w
      scratch.height = h
    } else scratchCtx.clearRect(0, 0, w, h)
    scratchCtx.drawImage(mock.canvas, x, y, w, h, 0, 0, w, h)
    renderer.state.bindTexture(gl.TEXTURE_2D, glTex)
    // match three's own upload state for this texture (it re-sets these on every upload it does)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, screenTex.flipY)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, screenTex.premultiplyAlpha)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    // with flipY the texture's rows are stored bottom-up
    const yGl = screenTex.flipY ? ch - y - h : y
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, yGl, gl.RGBA, gl.UNSIGNED_BYTE, scratch)
  }

  // ---- scene effects
  const sparks = new Sparks(900, pixelRatio)
  scene.add(sparks.points)
  const cards = new TradingCards(18, art, opts.fonts, maxAniso, FX)
  scene.add(cards.group)
  const coins = new Coins(40, FX)
  scene.add(coins.mesh)
  const confetti = new Confetti(160, FX)
  scene.add(confetti.mesh)

  const DUST = opts.lowPower ? 320 : 900
  const dustGeo = new THREE.BufferGeometry()
  const dustPos = new Float32Array(DUST * 3)
  const dustSeed = new Float32Array(DUST)
  for (let i = 0; i < DUST; i++) {
    dustPos.set(
      [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12, -6 + Math.random() * 8],
      i * 3,
    )
    dustSeed[i] = Math.random()
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1))
  const dustMat = dustMaterial(pixelRatio)
  const dust = new THREE.Points(dustGeo, dustMat)
  dust.frustumCulled = false
  scene.add(dust)

  // Warm-up: upload every card face and compile every material now, so the first card drops
  // don't stall on a shader compile or texture upload mid-animation.
  await cards.prewarm(renderer, yieldToMain)
  renderer.initTexture(screenTex)
  await yieldToMain()
  cards.group.children.forEach(m => (m.visible = true))
  // compileAsync uses KHR_parallel_shader_compile where available, so shader linking happens off
  // the main thread instead of stalling it
  await renderer.compileAsync(scene, camera)
  cards.group.children.forEach(m => (m.visible = false))
  await yieldToMain()

  container.appendChild(canvas)

  // ---- layout / camera rig
  let width = 1
  let height = 1
  let targetFrame: Frame = { x: 0, y: 0, w: 1, h: 1 }
  let targetPose: Pose = { focus: [UI_W / 2, UI_H / 2], zoom: 1, rx: 0, ry: 0 }
  const frame: Frame = { ...targetFrame }
  let docked = false
  const cur = { fx: UI_W / 2, fy: UI_H / 2, logZoom: 0, rx: 0, ry: 0 }
  let firstFrame = true

  const resize = () => {
    width = Math.max(1, container.clientWidth)
    height = Math.max(1, container.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  // ---- interaction
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const pointer = { x: 0, y: 0, inside: false, px: 0, py: 0 }
  const drag = { down: false, id: -1, sx: 0, sy: 0, lx: 0, ly: 0, moved: false, t: 0 }
  let hoverDirty = false
  let bump: { kind: 'min' | 'max' | 'close'; t: number } | null = null

  const setNdc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    pointer.px = e.clientX - r.left
    pointer.py = e.clientY - r.top
    ndc.set((pointer.px / r.width) * 2 - 1, -(pointer.py / r.height) * 2 + 1)
    pointer.x = ndc.x
    pointer.y = ndc.y
  }

  const pick = () => {
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects([...cards.pickables(), screen, body], false)
    return hits[0] ?? null
  }

  const onMove = (e: PointerEvent) => {
    setNdc(e)
    pointer.inside = true
    if (drag.down && e.pointerId === drag.id) {
      // a press that travels isn't a click (e.g. a touch that turned into a scroll)
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true
      return
    }
    hoverDirty = true
  }

  const onDown = (e: PointerEvent) => {
    setNdc(e)
    drag.down = true
    drag.id = e.pointerId
    drag.sx = drag.lx = e.clientX
    drag.sy = drag.ly = e.clientY
    drag.moved = false
    drag.t = performance.now()
  }

  const onUp = (e: PointerEvent) => {
    if (!drag.down || e.pointerId !== drag.id) return
    drag.down = false
    setNdc(e)
    if (drag.moved) {
      hoverDirty = true
      return
    }
    const hit = pick()
    if (!hit) return
    if (hit.object !== screen && hit.object !== body) {
      if (cards.catch(hit.object, clock)) {
        stats.cardsCaught += 1
        emitStats()
        sparks.emit(hit.point, opts.reducedMotion ? 10 : 28, {
          colors: ['#ffffff', '#9fd3ff', '#ffd36b'],
          speed: [0.6 * FX, 2 * FX],
          size: [3, 7],
        })
      }
      return
    }
    if (hit.object === screen && hit.uv) {
      mock.click(hit.uv.x * UI_W, (1 - hit.uv.y) * UI_H)
      hoverDirty = true
    }
  }

  const onLeave = () => {
    pointer.inside = false
    mock.pointer(0, null)
    canvas.style.cursor = ''
  }

  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointerleave', onLeave)
  canvas.addEventListener('pointercancel', () => (drag.down = false))

  const updateHover = () => {
    if (!hoverDirty || drag.down || !pointer.inside) return
    hoverDirty = false
    const hit = pick()
    let cursor = ''
    if (hit?.object === screen && hit.uv) {
      cursor = mock.pointer(hit.uv.x * UI_W, (1 - hit.uv.y) * UI_H) ? 'pointer' : ''
    } else {
      mock.pointer(0, null)
      // anything else under the pointer that's pickable is a flying card you can catch
      cursor = hit && hit.object !== body ? 'pointer' : ''
    }
    canvas.style.cursor = cursor
  }

  // ---- loop
  let clock = 0
  const UI_FRAME = 1 / 30
  let lastUi = 0
  // Adaptive resolution: if a device can't hold ~45fps for a couple of seconds, step the canvas'
  // pixel ratio down (never below 1, never back up - so it can't oscillate).
  let frameAvg = 1 / 60
  let qualityTimer = 0
  const adaptQuality = (dt: number) => {
    frameAvg += (dt - frameAvg) * 0.05
    qualityTimer += dt
    if (qualityTimer < 2 || frameAvg < 1 / 45 || pixelRatio <= 1) return
    qualityTimer = 0
    pixelRatio = Math.max(1, pixelRatio - 0.25)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(width, height, false)
    dustMat.uniforms.uPixelRatio.value = pixelRatio
    sparks.setPixelRatio(pixelRatio)
  }
  let last = performance.now()
  let active = false

  const tick = () => {
    const nowMs = performance.now()
    const dt = Math.min(0.05, (nowMs - last) / 1000)
    last = nowMs
    clock += dt
    const now = nowMs / 1000

    // The UI's own animations (bars, pops, toasts) are capped at 30fps: each redraw repaints and
    // re-uploads the whole screen canvas, and at 60fps that upload was what made the page lag
    // while card farming kept the UI animating. The 3D scene itself still renders every frame.
    if (now - lastUi >= UI_FRAME) {
      lastUi = now
      const changed = mock.update(now)
      if (changed === 'full') screenTex.needsUpdate = true
      else if (changed) uploadRect(changed)
    }

    adaptQuality(dt)

    // frame + pose, damped toward what the page asked for
    const target = targetPose
    const k = firstFrame ? 1 : 1 - Math.exp(-dt * (opts.reducedMotion ? 12 : 4.2))
    firstFrame = false
    frame.x += (targetFrame.x - frame.x) * k
    frame.y += (targetFrame.y - frame.y) * k
    frame.w += (targetFrame.w - frame.w) * k
    frame.h += (targetFrame.h - frame.h) * k
    // settled = docked, and the eased camera has (visually) arrived at its target
    if (docked) {
      const still =
        Math.abs(targetFrame.y - frame.y) < 2 &&
        Math.abs(targetFrame.w - frame.w) < 2 &&
        Math.abs(Math.log(target.zoom) - cur.logZoom) < 0.01 &&
        Math.abs(target.rx - cur.rx) < 0.5
      if (still) mock.setSettled(true)
    }
    cur.fx += (target.focus[0] - cur.fx) * k
    cur.fy += (target.focus[1] - cur.fy) * k
    cur.logZoom += (Math.log(target.zoom) - cur.logZoom) * k
    cur.rx += (target.rx - cur.rx) * k
    cur.ry += (target.ry - cur.ry) * k

    // a slow idle "breath" (off for reduced motion); the window deliberately doesn't follow the
    // mouse - tilting under the cursor made the app awkward to click
    const motion = opts.reducedMotion ? 0 : 1
    const ry = cur.ry + Math.sin(clock * 0.35) * 1.6 * motion
    const rx = cur.rx

    // camera: put the focus point at the frame's centre, at a distance that fits the window.
    // Computed from the window's *rest* transform, so the float and the window-button bumps
    // below visibly move the window instead of being tracked away by the camera.
    win.rotation.set(deg(rx), deg(ry), 0)
    win.position.set(0, 0, 0)
    win.scale.setScalar(1)
    win.updateMatrixWorld()
    const kpx = (2 * Math.tan(deg(FOV / 2))) / height // world units per px, per unit distance
    const fit = Math.max(WIN_W / (frame.w * kpx), WIN_H / (frame.h * kpx))
    const d = fit / Math.exp(cur.logZoom)
    const F = win.localToWorld(uiToLocal(cur.fx, cur.fy, tmp, 0))
    const ox = frame.x + frame.w / 2 - width / 2
    const oy = frame.y + frame.h / 2 - height / 2
    camera.position.set(F.x - ox * kpx * d, F.y + oy * kpx * d, F.z + d)
    camera.rotation.set(0, 0, 0)
    camera.updateMatrixWorld()

    let bumpRy = 0
    let bumpScale = 1
    let bumpY = 0
    if (bump) {
      const p = clamp((clock - bump.t) / 1.1, 0, 1)
      const io = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2
      if (bump.kind === 'close') bumpRy = io * 360
      if (bump.kind === 'min') {
        bumpY = -Math.sin(p * Math.PI) * 0.9
        bumpScale = 1 - Math.sin(p * Math.PI) * 0.3
      }
      if (bump.kind === 'max') bumpScale = 1 + Math.sin(p * Math.PI) * 0.07
      if (p >= 1) bump = null
    }
    win.rotation.set(deg(rx), deg(ry + bumpRy), 0)
    win.position.set(0, bumpY + Math.sin(clock * 0.8) * 0.025 * motion, 0)
    win.scale.setScalar(bumpScale)
    win.updateMatrixWorld()

    // glass sheen slides with the window's turn
    ;(sheen.material as THREE.ShaderMaterial).uniforms.uShift.value = ry / 70 + rx / 90
    rimMat.uniforms.uTime.value = clock

    // "try this" beacon
    const b = mock.beacon()
    const bu = beaconMat.uniforms
    if (b) {
      const [bx, by, bw, bh] = b
      const pad = 0.5
      const ww = (bw / UI_W) * WIN_W
      const hh = (bh / UI_H) * WIN_H
      beacon.position.copy(uiToLocal(bx + bw / 2, by + bh / 2, tmp, 0.008))
      beacon.scale.set(ww + pad, hh + pad, 1)
      bu.uSize.value.set(ww + pad, hh + pad)
      bu.uHalf.value.set(ww / 2, hh / 2)
      bu.uRadius.value = Math.min(ww, hh) / 2
    }
    bu.uOpacity.value += ((b ? 1 : 0) - bu.uOpacity.value) * (1 - Math.exp(-dt * 5))
    bu.uTime.value = clock
    beacon.visible = bu.uOpacity.value > 0.01

    dustMat.uniforms.uTime.value = clock
    sparks.update(dt)
    cards.update(dt, clock)
    coins.update(dt)
    confetti.update(dt)
    waves.update(dt)
    updateHover()

    renderer.render(scene, camera)
  }

  const setActive = (on: boolean) => {
    if (on === active) return
    active = on
    last = performance.now()
    renderer.setAnimationLoop(on ? tick : null)
  }

  const handle: StageHandle = {
    setView: (f, pose) => {
      targetFrame = f
      targetPose = pose
    },
    setDocked: d => {
      docked = d
      if (!d) mock.setSettled(false)
    },
    navigate: page => mock.navigate(page, false),
    setTheme: theme => mock.setTheme(theme),
    setActive,
    dispose: () => {
      setActive(false)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      sparks.dispose()
      cards.dispose()
      coins.dispose()
      confetti.dispose()
      waves.dispose()
      ;[bodyGeo, planeGeo, back.geometry, rim.geometry, beacon.geometry, dustGeo].forEach(g =>
        g.dispose(),
      )
      ;[
        bodyMat,
        screenMat,
        backMat,
        rimMat,
        beaconMat,
        dustMat,
        sheen.material as THREE.Material,
      ].forEach(m => m.dispose())
      ;[screenTex, backTex].forEach(t => t.dispose())
      renderer.dispose()
      canvas.remove()
    },
  }
  return handle
}
