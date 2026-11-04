// Small immediate-mode canvas helpers for the app mock: rounded rects, text with ellipsis and
// tracking, Tabler icons via Path2D, and game capsules. All coordinates are the mock's logical
// 1440x900 pixel space - the caller sets the device scale once on the context.

import type { Game } from './games'
import type { IconName } from './icons'
import { titleFont } from './games'
import { ICONS } from './icons'

export type Ctx = CanvasRenderingContext2D

export interface Fonts {
  /** UI face (Inter - the desktop app's font) */
  sans: string
  /** wordmark/display face (Unbounded - the desktop app's titlebar wordmark) */
  display: string
}

// Hand-rolled instead of ctx.roundRect() - that only landed in Safari 16 / Firefox 112.
export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

export function fillRR(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
) {
  rr(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

export function strokeRR(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  width = 1,
) {
  rr(ctx, x + width / 2, y + width / 2, w - width, h - width, r)
  ctx.strokeStyle = stroke
  ctx.lineWidth = width
  ctx.stroke()
}

export interface TextOpts {
  size: number
  weight?: number
  color: string
  align?: CanvasTextAlign
  /** vertical anchor; 'middle' centres the cap height on y */
  baseline?: CanvasTextBaseline
  maxW?: number
  family?: string
  italic?: boolean
  tabular?: boolean
}

const ellipsisCache = new Map<string, string>()

/** Draws one line of text, ellipsising to `maxW`. Returns the drawn width. */
export function text(ctx: Ctx, fonts: Fonts, str: string, x: number, y: number, o: TextOpts) {
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 500} ${o.size}px ${o.family ?? fonts.sans}`
  ctx.fillStyle = o.color
  ctx.textAlign = o.align ?? 'left'
  ctx.textBaseline = o.baseline ?? 'middle'
  if (o.tabular) return tabularText(ctx, str, x, y, o.align ?? 'left')
  let s = str
  if (o.maxW !== undefined && ctx.measureText(s).width > o.maxW) {
    const key = `${ctx.font}|${o.maxW}|${str}`
    const hit = ellipsisCache.get(key)
    if (hit !== undefined) s = hit
    else {
      let lo = 0
      let hi = str.length
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (ctx.measureText(`${str.slice(0, mid)}…`).width <= o.maxW) lo = mid
        else hi = mid - 1
      }
      s = `${str.slice(0, lo).trimEnd()}…`
      ellipsisCache.set(key, s)
    }
  }
  ctx.fillText(s, x, y)
  return ctx.measureText(s).width
}

/**
 * Canvas has no font-variant-numeric, so ticking timers would jitter sideways as proportional
 * digits change - lay digits out in fixed cells instead (the CSS mock's tabular-nums).
 */
function tabularText(ctx: Ctx, str: string, x: number, y: number, align: CanvasTextAlign) {
  const cell = ctx.measureText('0').width
  const widths = [...str].map(ch => (ch >= '0' && ch <= '9' ? cell : ctx.measureText(ch).width))
  const total = widths.reduce((a, b) => a + b, 0)
  let cx = align === 'center' ? x - total / 2 : align === 'right' || align === 'end' ? x - total : x
  ctx.textAlign = 'center'
  ;[...str].forEach((ch, i) => {
    ctx.fillText(ch, cx + widths[i] / 2, y)
    cx += widths[i]
  })
  return total
}

export function measure(ctx: Ctx, fonts: Fonts, str: string, size: number, weight = 500) {
  ctx.font = `${weight} ${size}px ${fonts.sans}`
  return ctx.measureText(str).width
}

const pathCache = new Map<string, Path2D[]>()

/**
 * Draws a Tabler icon centred on (cx, cy) at `size` px. `stroke` is in the icon's own 24-unit space
 * (Tabler's default is 2; the sidebar draws its icons at 1.5).
 */
export function icon(
  ctx: Ctx,
  name: IconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
  stroke = 2,
) {
  const data = ICONS[name]
  let paths = pathCache.get(name)
  if (!paths) {
    paths = data.d.map(d => new Path2D(d))
    pathCache.set(name, paths)
  }
  const k = size / data.vb
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(k, k)
  if (data.filled) {
    ctx.fillStyle = color
    for (const p of paths) ctx.fill(p)
  } else {
    ctx.strokeStyle = color
    ctx.lineWidth = stroke
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const p of paths) ctx.stroke(p)
  }
  ctx.restore()
}

// Sprite cache ------------------------------------------------------------------------------------
// Anything static but expensive to paint (blurred text shadows, drop shadows, scaled art) is drawn
// once into an offscreen canvas at the context's current device scale and then just blitted. The
// mock redraws its whole UI whenever something animates, and the capsule titles' shadowBlur alone
// was most of the cost of each redraw.
const sprites = new Map<string, HTMLCanvasElement>()
// Every poster at both card sizes, the banner slides and the inventory art, with room to spare.
const MAX_SPRITES = 160

/**
 * Draws a cached sprite of size w x h (logical px) at (x, y), rendering it with `paint` on first use.
 * `paint` draws in the sprite's own logical space (0,0 is its top-left).
 */
export function sprite(
  ctx: Ctx,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  paint: (c: Ctx) => void,
) {
  const scale = ctx.getTransform().a || 1
  const id = `${key}|${w}x${h}@${scale.toFixed(3)}`
  let cv = sprites.get(id)
  if (!cv) {
    if (sprites.size >= MAX_SPRITES) sprites.delete(sprites.keys().next().value!)
    cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.ceil(w * scale))
    cv.height = Math.max(1, Math.ceil(h * scale))
    const c = cv.getContext('2d')!
    c.setTransform(scale, 0, 0, scale, 0, 0)
    paint(c)
    sprites.set(id, cv)
  }
  ctx.drawImage(cv, x, y, w, h)
}

/** A Steam-header-ratio (460x215) capsule with its title, like the app's GameCard art. */
export function capsule(
  ctx: Ctx,
  fonts: Fonts,
  art: Map<string, HTMLCanvasElement>,
  g: Game,
  x: number,
  y: number,
  w: number,
  opts: { radius?: number; title?: boolean } = {},
) {
  const h = (w * 215) / 460
  const radius = opts.radius ?? 10
  const title = opts.title !== false
  sprite(ctx, `cap:${g.name}:${radius}:${title}`, x, y, w, h, c =>
    paintCapsule(c, fonts, art, g, w, h, radius, title),
  )
  return h
}

function paintCapsule(
  ctx: Ctx,
  fonts: Fonts,
  art: Map<string, HTMLCanvasElement>,
  g: Game,
  w: number,
  h: number,
  radius: number,
  title: boolean,
) {
  ctx.save()
  rr(ctx, 0, 0, w, h, radius)
  ctx.clip()
  const img = art.get(g.name)
  if (img) ctx.drawImage(img, 0, 0, w, h)
  if (title) {
    const px = Math.round(w * 0.085)
    const tf = titleFont(g, px, fonts)
    ctx.font = tf.font
    ctx.letterSpacing = `${tf.tracking}em`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 2
    const label = tf.upper ? g.name.toUpperCase() : g.name
    // two lines max, like the video's 0.95 line-height title block
    const words = label.split(' ')
    const maxW = w * 0.86
    const lines: string[] = []
    let cur = ''
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word
      if (ctx.measureText(next).width > maxW && cur) {
        lines.push(cur)
        cur = word
      } else cur = next
    }
    lines.push(cur)
    const lh = px * 0.98
    const base = h - h * 0.13
    lines
      .slice(-2)
      .forEach((l, i, arr) => ctx.fillText(l, w * 0.07, base - (arr.length - 1 - i) * lh))
    ctx.letterSpacing = '0px'
  }
  ctx.restore()
}

/**
 * Wraps `label` onto at most `maxLines` lines of `maxW`, ellipsising the last one if it still runs
 * over - CSS's `line-clamp`. Measures with whatever font is already set on `ctx`.
 */
export function wrapLines(ctx: Ctx, label: string, maxW: number, maxLines: number) {
  const lines: string[] = []
  let cur = ''
  for (const word of label.split(' ')) {
    const next = cur ? `${cur} ${word}` : word
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur)
      cur = word
    } else cur = next
  }
  lines.push(cur)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1)
  kept[maxLines - 1] = `${last.trimEnd()}…`
  return kept
}

/**
 * A tall (2:3) cover, like the app's default game card style (GamePosterArt.tsx with style
 * 'cover'): the game's poster art with its title treated as key art - a logo in the upper middle.
 * The card's own name label is drawn on top by the caller, as in the real card.
 */
export function poster(
  ctx: Ctx,
  fonts: Fonts,
  posters: Map<string, HTMLCanvasElement>,
  g: Game,
  x: number,
  y: number,
  w: number,
) {
  const h = w * 1.5
  sprite(ctx, `poster:${g.name}`, x, y, w, h, c => paintPoster(c, fonts, posters, g, w, h))
  return h
}

function paintPoster(
  ctx: Ctx,
  fonts: Fonts,
  posters: Map<string, HTMLCanvasElement>,
  g: Game,
  w: number,
  h: number,
) {
  const img = posters.get(g.name)
  if (img) ctx.drawImage(img, 0, 0, w, h)
  const px = Math.round(w * 0.15)
  const tf = titleFont(g, px, fonts)
  ctx.font = tf.font
  ctx.letterSpacing = `${tf.tracking}em`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,.45)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 2
  const lines = wrapLines(ctx, tf.upper ? g.name.toUpperCase() : g.name, w * 0.84, 3)
  const lh = px * 1.02
  const top = h * 0.36 - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * lh))
  ctx.letterSpacing = '0px'
}

/**
 * The Recommended banner's slide art (RecommendedBanner.tsx): the game's wide art cropped to fill
 * the banner, darkened from the left and the bottom so the logo and buttons read over it, with the
 * game's title as its logo.
 */
export function bannerArt(
  ctx: Ctx,
  fonts: Fonts,
  art: Map<string, HTMLCanvasElement>,
  g: Game,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  sprite(ctx, `banner:${g.name}`, x, y, w, h, c => paintBanner(c, fonts, art, g, w, h))
}

function paintBanner(
  ctx: Ctx,
  fonts: Fonts,
  art: Map<string, HTMLCanvasElement>,
  g: Game,
  w: number,
  h: number,
) {
  const img = art.get(g.name)
  if (img) {
    // object-cover: fill the width, crop the art's height around its middle
    const ah = (w * 215) / 460
    ctx.drawImage(img, 0, (h - ah) / 2, w, ah)
  }
  const left = ctx.createLinearGradient(0, 0, w, 0)
  left.addColorStop(0, 'rgba(0,0,0,.85)')
  left.addColorStop(0.5, 'rgba(0,0,0,.35)')
  left.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = left
  ctx.fillRect(0, 0, w, h)
  const bottom = ctx.createLinearGradient(0, h, 0, h / 2)
  bottom.addColorStop(0, 'rgba(0,0,0,.6)')
  bottom.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, h / 2, w, h / 2)
  const px = Math.round(Math.min(h * 0.13, w * 0.04))
  const tf = titleFont(g, px, fonts)
  ctx.font = tf.font
  ctx.letterSpacing = `${tf.tracking}em`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,.75)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 2
  const lines = wrapLines(ctx, tf.upper ? g.name.toUpperCase() : g.name, w * 0.42, 2)
  const lh = px * 1.02
  const pad = Math.round(Math.min(24, w * 0.045))
  const mid = h * 0.52 - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, pad, mid + i * lh))
  ctx.letterSpacing = '0px'
}

/** Shared hit-region record - the mock registers these while drawing, then hit-tests UV clicks. */
export interface Region {
  id: string
  x: number
  y: number
  w: number
  h: number
  onClick?: () => void
  /** drives the hover highlight */
  interactive?: boolean
  /**
   * shows the pointer cursor - false for a region that only reveals things on hover (a game card,
   * whose buttons are what's clickable)
   */
  cursor?: boolean
  /** the game card this region belongs to, when its id doesn't say so itself */
  group?: string
}
