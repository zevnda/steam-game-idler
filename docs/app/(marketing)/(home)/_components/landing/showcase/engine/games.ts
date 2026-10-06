// Fictional games for the 3D app mock - one consistent "demo library" used everywhere the site
// shows the app. Never real games: real capsule art is third-party branding.
//
// Each game's art is an SVG (two-stop gradient + motif) rasterised once into an offscreen canvas,
// then blitted by the UI renderer. Titles are drawn separately with canvas text, because an SVG
// loaded as an <img> is sandboxed and can't see the page's web fonts.

export interface Game {
  name: string
  c: [string, string]
  motif: keyof typeof MOTIFS
  font: 'u' | 'i' | 'w' | 'b'
}

export const GAMES: Game[] = [
  { name: 'Starfall Tactics', c: ['#1b2a6b', '#7b3fd1'], motif: 'stars', font: 'u' },
  { name: 'Neon Drift', c: ['#ff3d8b', '#ff9d3d'], motif: 'synth', font: 'i' },
  { name: 'Hollow Keep', c: ['#0f3b3a', '#071514'], motif: 'peaks', font: 'w' },
  { name: 'Pixel Harvest', c: ['#3fae5a', '#e8d64a'], motif: 'blocks', font: 'u' },
  { name: 'Iron Tide', c: ['#2f4b66', '#0d1620'], motif: 'waves', font: 'i' },
  { name: 'Skyward Isles', c: ['#46c3e8', '#ffc59a'], motif: 'isles', font: 'b' },
  { name: 'Crimson Circuit', c: ['#c3122f', '#2a0710'], motif: 'circuit', font: 'u' },
  { name: 'Deep Signal', c: ['#0b3d4d', '#02141a'], motif: 'rings', font: 'w' },
  { name: 'Frostbound', c: ['#9fd3ff', '#3b6ea8'], motif: 'peaks', font: 'b' },
  { name: 'Ember & Ash', c: ['#ff7a18', '#5a0e0e'], motif: 'embers', font: 'i' },
  { name: 'Orbit Runners', c: ['#5b2bd6', '#1a8cff'], motif: 'orbits', font: 'u' },
  { name: 'Tiny Tavern', c: ['#8a4b22', '#f2b04a'], motif: 'bubbles', font: 'b' },
  { name: 'Voidline', c: ['#120a24', '#6d2ed1'], motif: 'slash', font: 'w' },
  { name: 'Glitch Garden', c: ['#b6f03c', '#ff4fb4'], motif: 'stripes', font: 'u' },
  { name: 'Last Lantern', c: ['#0d1b3d', '#f0a53a'], motif: 'lantern', font: 'b' },
  { name: 'Mossy Kingdom', c: ['#2d6b3b', '#0f2a17'], motif: 'hills', font: 'i' },
]

export const game = (name: string) => GAMES.find(g => g.name === name) ?? GAMES[0]

