// Physical "payoff" effects that leave the app's screen and enter the 3D scene: trading cards that
// fly out on every drop (and can be caught), spark bursts on unlocks, coins when items list,
// confetti for a claimed free game. Everything is pooled - nothing allocates per event.

import type { Fonts } from './draw'
import type { Game } from './games'
import { rr } from './draw'
import { GAMES } from './games'
import { drawLogo } from './mockApp'
import { shockwaveMaterial, sparkMaterial } from './shaders'
import * as THREE from 'three'

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const tmpV = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()
const tmpM = new THREE.Matrix4()
const tmpS = new THREE.Vector3()

// ------------------------------------------------------------------------------------- sparks

export class Sparks {
  readonly points: THREE.Points
  private n: number
  private pos: Float32Array
  private vel: Float32Array
  private col: Float32Array
  private size: Float32Array
  private alpha: Float32Array
  private age: Float32Array
  private life: Float32Array
  private grav: Float32Array
  private cursor = 0
  private spawned = false

  constructor(count: number, pixelRatio: number) {
    this.n = count
    this.pos = new Float32Array(count * 3)
    this.vel = new Float32Array(count * 3)
    this.col = new Float32Array(count * 3)
    this.size = new Float32Array(count)
    this.alpha = new Float32Array(count)
    this.age = new Float32Array(count).fill(1)
    this.life = new Float32Array(count).fill(1)
    this.grav = new Float32Array(count)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage),
    )
    geo.setAttribute(
      'aColor',
      new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage),
    )
    geo.setAttribute(
      'aSize',
      new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage),
    )
    geo.setAttribute(
      'aAlpha',
      new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage),
    )
    this.points = new THREE.Points(geo, sparkMaterial(pixelRatio))
    this.points.frustumCulled = false
  }

  emit(
    origin: THREE.Vector3,
    count: number,
    o: {
      colors: string[]
      speed: [number, number]
      dir?: THREE.Vector3
      cone?: number
      size?: [number, number]
      life?: [number, number]
      gravity?: number
    },
  ) {
    const c = new THREE.Color()
    for (let k = 0; k < count; k++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % this.n
      // random direction, biased toward `dir` by `cone` (0 = any direction, 1 = straight along dir)
      tmpV.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize()
      if (o.dir) tmpV.lerp(o.dir, o.cone ?? 0.5).normalize()
      const sp = rand(...o.speed)
      this.pos.set([origin.x, origin.y, origin.z], i * 3)
      this.vel.set([tmpV.x * sp, tmpV.y * sp, tmpV.z * sp], i * 3)
      c.set(o.colors[k % o.colors.length])
      this.col.set([c.r, c.g, c.b], i * 3)
      this.size[i] = rand(...(o.size ?? [3, 7]))
      this.age[i] = 0
      this.life[i] = rand(...(o.life ?? [0.6, 1.2]))
      this.grav[i] = o.gravity ?? -1.2
    }
    this.spawned = true
  }

  /** live particle count after the last update - lets update() skip idle frames entirely */
  private live = 0

  setPixelRatio(pr: number) {
    ;(this.points.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = pr
  }

  update(dt: number) {
    // nothing alive and nothing just spawned: no simulation, no buffer uploads this frame
    if (this.live === 0 && !this.spawned) return
    this.spawned = false
    let live = 0
    for (let i = 0; i < this.n; i++) {
      if (this.age[i] >= this.life[i]) {
        this.alpha[i] = 0
        continue
      }
      live++
      this.age[i] += dt
      const p = this.age[i] / this.life[i]
      const j = i * 3
      this.vel[j + 1] += this.grav[i] * dt
      const drag = Math.exp(-dt * 2.2)
      this.vel[j] *= drag
      this.vel[j + 1] *= drag
      this.vel[j + 2] *= drag
      this.pos[j] += this.vel[j] * dt
      this.pos[j + 1] += this.vel[j + 1] * dt
      this.pos[j + 2] += this.vel[j + 2] * dt
      this.alpha[i] = p < 0.1 ? p * 10 : 1 - (p - 0.1) / 0.9
    }
    this.live = live
    const geo = this.points.geometry
    ;(['position', 'aColor', 'aSize', 'aAlpha'] as const).forEach(
      k => (geo.getAttribute(k).needsUpdate = true),
    )
  }

  dispose() {
    this.points.geometry.dispose()
    ;(this.points.material as THREE.Material).dispose()
  }
}

// ------------------------------------------------------------------------------- trading cards

