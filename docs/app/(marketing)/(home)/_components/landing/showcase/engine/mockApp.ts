// The interactive SGI desktop-app mock that lives on the 3D window's screen.
//
// It's an immediate-mode canvas UI: every redraw paints the whole 1440x900 window (titlebar,
// sidebar, the active page) and re-registers hit regions as it goes; the stage maps a raycast's UV
// to these logical pixels and calls `pointer()`/`click()`. Layout and wording mirror the real app
// (sidebar = src/shared/components/dashboard/Sidebar.tsx, strings from src/i18n/locales/en-US.json)
// in a simplified "product demo" style - bigger type, fewer controls.
//
// Each automation page runs a small live simulation (drops, unlocks, idle timers). Real Steam card
// drops and the unlocker's delays take minutes, so every sim here runs far faster than the real
// thing.
//
// Redraws are dirty-driven, not per frame: uploading a ~2k canvas texture every frame would be
// wasteful, so the stage only re-uploads when `update()` reports a change.

import type { Ctx, Fonts, Region } from './draw'
import type { Game } from './games'
import type { IconName } from './icons'
import type { Palette, ThemeId } from './palette'
import type { PageId } from './types'
import { capsule, fillRR, icon, measure, rr, sprite, strokeRR, text } from './draw'
import { game, GAMES } from './games'
import { THEMES } from './palette'

/**
 * The mock's window geometry. `wide` is the desktop app as people see it (1440x900, full sidebar).
 * `compact` is the same app in a narrow portrait window (560x960): the sidebar collapsed to its
 * icon rail - what the real app's sidebar toggle does - with grids reflowed to two or three
 * columns. Phones and portrait tablets get compact, so the UI is drawn about twice as large
 * relative to their screen and shown whole instead of a cropped, unreadable desktop window.
 */
export interface MockLayout {
  compact: boolean
  /** window size, UI px */
  W: number
  H: number
  /** titlebar height, sidebar width */
  TB: number
  SB: number
  /** content area: left/top edge, width, right edge */
  X0: number
  Y0: number
  CW: number
  XR: number
}

export function mockLayout(compact: boolean) {
  const W = compact ? 560 : 1440
  const H = compact ? 960 : 900
  const TB = compact ? 52 : 56
  const SB = compact ? 64 : 256
  const pad = compact ? 18 : 30
  const X0 = SB + pad
  const L: MockLayout = {
    compact,
    W,
    H,
    TB,
    SB,
    X0,
    Y0: TB + (compact ? 18 : 22),
    CW: W - SB - pad * 2,
    XR: W - pad,
  }
  return L
}

export interface MockStats {
  cardsDropped: number
  achievementsUnlocked: number
  gamesIdling: number
  itemsListed: number
}

export interface MockEvents {
  /** a trading card dropped - `at` is where it should leave the screen, in UI px */
  cardDrop(at: [number, number], g: Game): void
  achievement(at: [number, number]): void
  coins(at: [number, number]): void
  confetti(at: [number, number]): void
  /** the app navigated; `byUser` = a click inside the mock (vs. the scroll story) */
  navigate(page: PageId, byUser: boolean): void
  stats(s: MockStats): void
  /** a titlebar window button was pressed */
  windowButton(kind: 'min' | 'max' | 'close'): void
}

type Owner = 'manual' | 'farm' | 'unl' | 'auto'

interface FarmSlot {
  game: string
  total: number
  left: number
  next: number
  /** last drop time, for the bar tween */
  dropT: number
  doneT: number
}

interface FeedRow {
  name: string
  clock: string
  t: number
  icon: number
}

interface Ach {
  name: string
  desc: string
  pct: string
  unlocked: boolean
  selected: boolean
  flipT: number
}

interface InvItem {
  name: string
  type: string
  kind: 'card' | 'bg' | 'emote'
  game: string
  price: string
  selected: boolean
  listedT: number
}

const NAV: [string, [PageId, string, IconName][]][] = [
  [
    'Games',
    [
      ['games', 'Games', 'games'],
      ['idling', 'Idling', 'idling'],
      ['favorites', 'Favorites', 'favorites'],
      ['freeGames', 'Free Games', 'freeGames'],
    ],
  ],
  [
    'Automation',
    [
      ['cardFarming', 'Card Farming', 'cardFarming'],
      ['achievementUnlocker', 'Achievement Unlocker', 'achievementUnlocker'],
      ['autoIdle', 'Automatic Idler', 'autoIdle'],
    ],
  ],
  ['Misc', [['inventory', 'Inventory Manager', 'inventory']]],
]

const REC = ['Starfall Tactics', 'Neon Drift', 'Hollow Keep']
const ALL = GAMES.map(g => g.name).filter(n => !REC.includes(n))
const FAVORITES = ['Neon Drift', 'Skyward Isles', 'Tiny Tavern']
const AUTO_IDLE = ['Iron Tide', 'Mossy Kingdom', 'Voidline']
const FARM_POOL = [
  'Starfall Tactics',
  'Skyward Isles',
  'Crimson Circuit',
  'Orbit Runners',
  'Frostbound',
  'Tiny Tavern',
  'Deep Signal',
  'Mossy Kingdom',
]
const UNL_GAMES = ['Starfall Tactics', 'Hollow Keep', 'Skyward Isles', 'Glitch Garden']
const UNL_NAMES = [
  'First Contact',
  'Star Cartographer',
  'Hold the Line',
  'Night Shift',
  'Master Tactician',
  'Supply Run',
  'Ace Pilot',
  'Long Haul',
  'Diplomat',
  'Untouchable',
  'Flawless Victory',
  'Deep Space',
]
const FREE_GAMES = ['Last Lantern', 'Glitch Garden', 'Ember & Ash']
const MGR_ACHS: [string, string, string, boolean][] = [
  ['Green Thumb', 'Harvest your first crop', '71.4%', true],
  ['Early Riser', 'Start a day before 6 AM', '52.0%', true],
  ['Master Farmer', 'Reach farming level 10', '18.3%', false],
  ['Festival Champion', 'Win the harvest festival', '9.6%', false],
  ['Well Travelled', 'Visit every region', '6.2%', false],
  ['Perfectionist', 'Earn every other achievement', '1.8%', false],
]
const INV: [string, string, InvItem['kind'], string, string][] = [
  ['Vanguard', 'Starfall Tactics Trading Card', 'card', 'Starfall Tactics', '$0.09'],
  ['Neon Skyline', 'Neon Drift Profile Background', 'bg', 'Neon Drift', '$0.14'],
  [':driftgrin:', 'Neon Drift Emoticon', 'emote', 'Neon Drift', '$0.06'],
  ['Harvest Moon', 'Pixel Harvest Trading Card', 'card', 'Pixel Harvest', '$0.11'],
  ['The Keep', 'Hollow Keep Trading Card', 'card', 'Hollow Keep', '$0.08'],
  ['Circuit Board', 'Crimson Circuit Profile Background', 'bg', 'Crimson Circuit', '$0.21'],
  ['Lantern Light', 'Last Lantern Trading Card', 'card', 'Last Lantern', '$0.07'],
  ['Skyward Isles', 'Skyward Isles Trading Card', 'card', 'Skyward Isles', '$0.10'],
  [':embercat:', 'Ember & Ash Emoticon', 'emote', 'Ember & Ash', '$0.05'],
  ['Orbit', 'Orbit Runners Trading Card', 'card', 'Orbit Runners', '$0.12'],
  ['Deep Blue', 'Deep Signal Profile Background', 'bg', 'Deep Signal', '$0.18'],
  ['Frost Giant', 'Frostbound Trading Card', 'card', 'Frostbound', '$0.09'],
  ['Night Market', 'Tiny Tavern Profile Background', 'bg', 'Tiny Tavern', '$0.16'],
  ['Pathfinder', 'Iron Tide Trading Card', 'card', 'Iron Tide', '$0.08'],
  [':voidcat:', 'Voidline Emoticon', 'emote', 'Voidline', '$0.04'],
  ['Bloom', 'Glitch Garden Trading Card', 'card', 'Glitch Garden', '$0.13'],
  ['Old Growth', 'Mossy Kingdom Trading Card', 'card', 'Mossy Kingdom', '$0.07'],
  ['Wildfire', 'Ember & Ash Profile Background', 'bg', 'Ember & Ash', '$0.19'],
]
const ACCOUNTS: [string, string, string][] = [
  ['Idler', 'Signed in with Steam', '#5b8cff,#b35bff'],
  ['Pixel', 'Local Steam client', '#3fd18a,#1a8cff'],
]

/** [x, y, w, h] in UI px */
export type Rect = [number, number, number, number]

function unionRect(a: Rect, b: Rect) {
  const x = Math.min(a[0], b[0])
  const y = Math.min(a[1], b[1])
  const r: Rect = [
    x,
    y,
    Math.max(a[0] + a[2], b[0] + b[2]) - x,
    Math.max(a[1] + a[3], b[1] + b[3]) - y,
  ]
  return r
}

/**
 * Switch for the scripted demo steps for passive visitors (auto-starting farming / the unlocker,
 * auto-ticking achievements, auto-listing items, auto-playing games). When false, every page
 * sits idle until the visitor clicks.
 */
const AUTO_DEMO = false