/** Deterministic pseudo-random in [0,1) - identical to the video engine's, so art matches. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const times = <T>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i))

// Verbatim ports of mock.js's MOTIFS (460x215 SVG fragments).
const MOTIFS = {
  stars: (s: number) =>
    times(
      26,
      i =>
        `<circle cx="${rand(s + i) * 460}" cy="${rand(s + i + 50) * 215}" r="${0.8 + rand(s + i + 9) * 1.8}" fill="#fff" opacity="${0.4 + rand(i) * 0.6}"/>`,
    ).join('') +
    '<circle cx="370" cy="70" r="46" fill="#ffd9a8" opacity=".9"/><circle cx="385" cy="60" r="46" fill="#1b2a6b" opacity=".55"/>',
  synth: () =>
    `<circle cx="330" cy="120" r="70" fill="#ffe66b" opacity=".9"/>${times(4, i => `<rect x="250" y="${118 + i * 16}" width="160" height="${4 + i * 2}" fill="#ff3d8b"/>`).join('')}<path d="M0 150 L460 150 L460 215 L0 215Z" fill="#2a0b3d" opacity=".85"/>${times(9, i => `<path d="M${230 + (i - 4) * 20} 150 L${230 + (i - 4) * 110} 215" stroke="#ff7ad9" stroke-width="1.5" opacity=".7"/>`).join('')}`,
  peaks: () =>
    '<path d="M0 215 L90 90 L150 150 L240 40 L330 140 L390 95 L460 160 L460 215Z" fill="#000" opacity=".35"/><path d="M0 215 L120 130 L200 180 L300 110 L460 200 L460 215Z" fill="#000" opacity=".35"/>',
  blocks: (s: number) =>
    times(
      14,
      i =>
        `<rect x="${i * 34}" y="${150 - Math.round(rand(s + i) * 3) * 22}" width="34" height="120" fill="#1f6b33" opacity=".55"/>`,
    ).join(''),
  waves: () =>
    times(
      4,
      i =>
        `<path d="M0 ${120 + i * 26} Q 57 ${100 + i * 26} 115 ${120 + i * 26} T 230 ${120 + i * 26} T 345 ${120 + i * 26} T 460 ${120 + i * 26} V215 H0Z" fill="#9cc7ea" opacity="${0.12 + i * 0.05}"/>`,
    ).join(''),
  isles: () =>
    '<ellipse cx="120" cy="80" rx="70" ry="16" fill="#fff" opacity=".75"/><path d="M60 80 Q120 150 180 80Z" fill="#7a5a3c" opacity=".6"/><ellipse cx="350" cy="120" rx="50" ry="12" fill="#fff" opacity=".7"/><path d="M300 120 Q350 175 400 120Z" fill="#7a5a3c" opacity=".55"/>',
  circuit: (s: number) =>
    times(9, i => {
      const y = 20 + i * 22
      const x = 200 + rand(s + i) * 200
      return `<path d="M${x} ${y} H460 M${x} ${y} l-20 20" stroke="#ff8a9c" stroke-width="2" opacity=".45" fill="none"/><circle cx="${x}" cy="${y}" r="3.5" fill="#ffd0d7" opacity=".7"/>`
    }).join(''),
  rings: () =>
    times(
      5,
      i =>
        `<circle cx="360" cy="100" r="${(i + 1) * 26}" fill="none" stroke="#57e0ff" stroke-width="2" opacity="${0.6 - (i + 1) * 0.1}"/>`,
    ).join(''),
  embers: (s: number) =>
    times(
      30,
      i =>
        `<circle cx="${rand(s + i) * 460}" cy="${rand(s + i + 30) * 215}" r="${1 + rand(s + i + 7) * 2.5}" fill="#ffd27a" opacity="${0.3 + rand(i + 3) * 0.6}"/>`,
    ).join(''),
  orbits: () =>
    `<circle cx="340" cy="100" r="26" fill="#fff" opacity=".85"/>${[60, 90].map((r, i) => `<ellipse cx="340" cy="100" rx="${r + 30}" ry="${r / 3}" fill="none" stroke="#fff" stroke-width="2" opacity=".4" transform="rotate(${-15 + i * 25} 340 100)"/>`).join('')}`,
  bubbles: (s: number) =>
    times(
      8,
      i =>
        `<circle cx="${250 + rand(s + i) * 200}" cy="${30 + rand(s + i + 4) * 150}" r="${10 + rand(s + i + 2) * 22}" fill="#fff3d6" opacity=".22"/>`,
    ).join(''),
  slash: () =>
    '<path d="M240 215 L420 0 L460 0 L280 215Z" fill="#b388ff" opacity=".5"/><path d="M300 215 L460 30 L460 70 L335 215Z" fill="#fff" opacity=".25"/>',
  stripes: () =>
    times(
      8,
      i =>
        `<rect x="${i * 60 - 20}" y="${(i % 3) * 8}" width="26" height="215" fill="#fff" opacity=".16" transform="skewX(-18)"/>`,
    ).join(''),
  lantern: () =>
    '<circle cx="350" cy="95" r="70" fill="#ffcf6b" opacity=".25"/><circle cx="350" cy="95" r="34" fill="#ffd98a" opacity=".6"/><rect x="336" y="70" width="28" height="44" rx="6" fill="#fff4d0" opacity=".9"/>',
  hills: () =>
    '<circle cx="100" cy="60" r="30" fill="#e9ffc2" opacity=".35"/><path d="M0 215 Q120 110 250 170 T460 140 V215Z" fill="#6fbf5a" opacity=".45"/><path d="M0 215 Q180 150 300 200 T460 190 V215Z" fill="#0a2012" opacity=".6"/>',
}

/** Title treatment per game (mock.js TITLE_FONTS), resolved against the loaded font families. */
export function titleFont(g: Game, px: number, fonts: { sans: string; display: string }) {
  switch (g.font) {
    case 'u':
      return { font: `800 ${px}px ${fonts.display}`, upper: true, tracking: -0.01 }
    case 'i':
      return { font: `italic 900 ${px}px ${fonts.sans}`, upper: true, tracking: -0.02 }
    case 'w':
      return {
        font: `400 ${Math.round(px * 0.73)}px ${fonts.display}`,
        upper: true,
        tracking: 0.14,
      }
    default:
      return { font: `800 ${px}px ${fonts.sans}`, upper: false, tracking: -0.02 }
  }
}

function artSVG(g: Game) {
  const seed = g.name.length * 7 + g.name.charCodeAt(0)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 215" width="460" height="215">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.c[0]}"/><stop offset="1" stop-color="${g.c[1]}"/></linearGradient></defs>
    <rect width="460" height="215" fill="url(#g)"/>${MOTIFS[g.motif](seed)}</svg>`
}

/**
 * Rasterises every game's capsule art (460x215 at `scale`). Resolves once all are decoded; any
 * single failure falls back to a flat gradient so one bad decode can't blank the whole mock.
 */
export async function loadGameArt(scale: number, yieldToMain?: () => Promise<void>) {
  const out = new Map<string, HTMLCanvasElement>()
  // one game per task, so decoding + rasterising 16 SVGs never blocks as a single long task
  for (const g of GAMES) {
    await (async () => {
      const cv = document.createElement('canvas')
      cv.width = Math.round(460 * scale)
      cv.height = Math.round(215 * scale)
      const ctx = cv.getContext('2d')!
      try {
        const img = new Image()
        img.decoding = 'async'
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artSVG(g))}`
        await img.decode()
        ctx.drawImage(img, 0, 0, cv.width, cv.height)
      } catch {
        const grad = ctx.createLinearGradient(0, 0, cv.width, cv.height)
        grad.addColorStop(0, g.c[0])
        grad.addColorStop(1, g.c[1])
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, cv.width, cv.height)
      }
      out.set(g.name, cv)
    })()
    await yieldToMain?.()
  }
  return out
}