const CARD_W = 0.34
const CARD_H = 0.47

interface Card {
  mesh: THREE.Mesh
  mats: THREE.MeshStandardMaterial[]
  vel: THREE.Vector3
  spin: THREE.Vector3
  age: number
  life: number
  active: boolean
  caughtAt: number
  game: string
}

/** Steam-trading-card-shaped canvas faces, one per fictional game, built on first use. */
function cardFace(g: Game, art: HTMLCanvasElement | undefined, fonts: Fonts) {
  const W = 256
  const H = 354
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  rr(ctx, 0, 0, W, H, 16)
  ctx.fillStyle = '#e8e8ef'
  ctx.fill()
  ctx.save()
  rr(ctx, 9, 9, W - 18, H - 18, 10)
  ctx.clip()
  if (art) {
    // cover-crop the 460x215 header art into the portrait card
    const s = (H - 18) / art.height
    const dw = art.width * s
    ctx.drawImage(art, 9 + (W - 18 - dw) / 2, 9, dw, H - 18)
  }
  const grad = ctx.createLinearGradient(0, H - 110, 0, H)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,.78)')
  ctx.fillStyle = grad
  ctx.fillRect(0, H - 110, W, 110)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 20px ${fonts.sans}`
  ctx.fillText(g.name, W / 2, H - 52, W - 36)
  ctx.font = `600 13px ${fonts.sans}`
  ctx.fillStyle = 'rgba(255,255,255,.7)'
  ctx.fillText('Trading Card', W / 2, H - 30)
  ctx.restore()
  return cv
}

function cardBack() {
  const W = 256
  const H = 354
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  rr(ctx, 0, 0, W, H, 16)
  ctx.fillStyle = '#e8e8ef'
  ctx.fill()
  rr(ctx, 9, 9, W - 18, H - 18, 10)
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#1d2033')
  g.addColorStop(1, '#0b0c14')
  ctx.fillStyle = g
  ctx.fill()
  drawLogo(ctx, W / 2 - 46, H / 2 - 54, 92, 'rgba(255,255,255,.85)')
  return cv
}

export class TradingCards {
  readonly group = new THREE.Group()
  private cards: Card[] = []
  private faces = new Map<string, THREE.CanvasTexture>()
  private back: THREE.CanvasTexture
  private geo = new THREE.BoxGeometry(CARD_W, CARD_H, 0.006)

  constructor(
    count: number,
    private art: Map<string, HTMLCanvasElement>,
    private fonts: Fonts,
    private anisotropy: number,
    /** effect scale relative to the wide window (the compact one is ~0.4x as wide) */
    private k = 1,
  ) {
    this.back = this.tex(cardBack())
    for (let i = 0; i < count; i++) {
      const edge = new THREE.MeshStandardMaterial({
        color: '#e8e8ef',
        roughness: 0.5,
        transparent: true,
      })
      // Starts with a (placeholder) map so the shader is compiled with texturing from the outset:
      // assigning the first map later would force a recompile mid-animation on the first drop.
      const front = new THREE.MeshStandardMaterial({
        map: this.back,
        roughness: 0.35,
        metalness: 0.05,
        transparent: true,
      })
      const back = new THREE.MeshStandardMaterial({
        map: this.back,
        roughness: 0.4,
        transparent: true,
      })
      // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
      const mats = [edge, edge, edge, edge, front, back]
      const mesh = new THREE.Mesh(this.geo, mats)
      mesh.visible = false
      this.group.add(mesh)
      this.cards.push({
        mesh,
        mats: [edge, front, back],
        vel: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        age: 0,
        life: 5,
        active: false,
        caughtAt: -1,
        game: '',
      })
    }
  }

  private tex(cv: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = this.anisotropy
    return t
  }

  /** Builds and uploads every game's card face up front (see stage.ts warm-up). */
  async prewarm(renderer: THREE.WebGLRenderer, yieldToMain: () => Promise<void>) {
    for (const name of this.art.keys()) {
      const g = GAMES.find(x => x.name === name)
      if (g) renderer.initTexture(this.face(g))
      await yieldToMain()
    }
  }

  private face(g: Game) {
    let t = this.faces.get(g.name)
    if (!t) {
      t = this.tex(cardFace(g, this.art.get(g.name), this.fonts))
      this.faces.set(g.name, t)
    }
    return t
  }

  /** Launch a card from `origin` (world), out along the screen's `normal` and up. */
  spawn(origin: THREE.Vector3, normal: THREE.Vector3, quat: THREE.Quaternion, g: Game) {
    const c =
      this.cards.find(k => !k.active) ?? this.cards.reduce((a, b) => (a.age > b.age ? a : b))
    c.active = true
    c.age = 0
    c.life = rand(4.6, 5.6)
    c.caughtAt = -1
    c.game = g.name
    c.mats[1].map = this.face(g)
    c.mesh.position.copy(origin).addScaledVector(normal, 0.05 * this.k)
    c.mesh.quaternion.copy(quat)
    c.mesh.scale.setScalar(0.4 * this.k)
    c.mesh.visible = true
    const up = new THREE.Vector3(0, 1, 0)
    const side = new THREE.Vector3().crossVectors(up, normal).normalize()
    c.vel
      .copy(normal)
      .multiplyScalar(rand(1.5, 2.1))
      .addScaledVector(up, rand(1.1, 1.6))
      .addScaledVector(side, rand(-0.7, 0.7))
      .multiplyScalar(this.k)
    c.spin.set(rand(-2, 2), rand(-5, 5), rand(-1.5, 1.5))
  }

  /** Cards still in flight that a pointer ray could catch. */
  pickables() {
    return this.cards.filter(c => c.active && c.caughtAt < 0).map(c => c.mesh)
  }

  /** Returns true if `mesh` was a catchable card (and starts its caught animation). */
  catch(mesh: THREE.Object3D, now: number) {
    const c = this.cards.find(k => k.mesh === mesh && k.active && k.caughtAt < 0)
    if (!c) return false
    c.caughtAt = now
    c.spin.set(0, 18, 0)
    c.vel.multiplyScalar(0.15)
    return true
  }

  update(dt: number, now: number) {
    if (!this.cards.some(c => c.active)) return
    for (const c of this.cards) {
      if (!c.active) continue
      c.age += dt
      let alpha = 1
      if (c.caughtAt >= 0) {
        // caught: spin up, swell, then vanish
        const p = Math.min(1, (now - c.caughtAt) / 0.55)
        c.mesh.scale.setScalar((1 + p * 0.6) * this.k)
        alpha = 1 - p * p
        if (p >= 1) c.active = false
      } else {
        c.vel.y -= 1.35 * this.k * dt
        c.vel.multiplyScalar(Math.exp(-dt * 0.55))
        c.mesh.scale.setScalar(Math.min(1, 0.4 + c.age * 2.4) * this.k)
        alpha = c.age > c.life - 0.8 ? Math.max(0, (c.life - c.age) / 0.8) : 1
        if (c.age >= c.life) c.active = false
      }
      c.mesh.position.addScaledVector(c.vel, dt)
      tmpE.set(c.spin.x * dt, c.spin.y * dt, c.spin.z * dt)
      c.mesh.quaternion.multiply(tmpQ.setFromEuler(tmpE))
      for (const m of c.mats) m.opacity = alpha
      c.mesh.visible = c.active
    }
  }

  dispose() {
    this.geo.dispose()
    this.back.dispose()
    this.faces.forEach(t => t.dispose())
    this.cards.forEach(c => c.mats.forEach(m => m.dispose()))
  }
}

// ---------------------------------------------------------------------- instanced flyers (coins, confetti)

interface Flyer {
  pos: THREE.Vector3
  vel: THREE.Vector3
  rot: THREE.Euler
  spin: THREE.Vector3
  age: number
  life: number
  scale: number
}

class InstancedFlyers {
  readonly mesh: THREE.InstancedMesh
  private items: Flyer[] = []
  private cursor = 0

  constructor(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    count: number,
    private gravity: number,
    private drag: number,
    /** effect scale relative to the wide window */
    protected k = 1,
  ) {
    this.mesh = new THREE.InstancedMesh(geo, mat, count)
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.mesh.frustumCulled = false
    for (let i = 0; i < count; i++) {
      this.items.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        spin: new THREE.Vector3(),
        age: 1,
        life: 0,
        scale: 1,
      })
      this.mesh.setMatrixAt(i, tmpM.makeScale(0, 0, 0))
    }
  }

  protected launch(origin: THREE.Vector3, vel: THREE.Vector3, life: number, scale = 1) {
    const i = this.cursor
    this.cursor = (this.cursor + 1) % this.items.length
    const f = this.items[i]
    f.pos.copy(origin)
    f.vel.copy(vel).multiplyScalar(this.k)
    f.rot.set(rand(0, 6), rand(0, 6), rand(0, 6))
    f.spin.set(rand(-9, 9), rand(-9, 9), rand(-9, 9))
    f.age = 0
    f.life = life
    f.scale = scale * this.k
    this.busy = true
    return i
  }

  /** instances still flying (or just expired and needing their matrix zeroed) */
  private busy = false

  update(dt: number) {
    if (!this.busy) return
    let any = false
    this.items.forEach((f, i) => {
      if (f.age >= f.life) return
      any = true
      f.age += dt
      f.vel.y += this.gravity * this.k * dt
      f.vel.multiplyScalar(Math.exp(-dt * this.drag))
      f.pos.addScaledVector(f.vel, dt)
      f.rot.x += f.spin.x * dt
      f.rot.y += f.spin.y * dt
      f.rot.z += f.spin.z * dt
      const p = f.age / f.life
      const s =
        f.age >= f.life ? 0 : f.scale * Math.min(1, f.age * 8) * (p > 0.8 ? (1 - p) / 0.2 : 1)
      tmpM.compose(f.pos, tmpQ.setFromEuler(f.rot), tmpS.setScalar(s))
      this.mesh.setMatrixAt(i, tmpM)
    })
    this.mesh.instanceMatrix.needsUpdate = true
    this.busy = any
  }

  dispose() {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}

export class Coins extends InstancedFlyers {
  constructor(count: number, k = 1) {
    super(
      new THREE.CylinderGeometry(0.07, 0.07, 0.014, 28).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: '#f6c445',
        metalness: 0.55,
        roughness: 0.25,
        emissive: '#6b4a00',
      }),
      count,
      -3.2,
      0.4,
      k,
    )
  }

  burst(origin: THREE.Vector3, normal: THREE.Vector3, n = 6) {
    for (let k = 0; k < n; k++) {
      const v = normal
        .clone()
        .multiplyScalar(rand(0.8, 1.6))
        .add(new THREE.Vector3(rand(-0.8, 0.8), rand(1.6, 2.6), rand(-0.3, 0.3)))
      this.launch(origin, v, rand(1.3, 1.8), rand(0.8, 1.15))
    }
  }
}

export class Confetti extends InstancedFlyers {
  private palette = ['#ff4f6d', '#ffc700', '#3fd18a', '#5b8cff', '#b35bff', '#ffffff', '#00a3ff']

  constructor(count: number, k = 1) {
    super(
      new THREE.PlaneGeometry(0.06, 0.034),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }),
      count,
      -1.1,
      1.6,
      k,
    )
    const c = new THREE.Color()
    for (let i = 0; i < count; i++)
      this.mesh.setColorAt(i, c.set(this.palette[i % this.palette.length]))
  }

  burst(origin: THREE.Vector3, normal: THREE.Vector3, n = 70) {
    for (let k = 0; k < n; k++) {
      const v = normal
        .clone()
        .multiplyScalar(rand(1, 3))
        .add(new THREE.Vector3(rand(-2.2, 2.2), rand(1, 3.6), rand(-0.6, 0.6)))
      this.launch(origin, v, rand(2.2, 3.4), rand(0.8, 1.3))
    }
  }
}

// ------------------------------------------------------------------------------------ shockwaves

/** Rings that expand across the screen surface (parented to the window, so they stay on it). */
export class Shockwaves {
  readonly group = new THREE.Group()
  private rings: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; t: number }[] = []
  private geo = new THREE.PlaneGeometry(1, 1)

  constructor(count: number) {
    for (let i = 0; i < count; i++) {
      const mat = shockwaveMaterial()
      const mesh = new THREE.Mesh(this.geo, mat)
      mesh.visible = false
      mesh.renderOrder = 3
      this.group.add(mesh)
      this.rings.push({ mesh, mat, t: -1 })
    }
  }

  fire(local: THREE.Vector3, size: number, color = '#ffd36b') {
    const r = this.rings.reduce((a, b) => (a.t < 0 ? a : b.t < 0 ? b : a.t < b.t ? a : b))
    r.t = 0
    r.mesh.position.copy(local)
    r.mesh.scale.setScalar(size)
    r.mat.uniforms.uColor.value.set(color)
    r.mesh.visible = true
  }

  update(dt: number) {
    for (const r of this.rings) {
      if (r.t < 0) continue
      r.t += dt / 0.9
      if (r.t >= 1) {
        r.t = -1
        r.mesh.visible = false
        continue
      }
      r.mat.uniforms.uProgress.value = 1 - (1 - r.t) ** 3
    }
  }

  dispose() {
    this.geo.dispose()
    this.rings.forEach(r => r.mat.dispose())
  }
}