const ease = {
  out: (p: number) => 1 - (1 - p) ** 3,
  out5: (p: number) => 1 - (1 - p) ** 5,
  io: (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
  back: (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2,
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const prog = (now: number, t0: number, dur: number) => clamp01((now - t0) / dur)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const randIn = (a: number, b: number) => a + Math.random() * (b - a)
const hms = (s: number) =>
  [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':')

export class MockApp {
  readonly canvas: HTMLCanvasElement
  private ctx: Ctx
  private pal: Palette
  private regions: Region[] = []
  private collect = true
  private hover: string | null = null
  /** a full redraw + full texture upload is needed (state changed somewhere unknown) */
  private dirty = true
  /**
   * Running animations. One with a `rect` only changes pixels inside it, so the stage can upload
   * just that region; one without forces a full upload. See update().
   */
  private anims: { until: number; rect: Rect | null }[] = []
  private lastSecond = -1
  private now = 0

  page: PageId = 'games'
  private prevPage: PageId = 'games'
  private pageT = -10
  private navFromY = 0
  private navToY = 0

  private user = 0
  private acctOpen = false
  private acctT = 0
  private toastMsg: { text: string; icon: IconName; color: string; t: number } | null = null
  private bumpT = -10

  // sims ----------------------------------------------------------------------------------------
  private idle = new Map<string, { owner: Owner; start: number }>()
  private farm = {
    running: false,
    startT: 0,
    slots: [] as FarmSlot[],
    queue: [] as string[],
    dropped: 0,
    startAt: 0,
  }
  private unl = {
    running: false,
    gameIdx: 0,
    total: 40,
    done: 16,
    next: 0,
    feed: [] as FeedRow[],
    clockMin: 0,
    nameIdx: 0,
  }
  /** achievements unlocked this visit, by the unlocker or the manager */
  private achUnlocked = 0
  private mgr = { game: 'Pixel Harvest', achs: [] as Ach[], applyT: -10 }
  private inv = { items: [] as InvItem[], listed: 0 }
  private free = { idx: 0, claimedT: -1 }
  /** timed demo steps for passive visitors - cancelled the moment the user clicks the mock */
  private demo: { t: number; run: () => void }[] = []
  private demoCancelled = new Set<PageId>()
  private visited = new Set<PageId>()

  /** this instance's window geometry (see mockLayout) */
  readonly L: MockLayout

  constructor(
    private fonts: Fonts,
    private art: Map<string, HTMLCanvasElement>,
    private scale: number,
    private events: MockEvents,
    compact = false,
  ) {
    this.L = mockLayout(compact)
    this.canvas = document.createElement('canvas')
    this.canvas.width = Math.round(this.L.W * scale)
    this.canvas.height = Math.round(this.L.H * scale)
    this.ctx = this.canvas.getContext('2d')!
    this.pal = THEMES.default.palette
    this.resetMgr()
    this.resetInv()
    const now = performance.now() / 1000
    // a couple of games already idling via the Automatic Idler, so the Idling page is never empty
    AUTO_IDLE.slice(0, 2).forEach((g, i) =>
      this.idle.set(g, { owner: 'auto', start: now - 3600 * (2 + i) - 1234 * i }),
    )
    const d = new Date()
    this.unl.clockMin = d.getHours() * 60 + d.getMinutes()
    this.navFromY = this.navToY = this.navY('games')
  }

  // public API -----------------------------------------------------------------------------------

  /**
   * Paints the opening page's sprites (every capsule at the sizes the Games page uses) a few per
   * task, so the first full frame is cheap blits instead of one long blocking draw.
   */
  async warm(yieldToMain: () => Promise<void>) {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)
    const recW = this.L.compact ? (this.L.CW - 14) / 2 : 360
    const allW = this.L.compact ? recW : 208
    const jobs: [string, number][] = [
      ...REC.map(n => [n, recW] as [string, number]),
      ...ALL.map(n => [n, allW] as [string, number]),
    ]
    for (let i = 0; i < jobs.length; i++) {
      // drawn off-canvas: only the sprite cache side effect matters
      capsule(this.ctx, this.fonts, this.art, game(jobs[i][0]), -2000, -2000, jobs[i][1])
      if (i % 3 === 2) await yieldToMain()
    }
  }

  setTheme(id: ThemeId) {
    this.pal = THEMES[id].palette
    this.dirty = true
  }

  get palette() {
    return this.pal
  }

  /** Navigate the mock. The scroll story calls this with byUser=false. */
  navigate(page: PageId, byUser = false) {
    if (page === this.page) return
    this.prevPage = this.page
    this.page = page
    this.pageT = this.now
    this.navFromY = this.navToY
    this.navToY = this.navY(page === 'achievementManager' ? 'games' : page)
    this.acctOpen = false
    this.hover = null
    this.anim(0.4)
    this.onEnterPage(page, byUser)
    this.events.navigate(page, byUser)
  }

  /** Pointer moved over the screen (UI px) - returns whether it's over something clickable. */
  pointer(x: number, y: number | null): boolean {
    const r = y === null ? null : this.hit(x, y)
    const id = r?.interactive ? r.id : null
    if (id !== this.hover) {
      this.hover = id
      this.dirty = true
    }
    return id !== null
  }

  click(x: number, y: number): boolean {
    const r = this.hit(x, y)
    this.demoCancelled.add(this.page)
    this.demo = []
    if (this.acctOpen && r?.id !== 'acct' && !r?.id.startsWith('acct-')) {
      this.acctOpen = false
      this.dirty = true
    }
    if (!r?.onClick) return false
    r.onClick()
    this.dirty = true
    return true
  }

  /** Where a 3D "click me" beacon should hover (UI px rect), or null. */
  beacon(): [number, number, number, number] | null {
    if (this.page === 'cardFarming' && !this.farm.running) return this.regionRect('farm-start')
    if (this.page === 'freeGames' && this.free.claimedT < 0) return this.regionRect('free-claim')
    if (
      this.page === 'achievementManager' &&
      !this.mgr.achs.some(a => a.selected) &&
      this.now - this.mgr.applyT > 3
    )
      return this.regionRect('mgr-cb-2')
    if (this.page === 'inventory' && !this.inv.items.some(i => i.selected || i.listedT > 0))
      return this.regionRect('inv-cb-3')
    return null
  }

  /**
   * Advances sims and redraws if anything is visibly changing. Returns what the stage must
   * re-upload: 'full', just a dirty rect (UI px) when only localised animations ran, or null.
   */
  update(now: number): Rect | 'full' | null {
    this.now = now
    this.runDemo(now)
    this.stepFarm(now)
    this.stepUnlocker(now)
    const sec = Math.floor(now)
    const ticking =
      this.idle.size > 0 && ['games', 'idling', 'favorites', 'autoIdle'].includes(this.page)
    if (ticking && sec !== this.lastSecond) this.dirty = true
    this.lastSecond = sec
    // An animation that just ended still needs one last frame to land on its final state.
    const live = this.anims.filter(a => a.until > now)
    const settling = this.anims.filter(a => a.until <= now)
    this.anims = live
    const touched = [...live, ...settling]
    if (!this.dirty && !touched.length) return null
    const full = this.dirty || touched.some(a => !a.rect)
    this.dirty = false
    this.draw()
    if (full) return 'full'
    return touched.reduce<Rect>((u, a) => unionRect(u, a.rect!), touched[0].rect!)
  }

  // internals --------------------------------------------------------------------------------------

  /** Keep redrawing for `dur` seconds; pass `rect` when the animation only touches that area. */
  private anim(dur: number, rect?: Rect) {
    this.anims.push({ until: this.now + dur, rect: rect ?? null })
  }

  private toast(text: string, iconName: IconName = 'check', color = this.pal.success) {
    this.toastMsg = { text, icon: iconName, color, t: this.now }
    // covers the slide-in and the fade-out; toasts live in the bottom-right corner
    this.anim(3.05, [this.L.W - 620, this.L.H - 110, 620, 110])
  }

  private emitStats() {
    this.events.stats({
      cardsDropped: this.farm.dropped,
      achievementsUnlocked: this.achUnlocked,
      gamesIdling: this.idle.size,
      itemsListed: this.inv.listed,
    })
  }

  private hit(x: number, y: number) {
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i]
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r
    }
    return null
  }

  private regionRect(id: string): [number, number, number, number] | null {
    const r = this.regions.find(q => q.id === id)
    return r ? [r.x, r.y, r.w, r.h] : null
  }

  private region(id: string, x: number, y: number, w: number, h: number, onClick?: () => void) {
    if (this.collect) this.regions.push({ id, x, y, w, h, onClick, interactive: Boolean(onClick) })
  }

  private hovered(id: string) {
    return this.collect && this.hover === id
  }

  /** Steps queued for passive visitors; skipped entirely once someone clicks on that page. */
  private schedule(page: PageId, delay: number, run: () => void) {
    if (this.demoCancelled.has(page)) return
    this.demo.push({
      t: this.now + delay,
      run: () => this.page === page && !this.demoCancelled.has(page) && run(),
    })
  }

  private runDemo(now: number) {
    if (!this.demo.length) return
    const due = this.demo.filter(d => d.t <= now)
    if (!due.length) return
    this.demo = this.demo.filter(d => d.t > now)
    due.forEach(d => d.run())
  }

  /**
   * Whether the window is docked and the camera has finished moving (set by the stage). The
   * auto-demo only starts once it is - it shouldn't kick off while the window is still rising
   * into place - and is called off if the visitor scrolls away first.
   */
  setSettled(on: boolean) {
    if (on === this.settled) return
    this.settled = on
    if (on) {
      const page = this.pendingDemo
      this.pendingDemo = null
      if (page && page === this.page) this.onEnterPage(page, false)
    } else if (this.demo.length) {
      // left before the scripted steps ran: re-arm them for the next time it settles
      this.demo = []
      this.visited.delete(this.page)
      this.pendingDemo = this.page
    }
  }

  private settled = false
  private pendingDemo: PageId | null = null

  private onEnterPage(page: PageId, byUser: boolean) {
    this.demo = []
    if (!byUser && AUTO_DEMO && !this.settled) {
      // not in place yet: hold the demo until setSettled(true)
      this.pendingDemo = page
      return
    }
    this.pendingDemo = null
    const first = !this.visited.has(page)
    this.visited.add(page)
    if (byUser || !AUTO_DEMO) return
    if (page === 'cardFarming' && !this.farm.running && first)
      this.schedule(page, 0.3, () => this.startFarm())
    if (page === 'achievementUnlocker' && !this.unl.running && first)
      this.schedule(page, 0.9, () => this.startUnlocker())
    if (page === 'achievementManager' && first) {
      ;[2, 3, 4].forEach((i, k) => this.schedule(page, 2.4 + k * 0.45, () => this.toggleSelect(i)))
      this.schedule(page, 4.1, () => this.applyMgr())
    }
    if (page === 'inventory' && first) {
      ;[3, 4, 5].forEach((i, k) => this.schedule(page, 2.4 + k * 0.4, () => this.toggleInv(i)))
      this.schedule(page, 3.9, () => this.listSelected())
    }
    if (page === 'idling' && first && ![...this.idle.values()].some(v => v.owner === 'manual')) {
      REC.forEach((g, k) => this.schedule(page, 1.2 + k * 0.5, () => this.toggleIdle(g)))
    }
  }

  // --- sims

  private toggleIdle(name: string) {
    if (this.idle.has(name)) this.idle.delete(name)
    else this.idle.set(name, { owner: 'manual', start: this.now })
    this.anim(0.4)
    this.emitStats()
  }

  private startFarm() {
    const f = this.farm
    f.running = true
    f.startT = this.now
    if (!f.slots.length) {
      f.slots = FARM_POOL.slice(0, 4).map((g, i) => this.newSlot(g, i))
      f.queue = FARM_POOL.slice(4)
    }
    f.slots.forEach(s => {
      this.idle.set(s.game, { owner: 'farm', start: this.now })
      s.next = this.now + randIn(1.2, 3.4)
    })
    this.anim(0.5)
    this.emitStats()
  }

  private stopFarm() {
    this.farm.running = false
    for (const [g, v] of this.idle) if (v.owner === 'farm') this.idle.delete(g)
    this.anim(0.4)
    this.emitStats()
  }

  private newSlot(g: string, i: number): FarmSlot {
    const total = [4, 3, 5, 3, 2, 6, 3, 4][(FARM_POOL.indexOf(g) + i) % 8]
    return { game: g, total, left: total, next: this.now + randIn(1.5, 4), dropT: -10, doneT: -1 }
  }

  private stepFarm(now: number) {
    const f = this.farm
    if (!f.running) return
    f.slots.forEach((s, i) => {
      if (s.doneT >= 0) {
        // finished game rotates to the back of the queue and the next one starts
        if (now - s.doneT > 1.8) {
          this.idle.delete(s.game)
          f.queue.push(s.game)
          const next = f.queue.shift()!
          f.slots[i] = this.newSlot(next, i + f.dropped)
          this.idle.set(next, { owner: 'farm', start: now })
          // farming keeps running in the background; only redraw if this is actually on screen
          if (this.page === 'cardFarming') this.anim(0.5)
          else if (this.page === 'idling') this.dirty = true
        }
        return
      }
      if (now < s.next) return
      s.left -= 1
      s.dropT = now
      s.next = now + randIn(2.2, 5.6)
      f.dropped += 1
      if (s.left === 0) s.doneT = now
      // only this slot's card changes (bar, count, the capsule's little kick)
      if (this.page === 'cardFarming') this.anim(0.6, this.farmCardRect(i))
      const g = game(s.game)
      // Only launch a physical card while the farming page is on screen. Farming keeps running in
      // the background (like the real app), but cards streaming out of the sidebar would fly
      // across the playground's copy beside the window.
      if (this.page === 'cardFarming') this.events.cardDrop(this.farmCardCentre(i), g)
      this.emitStats()
    })
  }

  private startUnlocker() {
    const u = this.unl
    u.running = true
    u.next = this.now + randIn(0.8, 1.6)
    this.idle.set(UNL_GAMES[u.gameIdx], { owner: 'unl', start: this.now })
    this.anim(0.4)
    this.emitStats()
  }

  private stopUnlocker() {
    this.unl.running = false
    for (const [g, v] of this.idle) if (v.owner === 'unl') this.idle.delete(g)
    this.anim(0.4)
    this.emitStats()
  }

  private stepUnlocker(now: number) {
    const u = this.unl
    if (!u.running || now < u.next) return
    // uneven gaps on purpose: the real unlocker waits a random delay between unlocks
    u.next = now + randIn(1.4, 4.4)
    u.clockMin += Math.round(randIn(1, 11))
    const h = Math.floor(u.clockMin / 60) % 24
    const m = u.clockMin % 60
    u.feed.unshift({
      name: UNL_NAMES[u.nameIdx % UNL_NAMES.length],
      clock: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      t: now,
      icon: u.nameIdx,
    })
    u.feed.length = Math.min(u.feed.length, 6)
    u.nameIdx += 1
    u.done += 1
    this.achUnlocked += 1
    if (u.done >= u.total) {
      this.idle.delete(UNL_GAMES[u.gameIdx])
      u.gameIdx = (u.gameIdx + 1) % UNL_GAMES.length
      u.done = 4
      u.total = 24 + (u.gameIdx % 3) * 8
      this.idle.set(UNL_GAMES[u.gameIdx], { owner: 'unl', start: now })
      if (this.page === 'idling') this.dirty = true
    }
    // the current-game card + the feed; nothing else on screen changes
    if (this.page === 'achievementUnlocker')
      this.anim(0.7, [this.L.X0, this.L.Y0 + 90, this.L.CW, this.L.H - this.L.Y0 - 90])
    this.events.achievement(
      this.page === 'achievementUnlocker'
        ? this.unlFeedPoint()
        : this.navCentre('achievementUnlocker'),
    )
    this.emitStats()
  }

  private resetMgr() {
    this.mgr.achs = MGR_ACHS.map(([name, desc, pct, unlocked]) => ({
      name,
      desc,
      pct,
      unlocked,
      selected: false,
      flipT: -10,
    }))
  }

  private toggleSelect(i: number) {
    const a = this.mgr.achs[i]
    a.selected = !a.selected
    this.anim(0.3)
  }

  private flipAch(i: number, delay: number) {
    const a = this.mgr.achs[i]
    a.unlocked = !a.unlocked
    a.selected = false
    a.flipT = this.now + delay
    if (a.unlocked) {
      this.achUnlocked += 1
      const at: [number, number] = [this.mgrIconX(), this.mgrRowY(i) + (this.L.compact ? 36 : 39)]
      window.setTimeout(() => this.events.achievement(at), delay * 1000)
    }
    this.emitStats()
    this.anim(delay + 0.6)
  }

  private applyMgr() {
    const sel = this.mgr.achs.map((a, i) => (a.selected ? i : -1)).filter(i => i >= 0)
    if (!sel.length) return
    sel.forEach((i, k) => this.flipAch(i, k * 0.14))
    this.mgr.applyT = this.now
    this.emitStats()
  }

  private resetInv() {
    this.inv.items = INV.map(([name, type, kind, g, price]) => ({
      name,
      type,
      kind,
      game: g,
      price,
      selected: false,
      listedT: -1,
    }))
  }

  private toggleInv(i: number) {
    const it = this.inv.items[i]
    if (it.listedT >= 0) return
    it.selected = !it.selected
    this.anim(0.3)
  }

  private listSelected() {
    const sel = this.inv.items.filter(i => i.selected)
    if (!sel.length) return
    sel.forEach((it, k) => {
      it.selected = false
      it.listedT = this.now + 0.35 + k * 0.35
      const idx = this.inv.items.indexOf(it)
      window.setTimeout(
        () => {
          this.inv.listed += 1
          this.events.coins(this.invPriceCentre(idx))
          this.emitStats()
        },
        (0.35 + k * 0.35) * 1000,
      )
    })
    window.setTimeout(
      () => this.toast(`${sel.length} ${sel.length === 1 ? 'item' : 'items'} listed`, 'tag'),
      (0.45 + sel.length * 0.35) * 1000,
    )
    this.anim(0.6 + sel.length * 0.35)
  }

  // --- geometry helpers (shared by drawing and event emission)

  private navY(page: PageId) {
    const { compact, TB } = this.L
    // wide: section headers + labelled rows; compact: just the icon rail, sections split by a gap
    let y = TB + (compact ? 14 : 30)
    for (const [, items] of NAV) {
      if (!compact) y += 20
      for (const [id] of items) {
        if (id === page) return y
        y += compact ? 46 : 43
      }
      y += compact ? 14 : 18
    }
    return TB + 50
  }

  private navCentre(page: PageId): [number, number] {
    return this.L.compact ? [32, this.navY(page) + 21] : [60, this.navY(page) + 20]
  }

  /** card farming's running slots: four in a row (wide) or a 2x2 grid (compact) */
  private farmCardBox(i: number) {
    const { X0, Y0, CW, compact } = this.L
    if (compact) {
      const w = (CW - 14) / 2
      const capH = ((w - 28) * 215) / 460
      const h = 14 + capH + 98
      return { x: X0 + (i % 2) * (w + 14), y: Y0 + 154 + Math.floor(i / 2) * (h + 14), w, h }
    }
    const w = (CW - 3 * 16) / 4
    return { x: X0 + i * (w + 16), y: Y0 + 118, w, h: 230 }
  }

  private farmCardRect(i: number): Rect {
    const b = this.farmCardBox(i)
    return [b.x - 4, b.y - 18, b.w + 8, b.h + 30]
  }

  private farmCardCentre(i: number): [number, number] {
    const b = this.farmCardBox(i)
    const pad = this.L.compact ? 14 : 16
    return [b.x + b.w / 2, b.y + pad + ((b.w - pad * 2) * 215) / 460 / 2]
  }

  private mgrRowY(i: number) {
    return this.L.compact ? this.L.Y0 + 206 + i * 80 : this.L.Y0 + 150 + 56 + i * 86
  }

  /** centre x of an achievement row's icon */
  private mgrIconX() {
    return this.L.compact ? this.L.X0 + 72 : this.L.X0 + 92
  }

  private invPriceCentre(i: number): [number, number] {
    const G = this.invGrid()
    const row = Math.floor(i / G.cols)
    return [G.x(i % G.cols) + G.w / 2, G.top + row * G.rowH + G.cardH - 25]
  }

  // drawing ----------------------------------------------------------------------------------------

  private draw() {
    const { ctx, pal } = this
    this.regions = []
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)
    ctx.clearRect(0, 0, this.L.W, this.L.H)
    // window body, with the frameless window's rounded corners left transparent
    ctx.save()
    rr(ctx, 0, 0, this.L.W, this.L.H, 14)
    ctx.clip()
    ctx.fillStyle = pal.background
    ctx.fillRect(0, 0, this.L.W, this.L.H)

    // content (clipped to its own area so tall pages read as scrollable)
    ctx.save()
    ctx.beginPath()
    ctx.rect(this.L.SB, this.L.TB, this.L.W - this.L.SB, this.L.H - this.L.TB)
    ctx.clip()
    const p = prog(this.now, this.pageT, 0.32)
    if (p < 1 && this.prevPage !== this.page) {
      this.collect = false
      ctx.globalAlpha = 1 - ease.out(p)
      this.drawPage(this.prevPage)
      this.collect = true
    }
    ctx.globalAlpha = ease.out(p)
    ctx.save()
    ctx.translate(0, (1 - ease.out5(p)) * 14)
    this.drawPage(this.page)
    ctx.restore()
    ctx.globalAlpha = 1
    ctx.restore()

    this.drawSidebar()
    this.drawTitlebar()
    this.drawAccountPopover()
    this.drawToast()
    ctx.restore()
    // hairline frame, like the real window's 1px edge
    strokeRR(ctx, 0, 0, this.L.W, this.L.H, 14, 'rgba(255,255,255,0.09)', 1.5)
  }

  private drawPage(page: PageId) {
    switch (page) {
      case 'games':
        return this.drawGames()
      case 'idling':
        return this.drawIdling()
      case 'favorites':
        return this.drawFavorites()
      case 'freeGames':
        return this.drawFree()
      case 'cardFarming':
        return this.farm.running ? this.drawFarmRun() : this.drawFarmIdle()
      case 'achievementUnlocker':
        return this.drawUnlocker()
      case 'autoIdle':
        return this.drawAutoIdle()
      case 'inventory':
        return this.drawInventory()
      case 'achievementManager':
        return this.drawManager()
    }
  }

  private drawTitlebar() {
    if (this.L.compact) return this.drawTitlebarCompact()
    const { ctx, pal, fonts } = this
    ctx.fillStyle = pal.background
    ctx.fillRect(0, 0, this.L.W, this.L.TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(0, this.L.TB - 1, this.L.W, 1)
    drawLogo(ctx, 18, 17, 22, pal.foreground)
    text(ctx, fonts, 'Steam Game Idler', 52, 28, {
      size: 15,
      weight: 600,
      color: pal.foreground,
      family: fonts.display,
    })
    icon(ctx, 'sidebar', this.L.SB + 25, 28, 19, pal.foreground)
    // search pill
    const sw = 380
    const sx = this.L.SB + 50 + (this.L.W - this.L.SB - 50 - 201 - sw) / 2
    fillRR(ctx, sx, 8, sw, 40, 20, pal.surface)
    icon(ctx, 'search', sx + 26, 28, 17, pal.muted)
    text(ctx, fonts, 'Search', sx + 44, 28, { size: 15, color: pal.muted })
    const right = this.L.W - 150
    icon(ctx, 'bell', right - 75, 28, 19, pal.foreground)
    icon(ctx, 'menu', right - 25, 28, 19, pal.foreground)
    ctx.fillStyle = pal.border
    ctx.fillRect(right, 0, 1, this.L.TB)
    ;(['min', 'max', 'close'] as const).forEach((k, i) => {
      const x = right + 1 + i * 50
      const id = `win-${k}`
      if (this.hovered(id)) {
        ctx.fillStyle = k === 'close' ? '#e81123' : pal.surface
        ctx.fillRect(x, 0, 50, this.L.TB - 1)
      }
      icon(
        ctx,
        k === 'min' ? 'winMin' : k === 'max' ? 'winMax' : 'winClose',
        x + 25,
        28,
        16,
        pal.foreground,
      )
      this.region(id, x, 0, 50, this.L.TB, () => this.events.windowButton(k))
    })
  }

  private drawSidebar() {
    if (this.L.compact) return this.drawSidebarRail()
    const { ctx, pal, fonts } = this
    ctx.fillStyle = pal.background
    ctx.fillRect(0, this.L.TB, this.L.SB, this.L.H - this.L.TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(this.L.SB - 1, this.L.TB, 1, this.L.H - this.L.TB)
    // the active highlight glides between items instead of jumping
    const hy = lerp(this.navFromY, this.navToY, ease.io(prog(this.now, this.pageT, 0.32)))
    fillRR(ctx, 8, hy, 239, 41, 9, pal.surface)
    const active = this.page === 'achievementManager' ? 'games' : this.page
    const running: Partial<Record<PageId, boolean>> = {
      cardFarming: this.farm.running,
      achievementUnlocker: this.unl.running,
      idling: [...this.idle.values()].some(v => v.owner === 'manual'),
    }
    let y = this.L.TB + 30
    for (const [header, items] of NAV) {
      ctx.letterSpacing = '0.06em'
      text(ctx, fonts, header.toUpperCase(), 20, y + 7, { size: 12, weight: 600, color: pal.muted })
      ctx.letterSpacing = '0px'
      y += 20
      for (const [id, label, ic] of items) {
        const nid = `nav-${id}`
        if (this.hovered(nid) && id !== active)
          fillRR(ctx, 8, y, 239, 41, 9, 'rgba(255,255,255,0.04)')
        // Sidebar.tsx tints running automation in accent; claimable free games show gold
        const color = running[id] ? pal.accent : pal.foreground
        const iconColor = id === 'freeGames' && this.free.claimedT < 0 ? pal.gold : color
        icon(ctx, ic, 32, y + 20, 20, iconColor)
        text(ctx, fonts, label, 54, y + 21, { size: 16, weight: 500, color })
        this.region(nid, 8, y, 239, 41, () => this.navigate(id, true))
        y += 43
      }
      y += 18
    }
    // footer: plan + account row
    const fy = this.L.H - 104
    ctx.fillStyle = pal.border
    ctx.fillRect(0, fy, this.L.SB - 1, 1)
    text(ctx, fonts, 'Plan', 20, fy + 24, { size: 13, weight: 600, color: pal.muted })
    tierBadge(ctx, fonts, pal, 'FREE', 'free', this.L.SB - 20, fy + 24, 'right')
    const uy = fy + 44
    if (this.hovered('acct') || this.acctOpen) fillRR(ctx, 8, uy, 239, 50, 9, pal.surface)
    const [name, , grad] = ACCOUNTS[this.user]
    avatar(ctx, 20, uy + 8, 34, grad)
    text(ctx, fonts, name, 66, uy + 26, { size: 16, weight: 500, color: pal.foreground })
    icon(ctx, 'chevronDown', 196, uy + 25, 18, pal.muted)
    icon(ctx, 'settings', 226, uy + 25, 18, pal.muted)
    this.region('acct', 8, uy, 239, 50, () => {
      this.acctOpen = !this.acctOpen
      this.acctT = this.now
      this.anim(0.3)
    })
  }

  /** Compact titlebar: wordmark, then search + notifications as icons, and the window buttons. */
  private drawTitlebarCompact() {
    const { ctx, pal, fonts } = this
    const { W, TB } = this.L
    ctx.fillStyle = pal.background
    ctx.fillRect(0, 0, W, TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(0, TB - 1, W, 1)
    drawLogo(ctx, 18, TB / 2 - 10, 20, pal.foreground)
    text(ctx, fonts, 'Steam Game Idler', 48, TB / 2, {
      size: 14,
      weight: 600,
      color: pal.foreground,
      family: fonts.display,
    })
    const right = W - 132
    icon(ctx, 'search', right - 66, TB / 2, 18, pal.foreground)
    icon(ctx, 'bell', right - 28, TB / 2, 18, pal.foreground)
    ctx.fillStyle = pal.border
    ctx.fillRect(right, 0, 1, TB)
    ;(['min', 'max', 'close'] as const).forEach((k, i) => {
      const x = right + 1 + i * 44
      const id = `win-${k}`
      if (this.hovered(id)) {
        ctx.fillStyle = k === 'close' ? '#e81123' : pal.surface
        ctx.fillRect(x, 0, 44, TB - 1)
      }
      icon(
        ctx,
        k === 'min' ? 'winMin' : k === 'max' ? 'winMax' : 'winClose',
        x + 22,
        TB / 2,
        15,
        pal.foreground,
      )
      this.region(id, x, 0, 44, TB, () => this.events.windowButton(k))
    })
  }

  /**
   * Compact sidebar: the real app's collapsed icon rail. Same items, order and running/claimable
   * tints as the full sidebar, with the account switcher reduced to its avatar at the bottom.
   */
  private drawSidebarRail() {
    const { ctx, pal } = this
    const { TB, SB, H } = this.L
    ctx.fillStyle = pal.background
    ctx.fillRect(0, TB, SB, H - TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(SB - 1, TB, 1, H - TB)
    const hy = lerp(this.navFromY, this.navToY, ease.io(prog(this.now, this.pageT, 0.32)))
    fillRR(ctx, 8, hy, SB - 16, 42, 10, pal.surface)
    const active = this.page === 'achievementManager' ? 'games' : this.page
    const running: Partial<Record<PageId, boolean>> = {
      cardFarming: this.farm.running,
      achievementUnlocker: this.unl.running,
      idling: [...this.idle.values()].some(v => v.owner === 'manual'),
    }
    for (const [, items] of NAV) {
      for (const [id, , ic] of items) {
        const y = this.navY(id)
        const nid = `nav-${id}`
        if (this.hovered(nid) && id !== active)
          fillRR(ctx, 8, y, SB - 16, 42, 10, 'rgba(255,255,255,0.04)')
        const color = running[id] ? pal.accent : pal.foreground
        icon(
          ctx,
          ic,
          SB / 2,
          y + 21,
          21,
          id === 'freeGames' && this.free.claimedT < 0 ? pal.gold : color,
        )
        this.region(nid, 8, y, SB - 16, 42, () => this.navigate(id, true))
      }
    }
    // account: just the avatar (opens the same switcher popover)
    const uy = H - 58
    ctx.fillStyle = pal.border
    ctx.fillRect(0, uy - 8, SB - 1, 1)
    if (this.hovered('acct') || this.acctOpen) fillRR(ctx, 8, uy, SB - 16, 46, 10, pal.surface)
    avatar(ctx, SB / 2 - 15, uy + 8, 30, ACCOUNTS[this.user][2])
    this.region('acct', 8, uy, SB - 16, 46, () => {
      this.acctOpen = !this.acctOpen
      this.acctT = this.now
      this.anim(0.3)
    })
  }

  private drawAccountPopover() {
    if (!this.acctOpen) return
    const { ctx, pal, fonts } = this
    const p = ease.out5(prog(this.now, this.acctT, 0.22))
    const w = 300
    const h = 8 + ACCOUNTS.length * 60 + 56
    const x = 12
    const y = this.L.H - (this.L.compact ? 66 : 104) - h - 8 + (1 - p) * 12
    ctx.save()
    ctx.globalAlpha = p
    ctx.shadowColor = 'rgba(0,0,0,.55)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 16
    fillRR(ctx, x, y, w, h, 16, pal.surface)
    ctx.restore()
    ctx.save()
    ctx.globalAlpha = p
    strokeRR(ctx, x, y, w, h, 16, pal.border)
    ACCOUNTS.forEach(([n, mode, grad], i) => {
      const ry = y + 8 + i * 60
      const id = `acct-${i}`
      if (this.hovered(id)) fillRR(ctx, x + 6, ry, w - 12, 56, 10, pal.default)
      avatar(ctx, x + 16, ry + 11, 34, grad)
      text(ctx, fonts, n, x + 62, ry + 20, { size: 16, weight: 600, color: pal.foreground })
      text(ctx, fonts, mode, x + 62, ry + 39, { size: 13, color: pal.muted })
      if (i === this.user) {
        ctx.beginPath()
        ctx.arc(x + w - 26, ry + 28, 5, 0, Math.PI * 2)
        ctx.fillStyle = pal.success
        ctx.fill()
      }
      this.region(id, x + 6, ry, w - 12, 56, () => {
        this.acctOpen = false
        if (i !== this.user) {
          this.user = i
          this.toast(`Switched to ${n}`)
        }
      })
    })
    const ay = y + 8 + ACCOUNTS.length * 60
    ctx.fillStyle = pal.border
    ctx.fillRect(x, ay, w, 1)
    icon(ctx, 'users', x + 33, ay + 27, 19, pal.muted)
    text(ctx, fonts, 'Add another account', x + 62, ay + 28, {
      size: 15,
      weight: 600,
      color: pal.muted,
    })
    tierBadge(ctx, fonts, pal, 'CASUAL', 'casual', x + w - 16, ay + 28, 'right')
    this.region('acct-add', x, ay, w, 52, () => {
      this.acctOpen = false
      this.toast('More accounts come with the Casual plan', 'users', pal.casual)
    })
    ctx.restore()
  }

  private drawToast() {
    const t = this.toastMsg
    if (!t) return
    const age = this.now - t.t
    if (age > 3) return
    const { ctx, pal, fonts } = this
    const p = ease.out5(clamp01(age / 0.3)) * (1 - ease.out(clamp01((age - 2.6) / 0.35)))
    const w = measure(ctx, fonts, t.text, 15, 600) + 70
    const x = this.L.W - 24 - w
    const y = this.L.H - 24 - 52 + (1 - p) * 16
    ctx.save()
    ctx.globalAlpha = p
    ctx.shadowColor = 'rgba(0,0,0,.45)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 16
    fillRR(ctx, x, y, w, 52, 14, pal.surface)
    ctx.shadowColor = 'transparent'
    strokeRR(ctx, x, y, w, 52, 14, pal.border)
    icon(ctx, t.icon, x + 30, y + 26, 21, t.color)
    text(ctx, fonts, t.text, x + 52, y + 27, { size: 15, weight: 600, color: pal.foreground })
    ctx.restore()
  }

  // --- shared page pieces

  /** Draws the page's title block and actions; returns the y where the page's content starts. */
  private pageHead(title: string, sub: string, actions: Action[]) {
    const { ctx, pal, fonts } = this
    const { X0, Y0, CW, XR, compact } = this.L
    if (!compact) {
      text(ctx, fonts, title, X0, Y0 + 24, { size: 38, weight: 900, color: pal.foreground })
      if (sub) text(ctx, fonts, sub, X0, Y0 + 62, { size: 16, color: pal.muted })
      this.actions(actions, XR, Y0)
      return Y0 + 88
    }
    // compact: title + sub, then the actions on their own row (they don't fit beside the title)
    text(ctx, fonts, title, X0, Y0 + 16, { size: 28, weight: 900, color: pal.foreground, maxW: CW })
    if (sub) text(ctx, fonts, sub, X0, Y0 + 44, { size: 14, color: pal.muted })
    if (!actions.length) return Y0 + 68
    this.actionsLeft(actions, X0, Y0 + 66)
    return Y0 + 128
  }

  /** Lays actions out left to right from `left` (the compact header's own row). */
  private actionsLeft(list: Action[], left: number, top: number) {
    let x = left
    for (const a of list) {
      if (a.kind === 'icon') {
        this.iconBtn(a.id, x, top, a.icon, a.onClick)
        x += 44 + 10
      } else {
        const w = this.btnWidth(a)
        this.btn(a, x, top, w)
        x += w + 10
      }
    }
  }

  private actions(list: Action[], right: number, top: number) {
    let x = right
    for (let i = list.length - 1; i >= 0; i--) {
      const a = list[i]
      if (a.kind === 'icon') {
        x -= 44
        this.iconBtn(a.id, x, top, a.icon, a.onClick)
      } else {
        const w = this.btnWidth(a)
        x -= w
        this.btn(a, x, top, w)
      }
      x -= 10
    }
  }

  private btnWidth(a: BtnAction) {
    const { ctx, fonts } = this
    let w = 40 + measure(ctx, fonts, a.label, 17, 600)
    if (a.icon) w += 27
    if (a.tier) w += 72
    return Math.round(w)
  }

  private btn(a: BtnAction, x: number, y: number, w = this.btnWidth(a), h = 44) {
    const { ctx, pal, fonts } = this
    const hov = this.hovered(a.id)
    const primary = a.variant === 'primary'
    const danger = a.variant === 'danger'
    ctx.save()
    if (a.dim) ctx.globalAlpha *= 0.5
    const bg = primary
      ? hov
        ? '#e6e6e6'
        : '#ffffff'
      : danger
        ? pal.danger
        : hov
          ? pal.default
          : pal.surface
    fillRR(ctx, x, y, w, h, h / 2, bg)
    const fg = a.color ?? (primary ? '#000000' : '#fcfcfc')
    let cx = x + 20
    const fs = h < 40 ? 15 : 17
    if (a.icon) {
      icon(ctx, a.icon, cx + 9, y + h / 2, h < 40 ? 16 : 19, fg)
      cx += 27
    }
    const tw = text(ctx, fonts, a.label, cx, y + h / 2 + 1, { size: fs, weight: 600, color: fg })
    if (a.tier)
      tierBadge(ctx, fonts, pal, a.tier.toUpperCase(), a.tier, cx + tw + 10, y + h / 2, 'left')
    ctx.restore()
    this.region(a.id, x, y, w, h, a.dim ? undefined : a.onClick)
    return w
  }

  private iconBtn(id: string, x: number, y: number, ic: IconName, onClick?: () => void) {
    const { ctx } = this
    ctx.beginPath()
    ctx.arc(x + 22, y + 22, 22, 0, Math.PI * 2)
    ctx.fillStyle = this.hovered(id) ? '#e6e6e6' : '#ffffff'
    ctx.fill()
    icon(ctx, ic, x + 22, y + 22, 20, '#000')
    this.region(id, x, y, 44, 44, onClick)
  }

  private label(str: string, x: number, y: number) {
    text(this.ctx, this.fonts, str, x, y + 8, { size: 13, weight: 600, color: this.pal.muted })
  }

  private secTitle(str: string, y: number) {
    text(this.ctx, this.fonts, str, this.L.X0, y + 13, {
      size: 21,
      weight: 700,
      color: this.pal.foreground,
    })
  }

  private tabs(labels: string[], x: number, y: number) {
    const { ctx, pal, fonts } = this
    const widths = labels.map(l => measure(ctx, fonts, l, 16) + 36)
    const w = widths.reduce((a, b) => a + b, 0) + 8 + (labels.length - 1) * 2
    fillRR(ctx, x, y, w, 44, 22, pal.surface)
    let cx = x + 4
    labels.forEach((l, i) => {
      if (i === 0) fillRR(ctx, cx, y + 4, widths[i], 36, 18, pal.default)
      text(ctx, fonts, l, cx + widths[i] / 2, y + 23, {
        size: 16,
        color: i === 0 ? pal.foreground : pal.muted,
        align: 'center',
      })
      cx += widths[i] + 2
    })
  }

  private checkbox(id: string, x: number, y: number, on: boolean, onClick: () => void) {
    const { ctx, pal } = this
    fillRR(
      ctx,
      x,
      y,
      22,
      22,
      6,
      on ? pal.accent : this.hovered(id) ? pal.border : pal.surfaceTertiary,
    )
    if (on) icon(ctx, 'check', x + 11, y + 11, 15, '#fff')
    this.region(id, x - 8, y - 8, 38, 38, onClick)
  }

  private bar(x: number, y: number, w: number, frac: number) {
    fillRR(this.ctx, x, y, w, 8, 4, this.pal.default)
    if (frac > 0) fillRR(this.ctx, x, y, Math.max(8, w * clamp01(frac)), 8, 4, this.pal.accent)
  }

  private card(x: number, y: number, w: number, h: number, r = 18, highlight = false) {
    fillRR(this.ctx, x, y, w, h, r, this.pal.surface)
    strokeRR(
      this.ctx,
      x,
      y,
      w,
      h,
      r,
      highlight ? this.pal.accent : this.pal.border,
      highlight ? 2 : 1,
    )
  }

  private timerPill(cx: number, cy: number, secs: number, scale = 1) {
    const { ctx, fonts } = this
    const w = 112 * scale
    const h = 32 * scale
    fillRR(ctx, cx - w / 2, cy - h / 2, w, h, h / 2, 'rgba(0,0,0,.72)')
    text(ctx, fonts, hms(Math.max(0, secs)), cx, cy + 1, {
      size: 16 * scale,
      weight: 600,
      color: '#fff',
      align: 'center',
      tabular: true,
    })
  }

  /** GameCard.tsx: capsule + muted name + play/stop and trophy ghost buttons. */
  private gameCard(name: string, x: number, y: number, w: number) {
    const { ctx, pal, fonts } = this
    const g = game(name)
    const idling = this.idle.get(name)
    const id = `gc-${name}`
    const h = capsule(ctx, fonts, this.art, g, x, y, w)
    if (this.hovered(`${id}-play`) || this.hovered(`${id}-trophy`)) {
      fillRR(ctx, x, y, w, h, 10, 'rgba(255,255,255,0.05)')
    }
    if (idling) this.timerPill(x + w / 2, y + h / 2, this.now - idling.start, w < 260 ? 0.85 : 1)
    const ry = y + h + 9 + 15
    text(ctx, fonts, name, x, ry, { size: 15, weight: 600, color: pal.muted, maxW: w - 74 })
    const bx = x + w - 62
    for (const [k, ic] of [
      ['play', idling ? 'stop' : 'play'],
      ['trophy', 'trophy'],
    ] as const) {
      const bid = `${id}-${k}`
      const xx = k === 'play' ? bx : bx + 32
      if (this.hovered(bid)) fillRR(ctx, xx, ry - 15, 30, 30, 8, pal.default)
      icon(ctx, ic, xx + 15, ry, 17, k === 'play' && idling ? pal.accent : pal.foreground)
      this.region(bid, xx, ry - 15, 30, 30, () => {
        if (k === 'play') this.toggleIdle(name)
        else {
          this.mgr.game = name
          this.resetMgr()
          this.navigate('achievementManager', true)
        }
      })
    }
    return h + 9 + 30
  }

  // --- pages
  // Every page has its wide layout (the desktop window) and, under `this.L.compact`, a reflowed
  // narrow one: two-column grids, actions on their own row under the title, stacked panels.

  /** Columns of `n` equal cells across the content width with `gap`, as [x, width] per column. */
  private grid(n: number, gap: number) {
    const w = (this.L.CW - gap * (n - 1)) / n
    return { w, x: (col: number) => this.L.X0 + col * (w + gap) }
  }

  private drawGames() {
    const { X0 } = this.L
    const top = this.pageHead('Games', '128 games', [
      {
        kind: 'btn',
        id: 'games-sort',
        label: 'Playtime (High to Low)',
        icon: 'sort',
        variant: 'secondary',
      },
      { kind: 'icon', id: 'games-refresh', icon: 'refresh' },
    ])
    let y = top + 4
    this.secTitle('Recommended', y)
    y += 38
    if (this.L.compact) {
      const g = this.grid(2, 14)
      REC.slice(0, 2).forEach((n, i) => this.gameCard(n, g.x(i), y, g.w))
      y += (g.w * 215) / 460 + 39 + 22
      this.secTitle('All Games', y)
      y += 38
      ALL.forEach((n, i) =>
        this.gameCard(n, g.x(i % 2), y + Math.floor(i / 2) * ((g.w * 215) / 460 + 53), g.w),
      )
      return
    }
    REC.forEach((n, i) => this.gameCard(n, X0 + i * 382, y, 360))
    y += 168 + 39 + 24
    this.secTitle('All Games', y)
    y += 38
    ALL.forEach((n, i) => this.gameCard(n, X0 + (i % 5) * 229, y + Math.floor(i / 5) * 158, 208))
  }

  private drawIdling() {
    const { ctx, pal, fonts } = this
    const { X0, CW, XR, H, compact } = this.L
    const n = this.idle.size
    const top = this.pageHead(
      'Idling',
      `${n} ${n === 1 ? 'game' : 'games'} idling`,
      n
        ? [
            {
              kind: 'btn',
              id: 'idle-stopall',
              label: 'Stop all',
              icon: 'stop',
              variant: 'secondary',
              onClick: () => {
                this.stopFarm()
                this.stopUnlocker()
                this.idle.clear()
                this.anim(0.4)
                this.emitStats()
              },
            },
          ]
        : [],
    )
    if (!n) {
      const cy = compact ? 380 : 400
      icon(ctx, 'idling', X0 + CW / 2, cy, 44, pal.muted)
      text(ctx, fonts, 'No games idling', X0 + CW / 2, cy + 60, {
        size: 22,
        weight: 700,
        color: pal.foreground,
        align: 'center',
      })
      text(
        ctx,
        fonts,
        'Start idling a game from the Games tab to see it here.',
        X0 + CW / 2,
        cy + 94,
        { size: compact ? 14 : 16, color: pal.muted, align: 'center', maxW: CW },
      )
      return
    }
    // grouped by owning feature, in groupIdlingGames.ts's precedence order
    const groups: [Owner, string, () => void][] = [
      ['farm', 'Card Farming', () => this.stopFarm()],
      ['unl', 'Achievement Unlocker', () => this.stopUnlocker()],
      ['auto', 'Automatic Idler', () => this.stopOwner('auto')],
      ['manual', 'Manually idled', () => this.stopOwner('manual')],
    ]
    let y = top + 8
    const cols = compact ? 2 : 4
    const g = this.grid(cols, compact ? 14 : 20)
    const capH = (g.w * 215) / 460
    for (const [owner, title, stop] of groups) {
      const games = [...this.idle.entries()].filter(([, v]) => v.owner === owner)
      if (!games.length) continue
      if (y > H) break
      this.label(`${title} (${games.length})`, X0, y)
      const sid = `idle-stop-${owner}`
      const sw = 74
      if (this.hovered(sid)) fillRR(ctx, XR - sw, y - 6, sw, 30, 15, pal.surface)
      icon(ctx, 'stop', XR - sw + 20, y + 9, 14, pal.foreground)
      text(ctx, fonts, 'Stop', XR - sw + 32, y + 9, {
        size: 14,
        weight: 600,
        color: pal.foreground,
      })
      this.region(sid, XR - sw, y - 6, sw, 30, stop)
      y += 30
      const shown = games.slice(0, compact ? 4 : 4)
      shown.forEach(([name, v], i) => {
        const x = g.x(i % cols)
        const yy = y + Math.floor(i / cols) * (capH + 54)
        const h = capsule(ctx, fonts, this.art, game(name), x, yy, g.w)
        this.timerPill(x + g.w / 2, yy + h / 2, this.now - v.start, g.w < 260 ? 0.85 : 1)
        text(ctx, fonts, name, x, yy + h + 22, {
          size: 15,
          weight: 600,
          color: pal.muted,
          maxW: g.w,
        })
      })
      y += Math.ceil(shown.length / cols) * (capH + 54)
    }
  }

  private stopOwner(owner: Owner) {
    for (const [g, v] of this.idle) if (v.owner === owner) this.idle.delete(g)
    this.anim(0.4)
    this.emitStats()
  }

  /** Favorites / Automatic Idler: a row of game cards (two per row when compact). */
  private cardRow(
    names: string[],
    top: number,
    decorate?: (x: number, y: number, w: number) => void,
  ) {
    if (this.L.compact) {
      const g = this.grid(2, 14)
      names.forEach((n, i) => {
        const x = g.x(i % 2)
        const y = top + Math.floor(i / 2) * ((g.w * 215) / 460 + 53)
        this.gameCard(n, x, y, g.w)
        decorate?.(x, y, g.w)
      })
      return
    }
    names.forEach((n, i) => {
      const x = this.L.X0 + i * 382
      this.gameCard(n, x, top, 360)
      decorate?.(x, top, 360)
    })
  }

  private drawFavorites() {
    const top = this.pageHead('Favorites', `${FAVORITES.length} favorites`, [])
    this.cardRow(FAVORITES, top + 8, (x, y, w) =>
      icon(this.ctx, 'heartFilled', x + w - 22, y + 22, 20, '#ff4f6d'),
    )
  }

  private drawAutoIdle() {
    const top = this.pageHead('Automatic Idler', `${AUTO_IDLE.length} games`, [
      { kind: 'icon', id: 'auto-add', icon: 'plus' },
    ])
    this.cardRow(AUTO_IDLE, top + 8)
  }

  /** Where the free game's Claim button sits (its centre), for the confetti burst. */
  private freeClaimAt(): [number, number] {
    const { X0, Y0, CW, compact } = this.L
    return compact ? [X0 + CW - 75, Y0 + 390] : [X0 + 540 - 60, Y0 + 96 + 296]
  }

  private drawFree() {
    const { ctx, pal, fonts } = this
    const { X0, CW, compact } = this.L
    const name = FREE_GAMES[this.free.idx % FREE_GAMES.length]
    const claimed = this.free.claimedT >= 0
    const top = this.pageHead('Free Games', '1 free game available', [
      { kind: 'icon', id: 'free-refresh', icon: 'refresh', onClick: () => this.nextFreeGame() },
      { kind: 'icon', id: 'free-settings', icon: 'settings' },
    ])
    const x = X0
    const y = top + 8
    // the game card: full content width when compact
    const cardW = compact ? CW : 560
    const capW = cardW - 40
    const capH = (capW * 215) / 460
    const cardH = capH + 92
    this.card(x, y, cardW, cardH)
    capsule(ctx, fonts, this.art, game(name), x + 20, y + 20, capW)
    const rowY = y + capH + 58
    text(ctx, fonts, name, x + 20, rowY, {
      size: compact ? 19 : 22,
      weight: 700,
      color: pal.foreground,
      maxW: cardW - 180,
    })
    const pop = claimed ? ease.back(prog(this.now, this.free.claimedT, 0.35)) : 1
    const a: BtnAction = claimed
      ? {
          kind: 'btn',
          id: 'free-claim',
          label: 'Claimed',
          icon: 'check',
          variant: 'secondary',
          color: pal.success,
        }
      : {
          kind: 'btn',
          id: 'free-claim',
          label: 'Claim',
          icon: 'giftFilled',
          variant: 'primary',
          onClick: () => this.claimFree(),
        }
    const w = this.btnWidth(a)
    ctx.save()
    const bx = x + cardW - 20 - w
    ctx.translate(bx + w / 2, rowY)
    ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop)
    ctx.translate(-(bx + w / 2), -rowY)
    this.btn(a, bx, rowY - 22, w)
    ctx.restore()
    // illustrative: the notification the app pops when a game goes free - beside the game card
    // when wide, under it when compact
    const nx = compact ? X0 : x + 590
    const ny = compact ? y + cardH + 20 : y
    const nw = compact ? CW : CW - 590
    this.card(nx, ny, nw, 150)
    icon(ctx, 'bell', nx + 40, ny + 44, 24, pal.gold)
    text(ctx, fonts, 'Free Games Available!', nx + 70, ny + 45, {
      size: 18,
      weight: 700,
      color: pal.foreground,
    })
    text(ctx, fonts, `${name} is free on Steam right now.`, nx + 30, ny + 86, {
      size: 15,
      color: pal.muted,
      maxW: nw - 50,
    })
    text(ctx, fonts, 'Auto-redeem', nx + 30, ny + 120, {
      size: 15,
      weight: 600,
      color: pal.foreground,
    })
    tierBadge(ctx, fonts, pal, 'GAMER', 'gamer', nx + 130, ny + 120, 'left')
  }

  private claimFree() {
    this.free.claimedT = this.now
    this.anim(0.6)
    this.events.confetti(this.freeClaimAt())
    window.setTimeout(() => this.nextFreeGame(), 9000)
  }

  private nextFreeGame() {
    if (this.free.claimedT < 0) return
    this.free.idx += 1
    this.free.claimedT = -1
    this.anim(0.4)
  }

  private drawFarmIdle() {
    const { ctx, pal, fonts } = this
    const { X0, compact } = this.L
    const top = this.pageHead('Card Farming', 'Not farming', [
      {
        kind: 'btn',
        id: 'farm-start',
        label: 'Start',
        icon: 'play',
        variant: 'primary',
        onClick: () => this.startFarm(),
      },
      { kind: 'icon', id: 'farm-settings', icon: 'settings' },
    ])
    this.tabs(['Games With Drops', 'Whitelisted', 'Blacklisted'], X0, top + 4)
    const cols = compact ? 2 : 4
    const g = this.grid(cols, compact ? 14 : 20)
    const rowH = compact ? (g.w * 215) / 460 + 50 : 190
    FARM_POOL.forEach((n, i) => {
      const x = g.x(i % cols)
      const y = top + 72 + Math.floor(i / cols) * rowH
      const h = capsule(ctx, fonts, this.art, game(n), x, y, g.w)
      const drops = [4, 3, 5, 3, 2, 6, 3, 4][i]
      fillRR(ctx, x + g.w - 86, y + 10, 76, 26, 13, 'rgba(0,0,0,.72)')
      text(ctx, fonts, `${drops} drops`, x + g.w - 48, y + 24, {
        size: 13,
        weight: 700,
        color: '#fff',
        align: 'center',
      })
      text(ctx, fonts, n, x, y + h + 22, { size: 15, weight: 600, color: pal.muted, maxW: g.w })
    })
  }

  private drawFarmRun() {
    const { ctx, pal, fonts } = this
    const { X0, CW, XR, compact } = this.L
    const f = this.farm
    const n = f.slots.length
    const top = this.pageHead('Card Farming', `Farming ${n} games`, [
      {
        kind: 'btn',
        id: 'farm-stop',
        label: 'Stop farming',
        icon: 'stop',
        variant: 'secondary',
        onClick: () => this.stopFarm(),
      },
      { kind: 'icon', id: 'farm-settings', icon: 'settings' },
    ])
    this.label(`Farming (${n})`, X0, top + 4)
    const pad = compact ? 14 : 16
    f.slots.forEach((s, i) => {
      const b = this.farmCardBox(i)
      this.card(b.x, b.y, b.w, b.h, 18)
      const g = game(s.game)
      // a drop gives the capsule a little kick
      const kick = Math.sin(prog(this.now, s.dropT, 0.4) * Math.PI) * 6
      const capH = capsule(ctx, fonts, this.art, g, b.x + pad, b.y + pad - kick, b.w - pad * 2)
      const ty = b.y + pad + capH
      text(ctx, fonts, s.game, b.x + pad, ty + 24, {
        size: compact ? 15 : 16,
        weight: 600,
        color: pal.foreground,
        maxW: b.w - pad * 2,
      })
      const shown = s.total - s.left - 1 + ease.out(prog(this.now, s.dropT, 0.45))
      this.bar(b.x + pad, ty + 46, b.w - pad * 2, (s.left === s.total ? 0 : shown) / s.total)
      const done = s.doneT >= 0
      text(
        ctx,
        fonts,
        done ? 'Nothing left to farm' : `${s.left} ${s.left === 1 ? 'drop' : 'drops'} remaining`,
        b.x + pad,
        ty + 76,
        { size: compact ? 13 : 14, weight: 600, color: done ? pal.success : pal.accent },
      )
    })
    const last = this.farmCardBox(n - 1)
    const qy = last.y + last.h + 26
    this.label(`Up next (${f.queue.length})`, X0, qy)
    this.card(X0, qy + 26, CW, 12 + f.queue.length * 52, 16)
    f.queue.forEach((q, i) => {
      const ry = qy + 38 + i * 52
      strokeRR(ctx, X0 + 12, ry, CW - 24, 44, 10, pal.border)
      text(ctx, fonts, q, X0 + 28, ry + 23, { size: 15, weight: 600, color: pal.foreground })
      icon(ctx, 'autoIdle', XR - 158, ry + 22, 15, pal.muted)
      text(ctx, fonts, 'Waiting its turn', XR - 144, ry + 23, {
        size: 13,
        weight: 500,
        color: pal.muted,
      })
    })
  }

  /**
   * The unlocker's three blocks: the current-game card, "Up next" and the "Recently unlocked" feed
   * - side by side when wide, stacked when compact.
   */
  private unlLayout() {
    const { X0, Y0, CW, H, compact } = this.L
    if (compact) {
      const top = Y0 + 128
      const up = { x: X0, y: top + 320, w: CW }
      const feedY = up.y + 168
      return {
        cur: { x: X0, y: top, w: CW, h: 300 },
        up,
        feed: { x: X0, y: feedY, w: CW, h: Math.max(140, H - feedY - 46) },
      }
    }
    const y = Y0 + 96
    return {
      cur: { x: X0, y, w: 540, h: 600 },
      up: { x: X0 + 560, y, w: CW - 560 },
      feed: { x: X0 + 560, y: y + 170, w: CW - 560, h: 404 },
    }
  }

  /** Where a new unlock appears (top row of the feed), for its spark burst. */
  private unlFeedPoint(): [number, number] {
    const f = this.unlLayout().feed
    return [f.x + f.w / 2, f.y + 26 + 12 + 29]
  }

  private drawUnlocker() {
    const { ctx, pal, fonts } = this
    const { compact } = this.L
    const u = this.unl
    const cur = UNL_GAMES[u.gameIdx]
    this.pageHead('Achievement Unlocker', u.running ? 'Unlocking 1 game' : '', [
      u.running
        ? {
            kind: 'btn',
            id: 'unl-toggle',
            label: 'Stop',
            icon: 'stop',
            variant: 'secondary',
            onClick: () => this.stopUnlocker(),
          }
        : {
            kind: 'btn',
            id: 'unl-toggle',
            label: 'Start',
            icon: 'play',
            variant: 'primary',
            onClick: () => this.startUnlocker(),
          },
      { kind: 'icon', id: 'unl-add', icon: 'plus' },
      { kind: 'icon', id: 'unl-settings', icon: 'settings' },
    ])
    const L = this.unlLayout()
    const c = L.cur
    const cx = c.x + c.w / 2
    this.card(c.x, c.y, c.w, c.h)
    const capW = compact ? 300 : 420
    const capY = compact ? c.y + 22 : c.y + 90
    const capH = capsule(ctx, fonts, this.art, game(cur), cx - capW / 2, capY, capW)
    const ty = capY + capH
    text(ctx, fonts, 'Current game', cx, ty + (compact ? 26 : 24), {
      size: compact ? 13 : 14,
      color: pal.muted,
      align: 'center',
      family: 'ui-monospace, monospace',
    })
    text(ctx, fonts, cur, cx, ty + (compact ? 56 : 62), {
      size: compact ? 22 : 26,
      weight: 700,
      color: pal.foreground,
      align: 'center',
    })
    const last = u.feed[0]?.t ?? -10
    const shown = u.done - 1 + ease.out(prog(this.now, last, 0.5))
    const barW = compact ? 300 : 380
    this.bar(cx - barW / 2, ty + (compact ? 82 : 100), barW, shown / u.total)
    const left = u.total - u.done
    text(
      ctx,
      fonts,
      u.running || u.done
        ? `${left} ${left === 1 ? 'achievement' : 'achievements'} remaining`
        : 'Starting…',
      cx,
      ty + (compact ? 112 : 134),
      { size: compact ? 15 : 16, weight: 600, color: pal.accent, align: 'center' },
    )
    const { x: rx, y: uy, w: rw } = L.up
    this.label('Up next', rx, uy)
    this.card(rx, uy + 26, rw, 116, 16)
    ;[1, 2].forEach((k, i) => {
      const ry = uy + 38 + i * 52
      strokeRR(ctx, rx + 12, ry, rw - 24, 44, 10, pal.border)
      text(ctx, fonts, UNL_GAMES[(u.gameIdx + k) % UNL_GAMES.length], rx + 28, ry + 23, {
        size: 15,
        weight: 600,
        color: pal.foreground,
      })
      icon(ctx, 'autoIdle', rx + rw - 158, ry + 22, 15, pal.muted)
      text(ctx, fonts, 'Waiting its turn', rx + rw - 144, ry + 23, { size: 13, color: pal.muted })
    })
    const fd = L.feed
    this.label('Recently unlocked', fd.x, fd.y)
    this.card(fd.x, fd.y + 26, fd.w, fd.h, 16)
    ctx.save()
    ctx.beginPath()
    ctx.rect(fd.x, fd.y + 30, fd.w, fd.h - 8)
    ctx.clip()
    // oldest first, so the newest row (popping in at the top) draws over the rows sliding down
    for (let i = u.feed.length - 1; i >= 0; i--) {
      const row = u.feed[i]
      // newest row pops in at the top, the rest slide down a slot
      const enter = ease.out5(prog(this.now, row.t, 0.45))
      const slide = i === 0 ? 0 : i - 1 + ease.out5(prog(this.now, u.feed[0].t, 0.45))
      const ry = fd.y + 38 + slide * 66
      ctx.save()
      ctx.globalAlpha = i === 0 ? enter : 1
      const s = i === 0 ? 0.9 + 0.1 * ease.back(prog(this.now, row.t, 0.45)) : 1
      ctx.translate(fd.x + fd.w / 2, ry + 28)
      ctx.scale(s, s)
      ctx.translate(-(fd.x + fd.w / 2), -(ry + 28))
      fillRR(ctx, fd.x + 12, ry, fd.w - 24, 58, 12, i === 0 ? pal.accentSoft : 'rgba(0,0,0,0)')
      achIcon(ctx, fd.x + 20, ry + 5, 48, row.icon, false)
      text(ctx, fonts, row.name, fd.x + 82, ry + 30, {
        size: 16,
        weight: 600,
        color: pal.foreground,
        maxW: fd.w - 180,
      })
      text(ctx, fonts, row.clock, fd.x + fd.w - 58, ry + 30, {
        size: 14,
        weight: 600,
        color: pal.muted,
        align: 'right',
        tabular: true,
      })
      icon(ctx, 'check', fd.x + fd.w - 36, ry + 29, 18, pal.success)
      ctx.restore()
    }
    ctx.restore()
  }

  private drawManager() {
    const { ctx, pal, fonts } = this
    const { X0, Y0, CW, XR, compact } = this.L
    const m = this.mgr
    const sel = m.achs.filter(a => a.selected).length
    const unlocked = 10 + m.achs.filter(a => a.unlocked).length
    const capW = compact ? 150 : 190
    capsule(ctx, fonts, this.art, game(m.game), X0, Y0 + 4, capW)
    text(ctx, fonts, m.game, X0 + capW + 16, Y0 + (compact ? 26 : 30), {
      size: compact ? 22 : 30,
      weight: 900,
      color: pal.foreground,
      maxW: CW - capW - 16,
    })
    text(ctx, fonts, `${unlocked} / 30 unlocked`, X0 + capW + 16, Y0 + (compact ? 54 : 66), {
      size: compact ? 14 : 15,
      color: pal.muted,
    })
    const actions: Action[] = [
      {
        kind: 'btn',
        id: 'mgr-all',
        label: 'Unlock all',
        variant: 'secondary',
        onClick: () => {
          m.achs.forEach(a => (a.selected = !a.unlocked))
          this.applyMgr()
        },
      },
      {
        kind: 'btn',
        id: 'mgr-apply',
        label: sel ? `Apply changes (${sel})` : 'Apply changes',
        variant: 'primary',
        dim: !sel,
        onClick: () => this.applyMgr(),
      },
    ]
    // compact: the actions get their own row under the game header
    if (compact) this.actionsLeft(actions, X0, Y0 + 92)
    else this.actions(actions, XR, Y0 + 22)
    this.tabs(['Achievements', 'Statistics'], X0, Y0 + (compact ? 150 : 116))
    const rowH = compact ? 72 : 78
    m.achs.forEach((a, i) => {
      const y = this.mgrRowY(i)
      const flip = prog(this.now, a.flipT, 0.45)
      const pop = a.flipT > this.now - 1 ? 1 + 0.18 * Math.sin(flip * Math.PI) : 1
      strokeRR(ctx, X0, y, CW, rowH, 14, a.selected ? pal.accent : pal.border, a.selected ? 2 : 1)
      this.checkbox(`mgr-cb-${i}`, X0 + (compact ? 14 : 20), y + rowH / 2 - 11, a.selected, () =>
        this.toggleSelect(i),
      )
      // a staged flip shows its old state until its stagger slot comes up
      const shownUnlocked = this.now < a.flipT ? !a.unlocked : a.unlocked
      const iconSize = compact ? 44 : 54
      ctx.save()
      ctx.translate(this.mgrIconX(), y + rowH / 2)
      ctx.scale(pop, pop)
      achIcon(ctx, -iconSize / 2, -iconSize / 2, iconSize, i + 3, !shownUnlocked)
      ctx.restore()
      // AchievementRow.tsx: achieved -> red "Lock", not achieved -> white "Unlock"
      const b: BtnAction = shownUnlocked
        ? {
            kind: 'btn',
            id: `mgr-row-${i}`,
            label: 'Lock',
            icon: 'lock',
            variant: 'danger',
            onClick: () => this.flipAch(i, 0),
          }
        : {
            kind: 'btn',
            id: `mgr-row-${i}`,
            label: 'Unlock',
            icon: 'lockOpen',
            variant: 'primary',
            onClick: () => this.flipAch(i, 0),
          }
      const bw = this.btnWidth(b) - 10
      const bx = XR - (compact ? 14 : 20) - bw
      const tx = this.mgrIconX() + iconSize / 2 + 14
      text(ctx, fonts, a.name, tx, y + rowH / 2 - 10, {
        size: compact ? 15 : 17,
        weight: 700,
        color: pal.foreground,
        maxW: bx - tx - 12,
      })
      text(ctx, fonts, a.desc, tx, y + rowH / 2 + 14, {
        size: compact ? 13 : 14,
        color: pal.muted,
        maxW: bx - tx - 12,
      })
      // the global unlock rate only fits the wide row
      if (!compact)
        text(ctx, fonts, a.pct, XR - 150, y + 40, {
          size: 14,
          weight: 600,
          color: pal.muted,
          align: 'right',
        })
      this.btn(b, bx, y + rowH / 2 - 18, bw, 36)
    })
  }

  /** Inventory grid: 6 columns wide, 3 compact. */
  private invGrid() {
    const { compact, Y0 } = this.L
    const g = this.grid(compact ? 3 : 6, compact ? 12 : 14)
    return {
      ...g,
      cols: compact ? 3 : 6,
      top: compact ? Y0 + 128 : Y0 + 88,
      cardH: compact ? 206 : 232,
      rowH: compact ? 218 : 246,
    }
  }

  private drawInventory() {
    const { ctx, pal, fonts } = this
    const { compact } = this.L
    const sel = this.inv.items.filter(i => i.selected).length
    this.pageHead('Inventory Manager', '36 items', [
      {
        kind: 'btn',
        id: 'inv-dupes',
        label: 'Sell dupes',
        variant: 'secondary',
        tier: 'gamer',
        onClick: () => this.toast('Sell dupes is part of the Gamer plan', 'sparkles', pal.gamer),
      },
      {
        kind: 'btn',
        id: 'inv-list',
        label: sel ? `List selected (${sel})` : 'List selected',
        variant: 'primary',
        dim: !sel,
        onClick: () => this.listSelected(),
      },
      {
        kind: 'icon',
        id: 'inv-refresh',
        icon: 'refresh',
        onClick: () => {
          this.resetInv()
          this.anim(0.3)
        },
      },
    ])
    const G = this.invGrid()
    const w = G.w
    const artY = compact ? 82 : 96
    this.inv.items.forEach((it, i) => {
      const x = G.x(i % G.cols)
      const y = G.top + Math.floor(i / G.cols) * G.rowH
      const listed = it.listedT >= 0 && this.now >= it.listedT
      fillRR(ctx, x, y, w, G.cardH, 14, pal.surface)
      strokeRR(
        ctx,
        x,
        y,
        w,
        G.cardH,
        14,
        it.selected ? pal.accent : pal.border,
        it.selected ? 2 : 1,
      )
      this.checkbox(`inv-cb-${i}`, x + 12, y + 12, it.selected, () => this.toggleInv(i))
      if (!listed) this.region(`inv-${i}`, x, y + 40, w, G.cardH - 40, () => this.toggleInv(i))
      icon(ctx, 'lock', x + w - 22, y + 23, 16, pal.muted)
      // drop-shadowed item art, cached as a sprite (160x140 box centred on the art's centre);
      // drawn a little smaller in the narrower compact cards
      ctx.save()
      ctx.translate(x + w / 2, y + artY)
      if (compact) ctx.scale(0.82, 0.82)
      sprite(ctx, `inv:${it.kind}:${it.game}`, -80, -70, 160, 140, c =>
        invArt(c, this.art, it.kind, game(it.game), 80, 70),
      )
      ctx.restore()
      const ny = y + G.cardH - (compact ? 64 : 70)
      text(ctx, fonts, it.name, x + 12, ny, {
        size: compact ? 14 : 15,
        weight: 700,
        color: pal.foreground,
        maxW: w - 24,
      })
      text(ctx, fonts, it.type, x + 12, ny + 20, {
        size: compact ? 11 : 12,
        color: pal.muted,
        maxW: w - 24,
      })
      if (listed) {
        const s = 0.8 + 0.2 * ease.back(prog(this.now, it.listedT, 0.35))
        ctx.save()
        ctx.translate(x + 12, ny + 45)
        ctx.scale(s, s)
        icon(ctx, 'check', 8, 0, 16, pal.success)
        text(ctx, fonts, `Listed ${it.price}`, 22, 1, {
          size: compact ? 14 : 15,
          weight: 700,
          color: pal.success,
          maxW: w - 40,
        })
        ctx.restore()
      } else
        text(ctx, fonts, it.price, x + 12, ny + 46, {
          size: compact ? 14 : 15,
          weight: 700,
          color: pal.foreground,
        })
    })
  }
}

// ---------------------------------------------------------------------------------- static pieces

type Action = BtnAction | IconAction
interface BtnAction {
  kind: 'btn'
  id: string
  label: string
  icon?: IconName
  variant: 'primary' | 'secondary' | 'danger'
  tier?: 'casual' | 'gamer'
  dim?: boolean
  color?: string
  onClick?: () => void
}
interface IconAction {
  kind: 'icon'
  id: string
  icon: IconName
  onClick?: () => void
}

function tierBadge(
  ctx: Ctx,
  fonts: Fonts,
  pal: Palette,
  label: string,
  tier: 'free' | 'casual' | 'gamer',
  x: number,
  cy: number,
  align: 'left' | 'right',
) {
  ctx.font = `700 11px ${fonts.sans}`
  ctx.letterSpacing = '0.08em'
  const w = ctx.measureText(label).width + 16
  const bx = align === 'right' ? x - w : x
  const bg = tier === 'free' ? pal.default : tier === 'casual' ? pal.casual : pal.gamer
  const fg = tier === 'free' ? pal.muted : tier === 'casual' ? '#04212b' : '#fff'
  fillRR(ctx, bx, cy - 10, w, 20, 10, bg)
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, bx + w / 2 + 1, cy + 1)
  ctx.letterSpacing = '0px'
  return w
}

function avatar(ctx: Ctx, x: number, y: number, size: number, grad: string) {
  const [a, b] = grad.split(',')
  const g = ctx.createLinearGradient(x, y, x + size, y + size)
  g.addColorStop(0, a)
  g.addColorStop(1, b)
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

const ACH_HUES = [210, 280, 30, 150, 340, 190, 50, 260]
const ACH_GLYPHS: IconName[] = [
  'trophy',
  'sparkles',
  'heartFilled',
  'giftFilled',
  'lockOpen',
  'games',
  'cardFarming',
  'achievementUnlocker',
]

/** Achievement icon: gradient tile + glyph; locked icons are greyed like Steam's locked art. */
function achIcon(ctx: Ctx, x: number, y: number, size: number, i: number, locked: boolean) {
  const h = ACH_HUES[i % ACH_HUES.length]
  const g = ctx.createLinearGradient(x, y, x + size, y + size)
  if (locked) {
    g.addColorStop(0, 'rgb(74 74 80)')
    g.addColorStop(1, 'rgb(46 46 52)')
  } else {
    g.addColorStop(0, `hsl(${h} 70% 58%)`)
    g.addColorStop(1, `hsl(${h + 30} 55% 34%)`)
  }
  fillRR(ctx, x, y, size, size, size * 0.19, g)
  icon(
    ctx,
    ACH_GLYPHS[i % ACH_GLYPHS.length],
    x + size / 2,
    y + size / 2,
    size * 0.52,
    locked ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.92)',
  )
}

/** Inventory art: a trading card, a profile background, or an emoticon (video's invArt). */
function invArt(
  ctx: Ctx,
  art: Map<string, HTMLCanvasElement>,
  kind: InvItem['kind'],
  g: Game,
  cx: number,
  cy: number,
) {
  const grad = (x: number, y: number, w: number, h: number) => {
    const lg = ctx.createLinearGradient(x, y, x + w, y + h)
    lg.addColorStop(0, g.c[0])
    lg.addColorStop(1, g.c[1])
    return lg
  }
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.4)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6
  if (kind === 'card') {
    const w = 66
    const h = 92
    fillRR(ctx, cx - w / 2, cy - h / 2, w, h, 7, '#e8e8ef')
    ctx.shadowColor = 'transparent'
    fillRR(ctx, cx - w / 2 + 3, cy - h / 2 + 3, w - 6, h - 6, 5, grad(cx - w / 2, cy - h / 2, w, h))
    fillRR(ctx, cx - 20, cy + h / 2 - 17, 40, 6, 3, 'rgba(255,255,255,.7)')
  } else if (kind === 'bg') {
    const w = 130
    const h = 61
    rr(ctx, cx - w / 2, cy - h / 2, w, h, 6)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.clip()
    const img = art.get(g.name)
    if (img) ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  } else {
    ctx.beginPath()
    ctx.arc(cx, cy, 35, 0, Math.PI * 2)
    ctx.fillStyle = grad(cx - 35, cy - 35, 70, 70)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = '#fff'
    fillRR(ctx, cx - 15, cy - 14, 8, 10, 4, '#fff')
    fillRR(ctx, cx + 7, cy - 14, 8, 10, 4, '#fff')
    ctx.beginPath()
    ctx.moveTo(cx - 13, cy + 4)
    ctx.lineTo(cx + 13, cy + 4)
    ctx.arc(cx, cy + 4, 13, 0, Math.PI)
    ctx.fill()
  }
  ctx.restore()
}

/** src/shared/components/dashboard/Logo.tsx's mark, verbatim path (ours to use). */
const LOGO_PATH =
  'M 617.500 97.663 C 610.582 101.801, 602.078 106.611, 516.500 154.790 C 481.850 174.298, 444.950 195.102, 434.500 201.022 C 348.879 249.524, 318.709 266.802, 313.719 270.191 C 276.372 295.553, 249.116 338.103, 240.755 384.097 C 238.565 396.140, 238.500 398.386, 238.500 461.500 C 238.500 520.758, 238.665 527.383, 240.370 536.500 C 248.234 578.561, 273.825 618.549, 310.500 646.084 C 315.450 649.801, 348.300 670.134, 383.500 691.268 C 418.700 712.403, 459.650 737.039, 474.500 746.014 C 544.514 788.330, 588.872 814.916, 592.729 816.873 C 603.396 822.286, 620.925 823.372, 632.987 819.366 C 636.485 818.204, 653.160 807.966, 678.987 791.124 C 701.269 776.594, 724.225 761.634, 730 757.881 C 742.516 749.747, 745.203 746.348, 745.816 737.872 C 746.327 730.805, 744.276 724.545, 740.232 720.830 C 738.730 719.450, 712.525 703.327, 682 685.003 C 498.150 574.634, 447.874 544.200, 442.622 540.096 C 434.806 533.990, 425.245 521.865, 420.254 511.730 C 407.419 485.668, 405.976 457.832, 416.181 433.176 C 424.568 412.911, 434.467 401.758, 455.500 388.874 C 463.200 384.158, 489.750 367.793, 514.500 352.508 C 594.575 303.056, 624.265 284.836, 625.612 284.319 C 627.076 283.757, 644.162 293.526, 733.500 346.001 C 747.250 354.077, 774.475 370.045, 794 381.485 C 841.403 409.258, 896.577 441.907, 972.745 487.256 C 997.898 502.232, 1013.574 510.994, 1014.547 510.620 C 1015.941 510.085, 1016.069 502.053, 1015.775 433.762 L 1015.446 357.500 1012.760 348.861 C 1007.485 331.900, 999.963 318.785, 988.064 305.808 C 971.978 288.262, 954.653 277.636, 818 201.496 C 793.525 187.859, 742.675 159.357, 705 138.158 C 667.325 116.959, 634.250 98.359, 631.500 96.825 C 628.750 95.291, 625.825 94.045, 625 94.056 C 624.175 94.066, 620.800 95.690, 617.500 97.663 M 616.658 422.447 C 607.815 424.990, 602.434 428.287, 510.322 487.595 C 501.306 493.401, 499.667 495.544, 499.667 501.526 C 499.667 507.449, 501.995 510.124, 512.792 516.602 C 518.131 519.806, 528.125 525.874, 535 530.087 C 541.875 534.300, 556.950 543.491, 568.500 550.512 C 580.050 557.533, 595.575 566.978, 603 571.500 C 610.425 576.023, 641.700 595.022, 672.500 613.721 C 775.928 676.514, 804.471 694.181, 809.704 698.641 C 816.713 704.615, 826.132 717.324, 830.994 727.370 C 847 760.438, 841.222 800.611, 816.724 826.581 C 812.447 831.115, 806.822 836.168, 804.224 837.811 C 776.599 855.272, 707.391 899.875, 634.590 947.136 C 629.690 950.318, 625.415 952.778, 625.090 952.603 C 623.390 951.688, 571.208 921.333, 557 912.994 C 547.925 907.668, 528.575 896.338, 514 887.817 C 436.824 842.696, 315.056 770.963, 270.259 744.229 C 252.167 733.433, 240.427 727.006, 239.468 727.374 C 238.082 727.906, 237.952 736.022, 238.243 803.734 C 238.565 878.716, 238.591 879.572, 240.782 886.500 C 243.816 896.090, 249.806 908.307, 256.066 917.670 C 262.506 927.303, 276.971 941.774, 287 948.618 C 291.125 951.432, 320.600 969.157, 352.500 988.006 C 422.254 1029.221, 447.696 1044.412, 550.728 1106.362 C 594.304 1132.563, 630.193 1154, 630.482 1154 C 630.771 1154, 643.268 1146.431, 658.254 1137.180 C 673.239 1127.930, 706.875 1107.164, 733 1091.034 C 787.631 1057.305, 834.591 1028.577, 891.500 994.070 C 945.054 961.597, 949.400 958.630, 962.597 945.522 C 989.096 919.203, 1004.865 890.057, 1012.204 853.834 C 1014.456 842.719, 1014.500 841.273, 1014.500 779 C 1014.500 716.840, 1014.453 715.286, 1012.252 705.352 C 1002.253 660.217, 974.313 618.818, 934.926 590.777 C 928.009 585.853, 870.522 551.238, 839.500 533.318 C 829.050 527.281, 811.950 517.380, 801.500 511.314 C 783.843 501.065, 747.109 479.960, 680 441.508 C 664.875 432.842, 650.025 424.859, 647 423.768 C 639.852 421.191, 623.504 420.479, 616.658 422.447'
let logoPath: Path2D | null = null

export function drawLogo(ctx: Ctx, x: number, y: number, size: number, color: string) {
  logoPath ??= new Path2D(LOGO_PATH)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 1254, size / 1254)
  ctx.fillStyle = color
  ctx.fill(logoPath, 'evenodd')
  ctx.restore()
}
