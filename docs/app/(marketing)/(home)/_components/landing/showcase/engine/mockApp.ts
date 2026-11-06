// The interactive SGI desktop-app mock that lives on the 3D window's screen.
//
// It's an immediate-mode canvas UI: every redraw paints the whole 1440x900 window (titlebar,
// sidebar, the active page) and re-registers hit regions as it goes; the stage maps a raycast's UV
// to these logical pixels and calls `pointer()`/`click()`. Layout and wording mirror the real app
// (sidebar = src/shared/components/dashboard/Sidebar.tsx + SidebarItem.tsx, each page's controls =
// its PageToolbar, game cards = GamePosterCard.tsx, strings from src/i18n/locales/en-US.json) in a
// simplified "product demo" style - slightly bigger type, fewer controls.
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
import {
  bannerArt,
  capsule,
  fillRR,
  icon,
  measure,
  poster,
  rr,
  sprite,
  strokeRR,
  text,
  wrapLines,
} from './draw'
import { game, GAMES } from './games'
import { THEMES } from './palette'

/**
 * The mock's window geometry. `wide` is the desktop app as people see it (1440x900, full sidebar).
 * `compact` is the same app in a narrow portrait window (560x960): the sidebar collapsed to its
 * icon rail - what the real app's sidebar toggle does - with grids reflowed to three columns and
 * each page's toolbar wrapping its controls onto a second row, as the real one does when it runs
 * out of width. Phones and portrait tablets get compact, so the UI is drawn about twice as large
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
  const X0 = SB + (compact ? 18 : 24)
  // the wide window keeps the real app's scrollbar gutter on the right
  const XR = W - (compact ? 18 : 38)
  const L: MockLayout = { compact, W, H, TB, SB, X0, Y0: TB + 14, CW: XR - X0, XR }
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

// Sidebar.tsx's headerless groups (games / automation / misc), separated only by a gap.
const NAV: [PageId, string, IconName][][] = [
  [
    ['games', 'Games', 'games'],
    ['idling', 'Idling', 'idling'],
    ['favorites', 'Favorites', 'favorites'],
    ['freeGames', 'Free Games', 'freeGames'],
  ],
  [
    ['cardFarming', 'Card Farming', 'cardFarming'],
    ['achievementUnlocker', 'Achievement Unlocker', 'achievementUnlocker'],
    ['autoIdle', 'Automatic Idler', 'autoIdle'],
  ],
  [['inventory', 'Inventory Manager', 'inventory']],
]

/** Pages whose toolbar shows the titlebar's game search (the real app hides it elsewhere). */
const SEARCH_PAGES: PageId[] = [
  'games',
  'favorites',
  'cardFarming',
  'achievementUnlocker',
  'autoIdle',
]

/**
 * Library stats per game: [playtime minutes, achievements unlocked, achievements total] - what the
 * cards' corner chips show (GameStatChips.tsx). Recommended games are the unplayed ones, as in the
 * real banner.
 */
const STATS: Record<string, [number, number, number]> = {
  'Starfall Tactics': [0, 0, 52],
  'Neon Drift': [0, 0, 40],
  'Hollow Keep': [11760, 12, 30],
  'Pixel Harvest': [9240, 10, 30],
  'Iron Tide': [7860, 44, 44],
  'Skyward Isles': [0, 0, 25],
  'Crimson Circuit': [4560, 0, 18],
  'Deep Signal': [3480, 15, 60],
  'Frostbound': [2580, 3, 22],
  'Ember & Ash': [1860, 9, 35],
  'Orbit Runners': [1320, 12, 12],
  'Tiny Tavern': [1020, 5, 28],
  'Voidline': [540, 0, 15],
  'Glitch Garden': [372, 2, 20],
  'Last Lantern': [0, 0, 10],
  'Mossy Kingdom': [41, 1, 16],
}
const LIBRARY_SIZE = 128

const REC = ['Starfall Tactics', 'Neon Drift', 'Skyward Isles', 'Last Lantern']
/** the Games page's grid, sorted like its default "Playtime (High to Low)" */
const BY_PLAYTIME = [...GAMES].map(g => g.name).sort((a, b) => STATS[b][0] - STATS[a][0])
const AUTO_IDLE = ['Iron Tide', 'Mossy Kingdom', 'Voidline']
const FARM_POOL = [
  'Hollow Keep',
  'Skyward Isles',
  'Crimson Circuit',
  'Orbit Runners',
  'Frostbound',
  'Tiny Tavern',
  'Deep Signal',
  'Mossy Kingdom',
]
const FARM_DROPS = [4, 3, 5, 3, 2, 6, 3, 4]
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
  ['Well Traveled', 'Visit every region', '6.2%', false],
  ['Perfectionist', 'Earn every other achievement', '1.8%', false],
]
const INV: [string, string, InvItem['kind'], string, string][] = [
  ['Vanguard', 'Starfall Tactics', 'card', 'Starfall Tactics', '0.09'],
  ['Neon Skyline', 'Neon Drift', 'bg', 'Neon Drift', '0.14'],
  [':driftgrin:', 'Neon Drift', 'emote', 'Neon Drift', '0.06'],
  ['Harvest Moon', 'Pixel Harvest', 'card', 'Pixel Harvest', '0.11'],
  ['The Keep', 'Hollow Keep', 'card', 'Hollow Keep', '0.08'],
  ['Circuit Board', 'Crimson Circuit', 'bg', 'Crimson Circuit', '0.21'],
  ['Lantern Light', 'Last Lantern', 'card', 'Last Lantern', '0.07'],
  ['Skyward Isles', 'Skyward Isles', 'card', 'Skyward Isles', '0.10'],
  [':embercat:', 'Ember & Ash', 'emote', 'Ember & Ash', '0.05'],
  ['Orbit', 'Orbit Runners', 'card', 'Orbit Runners', '0.12'],
  ['Deep Blue', 'Deep Signal', 'bg', 'Deep Signal', '0.18'],
  ['Frost Giant', 'Frostbound', 'card', 'Frostbound', '0.09'],
]
const INV_TOTAL = 36
// InventoryFilters' list; the first (Trading cards) is the one switched on
const INV_FILTERS: [string, IconName][] = [
  ['Trading cards', 'cards'],
  ['Foil', 'sparkles'],
  ['Backgrounds', 'photo'],
  ['Emoticons', 'smile'],
  ['Booster packs', 'package'],
  ['On sale', 'tag'],
  ['Duplicates', 'copy'],
  ['Has badge', 'achievementUnlocker'],
  ['Locked', 'lock'],
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

/** How long each Recommended slide stays up before the banner moves on (seconds). */
const SLIDE_SECONDS = 7

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
const pad2 = (v: number) => String(Math.floor(v)).padStart(2, '0')
/** an idle timer: mm:ss for the first hour, then hh:mm:ss */
const elapsed = (s: number) =>
  s < 3600
    ? `${pad2(s / 60)}:${pad2(s % 60)}`
    : `${pad2(s / 3600)}:${pad2((s % 3600) / 60)}:${pad2(s % 60)}`
/** GameStatChips.tsx's playtime: minutes, then hours (one decimal under ten) */
const playtimeLabel = (m: number) =>
  m < 60
    ? `${m}m`
    : m < 600
      ? `${(m / 60).toFixed(1)}h`
      : `${Math.round(m / 60).toLocaleString('en-US')}h`

/** `rgb(r g b)` -> the same colour at `alpha` (the palette's colours are all plain rgb()) */
const withAlpha = (rgb: string, alpha: number) => rgb.replace(')', ` / ${alpha.toFixed(3)})`)

/** id prefix of a game card's hover region; its buttons append `|<action>` */
const cardOf = (id: string | null) =>
  id?.startsWith('gc|') ? id.split('|').slice(0, 3).join('|') : null

export class MockApp {
  readonly canvas: HTMLCanvasElement
  private ctx: Ctx
  private pal: Palette
  private regions: Region[] = []
  private collect = true
  private hover: string | null = null
  /** the game card under the pointer, its previous one, and when that changed - for the lift */
  private hoverCard: string | null = null
  private prevHoverCard: string | null = null
  private hoverCardT = -10
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
  /** where the current page's content starts under its toolbar, set while drawing it */
  private contentTop = 0

  private user = 0
  private acctOpen = false
  private acctT = 0
  private toastMsg: { text: string; icon: IconName; color: string; t: number } | null = null

  // Recommended banner: the slide on screen, the one it crossfades from, and when it changed
  private slide = 0
  private prevSlide = 0
  private slideT = -10

  // sims ----------------------------------------------------------------------------------------
  private idle = new Map<string, { owner: Owner; start: number }>()
  private favorites = new Set(['Neon Drift', 'Skyward Isles', 'Tiny Tavern'])
  private favTab = 0
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
    private posters: Map<string, HTMLCanvasElement>,
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
    this.contentTop = this.L.Y0 + 62
  }

  // public API -----------------------------------------------------------------------------------

  /**
   * Paints the opening page's sprites (every cover at the size the Games page uses, and the
   * banner's slides) a few per task, so the first full frame is cheap blits instead of one long
   * blocking draw.
   */
  async warm(yieldToMain: () => Promise<void>) {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)
    const w = this.grid().w
    const b = this.bannerRect()
    for (let i = 0; i < BY_PLAYTIME.length; i++) {
      // drawn off-canvas: only the sprite cache side effect matters
      poster(this.ctx, this.fonts, this.posters, game(BY_PLAYTIME[i]), -2000, -2000, w)
      if (i % 3 === 2) await yieldToMain()
    }
    for (const n of REC) {
      bannerArt(this.ctx, this.fonts, this.art, game(n), -4000, -4000, b[2], b[3])
      await yieldToMain()
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
    this.hoverCard = null
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
      // a card's own buttons keep it hovered: by id, or by `group` for one with a fixed id (Claim)
      const card = r?.group ?? cardOf(id)
      if (card !== this.hoverCard) {
        this.prevHoverCard = this.hoverCard
        this.hoverCard = card
        this.hoverCardT = this.now
        this.anim(0.2)
      }
    }
    return id !== null && r?.cursor !== false
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
    this.stepBanner(now)
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

  private region(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    onClick?: () => void,
    group?: string,
  ) {
    if (this.collect)
      this.regions.push({ id, x, y, w, h, onClick, interactive: Boolean(onClick), group })
  }

  /** A region that only reveals things on hover (no pointer cursor of its own). */
  private hoverRegion(id: string, x: number, y: number, w: number, h: number) {
    if (this.collect) this.regions.push({ id, x, y, w, h, interactive: true, cursor: false })
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
      REC.slice(0, 3).forEach((g, k) =>
        this.schedule(page, 1.2 + k * 0.5, () => this.toggleIdle(g)),
      )
    }
  }

  // --- sims

  private toggleIdle(name: string) {
    if (this.idle.has(name)) this.idle.delete(name)
    else this.idle.set(name, { owner: 'manual', start: this.now })
    this.anim(0.4)
    this.emitStats()
  }

  private toggleFavorite(name: string) {
    if (this.favorites.has(name)) this.favorites.delete(name)
    else this.favorites.add(name)
    this.anim(0.3)
  }

  private stepBanner(now: number) {
    if (this.page !== 'games' || now - this.slideT < SLIDE_SECONDS) return
    // the banner only cycles while it's on screen; leaving the page pauses it where it was
    if (this.slideT < 0) {
      this.slideT = now
      return
    }
    this.goSlide(this.slide + 1)
  }

  private goSlide(i: number) {
    this.prevSlide = this.slide
    this.slide = (i + REC.length) % REC.length
    this.slideT = this.now
    this.anim(0.6, this.bannerRect())
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
    const total = FARM_DROPS[(FARM_POOL.indexOf(g) + i) % 8]
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
      // only this slot's card changes (bar, count, the cover's little kick)
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
      this.anim(0.7, [this.L.X0, this.contentTop, this.L.CW, this.L.H - this.contentTop])
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
    // headerless groups, split by a gap; the rail's rows are taller than they are wide
    let y = TB + (compact ? 12 : 8)
    for (const items of NAV) {
      for (const [id] of items) {
        if (id === page) return y
        y += compact ? 46 : 40
      }
      y += compact ? 14 : 12
    }
    return TB + 8
  }

  private navCentre(page: PageId): [number, number] {
    return this.L.compact ? [32, this.navY(page) + 21] : [30, this.navY(page) + 18]
  }

  /** The game grid every page shares: six cover cards across (three compact). */
  private grid() {
    const { compact, CW, X0 } = this.L
    const cols = compact ? 3 : 6
    const gap = compact ? 12 : 16
    const w = (CW - gap * (cols - 1)) / cols
    const h = w * 1.5
    return {
      cols,
      w,
      h,
      gap,
      x: (i: number) => X0 + (i % cols) * (w + gap),
      y: (top: number, i: number) => top + Math.floor(i / cols) * (h + gap + 1),
    }
  }

  private bannerRect(): Rect {
    const { X0, Y0, CW, compact } = this.L
    return [X0, Y0, CW, compact ? 214 : 362]
  }

  /** card farming's running slots: the first cells of the game grid, under "Farming (n)" */
  private farmCardBox(i: number) {
    const G = this.grid()
    const top = this.contentTop + 28
    return { x: G.x(i), y: G.y(top, i), w: G.w, h: G.h }
  }

  private farmCardRect(i: number): Rect {
    const b = this.farmCardBox(i)
    return [b.x - 18, b.y - 18, b.w + 36, b.h + 36]
  }

  private farmCardCentre(i: number): [number, number] {
    const b = this.farmCardBox(i)
    return [b.x + b.w / 2, b.y + b.h * 0.36]
  }

  private mgrRowY(i: number) {
    return this.L.compact ? this.L.Y0 + 206 + i * 80 : this.L.Y0 + 150 + 56 + i * 86
  }

  /** centre x of an achievement row's icon */
  private mgrIconX() {
    return this.L.compact ? this.L.X0 + 72 : this.L.X0 + 92
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
      const top = this.contentTop
      ctx.globalAlpha = 1 - ease.out(p)
      this.drawPage(this.prevPage)
      this.contentTop = top
      this.collect = true
    }
    ctx.globalAlpha = ease.out(p)
    ctx.save()
    // PageBody.tsx's brief fade-and-rise on navigation
    ctx.translate(0, (1 - ease.out5(p)) * 8)
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
        return this.unl.running ? this.drawUnlockerRun() : this.drawUnlockerIdle()
      case 'autoIdle':
        return this.drawAutoIdle()
      case 'inventory':
        return this.drawInventory()
      case 'achievementManager':
        return this.drawManager()
    }
  }

  private windowButtons(right: number, bw: number) {
    const { ctx, pal } = this
    const { TB } = this.L
    ;(['min', 'max', 'close'] as const).forEach((k, i) => {
      const x = right + i * bw
      const id = `win-${k}`
      if (this.hovered(id)) {
        ctx.fillStyle = k === 'close' ? '#e81123' : pal.default
        ctx.fillRect(x, 0, bw, TB - 1)
      }
      icon(
        ctx,
        k === 'min' ? 'winMin' : k === 'max' ? 'winMax' : 'winClose',
        x + bw / 2,
        TB / 2,
        this.L.compact ? 15 : 16,
        pal.foreground,
      )
      this.region(id, x, 0, bw, TB, () => this.events.windowButton(k))
    })
  }

  private drawTitlebar() {
    if (this.L.compact) return this.drawTitlebarCompact()
    const { ctx, pal, fonts } = this
    const { W, TB } = this.L
    ctx.fillStyle = pal.background
    ctx.fillRect(0, 0, W, TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(0, TB - 1, W, 1)
    drawLogo(ctx, 16, 17, 22, pal.foreground)
    text(ctx, fonts, 'Steam Game Idler', 48, 28, {
      size: 15,
      weight: 600,
      color: pal.foreground,
      family: fonts.display,
    })
    if (SEARCH_PAGES.includes(this.page)) {
      // the search pill, with its Ctrl+K hint
      const sw = 288
      const sx = 576
      fillRR(ctx, sx, 8, sw, 40, 20, pal.default)
      icon(ctx, 'search', sx + 24, 28, 17, pal.muted)
      text(ctx, fonts, 'Search', sx + 40, 28, { size: 15, color: pal.muted })
      fillRR(ctx, sx + sw - 58, 17, 48, 22, 7, pal.surfaceTertiary)
      text(ctx, fonts, 'Ctrl K', sx + sw - 34, 28, {
        size: 12,
        weight: 600,
        color: pal.muted,
        align: 'center',
      })
    }
    // live support, notifications, menu
    icon(ctx, 'headset', W - 265, 28, 19, pal.foreground)
    icon(ctx, 'bell', W - 217, 28, 19, pal.foreground)
    icon(ctx, 'menu', W - 169, 28, 19, pal.foreground)
    this.windowButtons(W - 144, 48)
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
    this.windowButtons(right, 44)
  }

  /** Which nav items show a running dot (SidebarItem's RunningDot) and the gold free-games icon. */
  private navState() {
    const running: Partial<Record<PageId, boolean>> = {
      cardFarming: this.farm.running,
      achievementUnlocker: this.unl.running,
      idling: [...this.idle.values()].some(v => v.owner === 'manual'),
    }
    return { running, gold: this.free.claimedT < 0 }
  }

  /** The window-edge marker beside the active row; it glides between rows with the highlight. */
  private activeMarker(y: number, h: number) {
    fillRR(this.ctx, 0, y + h / 2 - 8, 3, 16, 1.5, this.pal.accent)
  }

  private drawSidebar() {
    if (this.L.compact) return this.drawSidebarRail()
    const { ctx, pal, fonts } = this
    const { TB, SB, H } = this.L
    ctx.fillStyle = pal.background
    ctx.fillRect(0, TB, SB, H - TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(SB - 1, TB, 1, H - TB)
    // the collapse handle on the sidebar's edge
    fillRR(ctx, SB - 3, H / 2 - 12, 4, 24, 2, pal.surfaceTertiary)
    // the active highlight glides between items instead of jumping
    const hy = lerp(this.navFromY, this.navToY, ease.io(prog(this.now, this.pageT, 0.32)))
    fillRR(ctx, 8, hy, SB - 17, 36, 8, pal.default)
    this.activeMarker(hy, 36)
    const active = this.page === 'achievementManager' ? 'games' : this.page
    const { running, gold } = this.navState()
    for (const items of NAV) {
      for (const [id, label, ic] of items) {
        const y = this.navY(id)
        const nid = `nav-${id}`
        const on = id === active
        const hov = this.hovered(nid) && !on
        if (hov) fillRR(ctx, 8, y, SB - 17, 36, 8, 'rgba(255,255,255,0.04)')
        const color = on || hov ? pal.foreground : pal.muted
        const iconColor = id === 'freeGames' && gold ? pal.gold : on ? pal.accent : color
        icon(ctx, ic, 29, y + 18, 19, iconColor, 1.5)
        text(ctx, fonts, label, 50, y + 18, { size: 15, weight: 600, color })
        if (running[id]) {
          ctx.beginPath()
          ctx.arc(SB - 32, y + 18, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = pal.accent
          ctx.fill()
        }
        this.region(nid, 8, y, SB - 17, 36, () => this.navigate(id, true))
      }
    }
    // footer: the account switcher row and settings
    const uy = H - 56
    if (this.hovered('acct') || this.acctOpen) fillRR(ctx, 8, uy, SB - 64, 48, 9, pal.default)
    const [name, , grad] = ACCOUNTS[this.user]
    avatar(ctx, 20, uy + 8, 32, grad)
    text(ctx, fonts, name, 64, uy + 24, { size: 15, weight: 600, color: pal.foreground })
    icon(ctx, 'chevronDown', 184, uy + 24, 17, pal.foreground)
    icon(ctx, 'settings', 228, uy + 24, 18, pal.foreground)
    this.region('acct', 8, uy, SB - 64, 48, () => {
      this.acctOpen = !this.acctOpen
      this.acctT = this.now
      this.anim(0.3)
    })
  }

  /**
   * Compact sidebar: the real app's collapsed icon rail. Same items, order, marker and gold
   * free-games icon as the full sidebar; a running feature's icon turns accent instead of showing a
   * dot, and the account switcher is reduced to its avatar at the bottom.
   */
  private drawSidebarRail() {
    const { ctx, pal } = this
    const { TB, SB, H } = this.L
    ctx.fillStyle = pal.background
    ctx.fillRect(0, TB, SB, H - TB)
    ctx.fillStyle = pal.border
    ctx.fillRect(SB - 1, TB, 1, H - TB)
    const hy = lerp(this.navFromY, this.navToY, ease.io(prog(this.now, this.pageT, 0.32)))
    fillRR(ctx, 8, hy, SB - 16, 42, 10, pal.default)
    this.activeMarker(hy, 42)
    const active = this.page === 'achievementManager' ? 'games' : this.page
    const { running, gold } = this.navState()
    for (const items of NAV) {
      for (const [id, , ic] of items) {
        const y = this.navY(id)
        const nid = `nav-${id}`
        const on = id === active
        if (this.hovered(nid) && !on) fillRR(ctx, 8, y, SB - 16, 42, 10, 'rgba(255,255,255,0.04)')
        const color =
          id === 'freeGames' && gold
            ? pal.gold
            : on || running[id]
              ? pal.accent
              : this.hovered(nid)
                ? pal.foreground
                : pal.muted
        icon(ctx, ic, SB / 2, y + 21, 21, color, 1.5)
        this.region(nid, 8, y, SB - 16, 42, () => this.navigate(id, true))
      }
    }
    // account: just the avatar (opens the same switcher popover)
    const uy = H - 58
    if (this.hovered('acct') || this.acctOpen) fillRR(ctx, 8, uy, SB - 16, 46, 10, pal.default)
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
    const y = this.L.H - (this.L.compact ? 66 : 62) - h - 4 + (1 - p) * 12
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

  /** Small rounded count beside a title or tab (PageToolbar.tsx's CountChip); returns its width. */
  private countChip(n: number, x: number, cy: number, bg = this.pal.default) {
    const { ctx, fonts, pal } = this
    const label = n.toLocaleString('en-US')
    const w = Math.max(22, measure(ctx, fonts, label, 12, 600) + 14)
    fillRR(ctx, x, cy - 11, w, 22, 11, bg)
    text(ctx, fonts, label, x + w / 2, cy + 1, {
      size: 12,
      weight: 600,
      color: pal.muted,
      align: 'center',
      tabular: true,
    })
    return w
  }

  /** A section or page title with its count chip (PageToolbar.tsx's PageTitle). */
  private titleWithCount(title: string, count: number, x: number, cy: number, size = 18) {
    const tw = text(this.ctx, this.fonts, title, x, cy, {
      size,
      weight: 700,
      color: this.pal.foreground,
    })
    return tw + 10 + this.countChip(count, x + tw + 10, cy)
  }

  private tabsWidth(s: TabsStart) {
    const { ctx, fonts } = this
    return (
      8 +
      s.tabs.reduce((sum, [label, count]) => {
        const lw = measure(ctx, fonts, label, 15, 700)
        const cw = Math.max(22, measure(ctx, fonts, count.toLocaleString('en-US'), 12, 600) + 14)
        return sum + lw + cw + 38
      }, 0)
    )
  }

  /** The tab strip (one rounded track, the selected segment raised). */
  private drawTabs(s: TabsStart, x: number, cy: number) {
    const { ctx, pal, fonts } = this
    const h = 42
    const w = this.tabsWidth(s)
    ctx.save()
    if (s.dim) ctx.globalAlpha *= 0.5
    fillRR(ctx, x, cy - h / 2, w, h, h / 2, pal.default)
    let cx = x + 4
    s.tabs.forEach(([label, count], i) => {
      const on = i === s.active
      const lw = measure(ctx, fonts, label, 15, 700)
      const cw = Math.max(22, measure(ctx, fonts, count.toLocaleString('en-US'), 12, 600) + 14)
      const sw = lw + cw + 38
      const id = `${s.id}-tab-${i}`
      if (on) fillRR(ctx, cx, cy - h / 2 + 4, sw, h - 8, (h - 8) / 2, pal.segment)
      else if (this.hovered(id))
        fillRR(ctx, cx, cy - h / 2 + 4, sw, h - 8, (h - 8) / 2, 'rgba(255,255,255,.04)')
      text(ctx, fonts, label, cx + 16, cy + 1, {
        size: 15,
        weight: on ? 700 : 600,
        color: on ? pal.foreground : pal.muted,
      })
      this.countChip(count, cx + 16 + lw + 8, cy, on ? pal.default : 'rgba(255,255,255,.06)')
      if (s.onTab && !s.dim) this.region(id, cx, cy - h / 2, sw, h, () => s.onTab!(i))
      cx += sw
    })
    ctx.restore()
    return w
  }

  private startWidth(s: Start) {
    if (s.kind === 'tabs') return this.tabsWidth(s)
    const tw = measure(this.ctx, this.fonts, s.title, 18, 700)
    return tw + 10 + Math.max(22, measure(this.ctx, this.fonts, String(s.count), 12, 600) + 14)
  }

  /**
   * The one bar of controls above each page's content (PageToolbar.tsx): tabs or a title with its
   * count on the left, controls on the right. In the narrow window the controls wrap onto their own
   * row when they don't fit beside the tabs, as the real bar's `flex-wrap` does. Returns where the
   * page's content starts.
   */
  private toolbar(start: Start | null, actions: Action[]) {
    const { X0, Y0, XR, compact } = this.L
    const shown = actions.filter(a => !(compact && a.wideOnly))
    const cy = Y0 + 20
    const aw = this.actionsWidth(shown)
    const sw = start ? this.startWidth(start) : 0
    const twoRows = compact && start !== null && sw + 12 + aw > this.L.CW
    if (start?.kind === 'tabs') this.drawTabs(start, X0, cy)
    else if (start) this.titleWithCount(start.title, start.count, X0, cy)
    this.actions(shown, XR, twoRows ? cy + 50 : cy)
    this.contentTop = twoRows ? Y0 + 112 : Y0 + 62
    return this.contentTop
  }

  private actionsWidth(list: Action[]) {
    return list.reduce((sum, a, i) => sum + this.actionWidth(a) + (i ? 8 : 0), 0)
  }

  private actionWidth(a: Action) {
    const { ctx, fonts } = this
    const h = this.L.compact ? 34 : 36
    if (a.kind === 'icon') return h
    if (a.kind === 'sort') {
      // compact: just the icon, the label won't fit beside the tabs
      if (this.L.compact) return h
      return Math.round(Math.min(a.maxW ?? 999, measure(ctx, fonts, a.label, 15, 600)) + 84)
    }
    let w = 32 + measure(ctx, fonts, a.label, 15, 600)
    if (a.icon) w += 24
    if (a.tier) w += 64
    return Math.round(w)
  }

  /** Lays actions out right to left from `right`, centred on `cy`. */
  private actions(list: Action[], right: number, cy: number) {
    let x = right
    for (let i = list.length - 1; i >= 0; i--) {
      const a = list[i]
      const w = this.actionWidth(a)
      x -= w
      this.action(a, x, cy, w)
      x -= 8
    }
  }

  private action(a: Action, x: number, cy: number, w: number) {
    const h = this.L.compact ? 34 : 36
    if (a.kind === 'icon') return this.iconBtn(a.id, x, cy - h / 2, a.icon, a.onClick, h, a.dim)
    if (a.kind === 'sort') return this.sortBtn(a, x, cy, w, h)
    this.btn(a, x, cy - h / 2, w, h)
  }

  private sortBtn(a: SortAction, x: number, cy: number, w: number, h: number) {
    const { ctx, pal, fonts } = this
    ctx.save()
    if (a.dim) ctx.globalAlpha *= 0.5
    fillRR(ctx, x, cy - h / 2, w, h, h / 2, this.hovered(a.id) ? pal.segment : pal.default)
    if (this.L.compact) {
      icon(ctx, 'sort', x + w / 2, cy, 17, pal.foreground)
    } else {
      icon(ctx, 'sort', x + 22, cy, 17, pal.foreground)
      text(ctx, fonts, a.label, x + 38, cy + 1, {
        size: 15,
        weight: 600,
        color: pal.foreground,
        maxW: w - 80,
      })
      icon(ctx, 'chevronDown', x + w - 22, cy, 16, pal.muted)
    }
    ctx.restore()
    this.region(a.id, x, cy - h / 2, w, h, a.dim ? undefined : () => {})
  }

  /** `group`: the game card this button belongs to, so hovering it keeps the card hovered */
  private btn(a: BtnAction, x: number, y: number, w = this.actionWidth(a), h = 36, group?: string) {
    const { ctx, pal, fonts } = this
    const hov = this.hovered(a.id)
    const primary = a.variant === 'primary'
    const danger = a.variant === 'danger'
    // a disabled control goes flat grey rather than vanishing, as the real toolbar's do
    const bg = a.dim
      ? pal.default
      : primary
        ? hov
          ? '#e6e6e6'
          : '#ffffff'
        : danger
          ? hov
            ? 'rgb(214 64 69)'
            : pal.danger
          : hov
            ? pal.segment
            : pal.default
    fillRR(ctx, x, y, w, h, h / 2, bg)
    const fg = a.dim ? pal.muted : (a.color ?? (primary ? '#000000' : '#fcfcfc'))
    let cx = x + 16
    if (a.icon) {
      icon(ctx, a.icon, cx + 8, y + h / 2, 16, fg)
      cx += 24
    }
    const tw = text(ctx, fonts, a.label, cx, y + h / 2 + 1, { size: 15, weight: 600, color: fg })
    if (a.tier)
      tierBadge(ctx, fonts, pal, a.tier.toUpperCase(), a.tier, cx + tw + 10, y + h / 2, 'left')
    this.region(a.id, x, y, w, h, a.dim ? undefined : a.onClick, group)
    return w
  }

  /** A round white icon button - the toolbar's refresh/add/settings controls. */
  private iconBtn(
    id: string,
    x: number,
    y: number,
    ic: IconName,
    onClick?: () => void,
    size = 36,
    dim = false,
  ) {
    const { ctx } = this
    ctx.save()
    if (dim) ctx.globalAlpha *= 0.5
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = this.hovered(id) && !dim ? '#e6e6e6' : '#ffffff'
    ctx.fill()
    icon(ctx, ic, x + size / 2, y + size / 2, size * 0.5, '#000')
    ctx.restore()
    this.region(id, x, y, size, size, dim ? undefined : (onClick ?? (() => {})))
  }

  /** A muted section label (a group's title, "Farming (4)", "Up next"). */
  private label(str: string, x: number, y: number) {
    text(this.ctx, this.fonts, str, x, y + 8, { size: 13, weight: 600, color: this.pal.muted })
  }

  private checkbox(id: string, x: number, y: number, on: boolean, onClick: () => void, size = 22) {
    const { ctx, pal } = this
    fillRR(
      ctx,
      x,
      y,
      size,
      size,
      6,
      on ? pal.accent : this.hovered(id) ? pal.surfaceTertiary : pal.default,
    )
    if (on) icon(ctx, 'check', x + size / 2, y + size / 2, size * 0.68, pal.accentFg)
    this.region(id, x - 8, y - 8, size + 16, size + 16, onClick)
  }

  private bar(x: number, y: number, w: number, frac: number, h = 8, track = this.pal.default) {
    fillRR(this.ctx, x, y, w, h, h / 2, track)
    if (frac > 0) fillRR(this.ctx, x, y, Math.max(h, w * clamp01(frac)), h, h / 2, this.pal.accent)
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

  /** A dark pill in a card's corner (GameStatChips.tsx's GameChip); returns its width. */
  private chip(
    x: number,
    y: number,
    corner: 'left' | 'right',
    ic: IconName,
    label: string,
    color = '#ffffff',
  ) {
    const { ctx, fonts } = this
    ctx.font = `700 12px ${fonts.sans}`
    const w = Math.round(measure(ctx, fonts, label, 12, 700) + 30)
    const cx = corner === 'left' ? x : x - w
    fillRR(ctx, cx, y, w, 21, 10.5, 'rgba(0,0,0,.62)')
    icon(ctx, ic, cx + 12, y + 10.5, 12, color)
    text(ctx, fonts, label, cx + 21, y + 11, {
      size: 12,
      weight: 700,
      color,
      tabular: /\d/.test(label),
    })
    return w
  }

  /**
   * GamePosterCard.tsx: the game's cover filling the card, its name over a dark gradient at the
   * bottom, chips in the top corners and the page's own buttons opening below the name on hover
   * (lifting the card, with an accent ring and glow). Returns the card's height.
   */
  private gameCard(name: string, x: number, y: number, w: number, o: CardOpts = {}) {
    const { ctx, pal, fonts } = this
    const g = game(name)
    const h = w * 1.5
    const id = `gc|${o.key ?? this.page}|${name}`
    const idling = this.idle.get(name)
    // hover progress: rising on the card under the pointer, falling on the one it just left
    const hp = this.collect
      ? this.hoverCard === id
        ? ease.out(prog(this.now, this.hoverCardT, 0.15))
        : this.prevHoverCard === id
          ? 1 - ease.out(prog(this.now, this.hoverCardT, 0.15))
          : 0
      : 0
    const reveal = o.revealed ? 1 : hp
    const lift = (o.kick ?? 0) + 4 * hp
    const cy = y - lift
    ctx.save()
    if (o.dim) ctx.globalAlpha *= 0.5
    if (hp > 0) {
      ctx.save()
      ctx.shadowColor = withAlpha(pal.accent, 0.6 * hp)
      ctx.shadowBlur = 18
      fillRR(ctx, x, cy, w, h, 12, pal.surface)
      ctx.restore()
    }
    ctx.save()
    rr(ctx, x, cy, w, h, 12)
    ctx.clip()
    poster(ctx, fonts, this.posters, g, x, cy, w)
    // always there so the name reads, rising on hover to sit behind the buttons too
    const gh = h * (o.meta || o.revealed ? 0.75 : lerp(0.4, 0.75, hp))
    const grad = ctx.createLinearGradient(0, cy + h, 0, cy + h - gh)
    grad.addColorStop(0, 'rgba(0,0,0,.95)')
    grad.addColorStop(0.5, 'rgba(0,0,0,.65)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x, cy + h - gh, w, gh)

    // top corners: an idle timer or the playtime on the left, achievements (or drops) on the right
    const [mins, unlocked, total] = STATS[name] ?? [0, 0, 0]
    const inset = 7
    let leftW = 0
    if (idling) {
      leftW = this.chip(x + inset, cy + inset, 'left', 'play', elapsed(this.now - idling.start))
    } else if (o.chips !== 'none' && mins > 0) {
      leftW = this.chip(x + inset, cy + inset, 'left', 'clock', playtimeLabel(mins))
    }
    // a narrow card can't fit an hours-long timer beside the right chip, so that chip steps aside
    // rather than the two overlapping
    const fits = (label: string) =>
      leftW + measure(ctx, fonts, label, 12, 700) + 30 + inset * 3 <= w
    if (o.selected) {
      ctx.beginPath()
      ctx.arc(x + w - 19, cy + 19, 12, 0, Math.PI * 2)
      ctx.fillStyle = pal.accent
      ctx.fill()
      icon(ctx, 'check', x + w - 19, cy + 19, 15, pal.accentFg)
    } else if (o.drops !== undefined) {
      if (fits(String(o.drops)))
        this.chip(x + w - inset, cy + inset, 'right', 'cards', String(o.drops))
    } else if (o.chips !== 'none' && total > 0 && fits(`${unlocked}/${total}`)) {
      const done = unlocked >= total
      this.chip(
        x + w - inset,
        cy + inset,
        'right',
        'trophy',
        `${unlocked}/${total}`,
        done ? pal.gold : '#ffffff',
      )
    }

    // bottom block, built upwards: the buttons (revealed on hover), the status line, the name
    const pad = 10
    let by = cy + h - pad
    const acts = o.actions ?? []
    const actH = acts.length ? 38 : 0
    by -= actH * reveal
    const metaH = o.meta ? (this.L.compact ? 34 : 36) : 0
    by -= metaH
    ctx.font = `600 15px ${fonts.sans}`
    const lines = wrapLines(ctx, name, w - pad * 2, 3)
    const lh = 19
    const nameTop = by - lines.length * lh
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,.9)'
    ctx.shadowBlur = 4
    lines.forEach((l, i) =>
      text(ctx, fonts, l, x + pad, nameTop + i * lh + lh / 2, {
        size: 15,
        weight: 600,
        color: '#fff',
      }),
    )
    ctx.restore()
    if (o.meta) o.meta(x + pad, by + 4, w - pad * 2)
    // the card's own hover region goes in before its buttons', so they win hit tests
    const regionAt = this.regions.length
    if (acts.length && reveal > 0.02) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, by + metaH, w, actH * reveal + pad)
      ctx.clip()
      ctx.globalAlpha *= reveal
      let ax = x + pad
      const ay = by + metaH + 6
      for (const a of acts) {
        const aid = `${id}|${a.id}`
        if (a.label) {
          // a full-width text button (free games' Claim)
          this.btn(
            {
              kind: 'btn',
              id: a.domId ?? aid,
              label: a.label,
              variant: a.variant ?? 'primary',
              onClick: a.onClick,
              color: a.color,
              dim: a.disabled,
            },
            ax,
            ay,
            w - pad * 2,
            32,
            id,
          )
          continue
        }
        ctx.beginPath()
        ctx.arc(ax + 16, ay + 16, 16, 0, Math.PI * 2)
        ctx.fillStyle = this.hovered(aid) ? '#d9d9d9' : '#ffffff'
        ctx.fill()
        icon(ctx, a.icon!, ax + 16, ay + 16, 15, '#000')
        if (reveal > 0.5) this.region(aid, ax, ay, 32, 32, a.onClick)
        ax += 36
      }
      ctx.restore()
    }
    ctx.restore()
    // the card's ring: accent when selected or hovered, otherwise a faint edge
    const ring = o.selected ? pal.accent : hp > 0.5 ? pal.accent : 'rgba(255,255,255,.1)'
    strokeRR(ctx, x, cy, w, h, 12, ring, o.selected ? 2 : 1)
    ctx.restore()
    if (this.collect)
      this.regions.splice(regionAt, 0, {
        id,
        x,
        y: y - 4,
        w,
        h: h + 4,
        interactive: true,
        cursor: false,
      })
    return h
  }

  /** The play/stop and achievements buttons most game cards open on hover. */
  private playActions(name: string): CardAction[] {
    return [
      {
        id: 'play',
        icon: this.idle.has(name) ? 'stop' : 'play',
        onClick: () => this.toggleIdle(name),
      },
      { id: 'trophy', icon: 'trophy', onClick: () => this.openManager(name) },
    ]
  }

  private openManager(name: string) {
    this.mgr.game = name
    this.resetMgr()
    this.navigate('achievementManager', true)
  }

  /** Lays `names` out on the game grid from `top`. */
  private cardGrid(names: string[], top: number, opts: (name: string) => CardOpts = () => ({})) {
    const G = this.grid()
    names.forEach((n, i) => {
      const y = G.y(top, i)
      if (y > this.L.H) return
      this.gameCard(n, G.x(i), y, G.w, opts(n))
    })
  }

  // --- pages
  // Every page has its wide layout (the desktop window) and, under `this.L.compact`, a reflowed
  // narrow one: three-column grids and a toolbar that wraps its controls onto a second row.

  /** RecommendedBanner.tsx: one game's art at a time, crossfading, with its own controls. */
  private drawBanner() {
    const { ctx, pal, fonts } = this
    const { compact } = this.L
    const [bx, by, bw, bh] = this.bannerRect()
    const cur = REC[this.slide]
    ctx.save()
    rr(ctx, bx, by, bw, bh, 16)
    ctx.clip()
    fillRR(ctx, bx, by, bw, bh, 16, pal.surface)
    const fade = ease.out(prog(this.now, this.slideT, 0.6))
    if (fade < 1) bannerArt(ctx, fonts, this.art, game(REC[this.prevSlide]), bx, by, bw, bh)
    // multiplied, not set: the whole page may itself be fading out mid-navigation
    ctx.globalAlpha *= fade
    bannerArt(ctx, fonts, this.art, game(cur), bx, by, bw, bh)
    ctx.restore()
    strokeRR(ctx, bx, by, bw, bh, 16, 'rgba(255,255,255,.1)')
    const pad = compact ? 18 : 24
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,.6)'
    ctx.shadowBlur = 8
    text(ctx, fonts, 'Recommended', bx + pad, by + pad + (compact ? 14 : 19), {
      size: compact ? 22 : 30,
      weight: 800,
      color: '#fff',
    })
    ctx.restore()
    // Start Idling + manage achievements, bottom-left
    const h = compact ? 34 : 36
    const ry = by + bh - pad - h
    const idling = this.idle.has(cur)
    const startW = this.btn(
      {
        kind: 'btn',
        id: 'rec-idle',
        label: idling ? 'Stop Idling' : 'Start Idling',
        icon: idling ? 'stop' : 'play',
        variant: 'primary',
        onClick: () => this.toggleIdle(cur),
      },
      bx + pad,
      ry,
      undefined,
      h,
    )
    this.glassBtn('rec-trophy', bx + pad + startW + 8, ry, h, 'trophy', () => this.openManager(cur))
    // pager, bottom-right: prev, dots, next
    const dotsW = REC.length * 6 + (REC.length - 1) * 6 + 18
    const nx = bx + bw - pad - h
    this.glassBtn('rec-next', nx, ry, h, 'chevronRight', () => this.goSlide(this.slide + 1))
    const dx = nx - 6 - dotsW
    let cx = dx + 4
    REC.forEach((_, i) => {
      const on = i === this.slide
      fillRR(ctx, cx, ry + h / 2 - 3, on ? 24 : 6, 6, 3, on ? '#ffffff' : 'rgba(255,255,255,.4)')
      cx += (on ? 24 : 6) + 6
    })
    this.glassBtn('rec-prev', dx - 6 - h, ry, h, 'chevronLeft', () => this.goSlide(this.slide - 1))
  }

  /** The banner's see-through round buttons. */
  private glassBtn(
    id: string,
    x: number,
    y: number,
    size: number,
    ic: IconName,
    onClick: () => void,
  ) {
    const { ctx } = this
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = this.hovered(id) ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.16)'
    ctx.fill()
    icon(ctx, ic, x + size / 2, y + size / 2, size * 0.44, '#fff')
    this.region(id, x, y, size, size, onClick)
  }

  private drawGames() {
    const { X0, XR, compact } = this.L
    this.drawBanner()
    const [, by, , bh] = this.bannerRect()
    const cy = by + bh + 34
    this.titleWithCount('All Games', LIBRARY_SIZE, X0, cy)
    this.actions(
      [
        { kind: 'sort', id: 'games-sort', label: 'Playtime (High to Low)' },
        { kind: 'icon', id: 'games-refresh', icon: 'refresh' },
      ],
      XR,
      cy,
    )
    this.contentTop = cy + (compact ? 30 : 34)
    this.cardGrid(BY_PLAYTIME, this.contentTop, n => ({ actions: this.playActions(n) }))
  }

  private drawIdling() {
    const { ctx, pal, fonts } = this
    const { X0, CW, XR, H, compact } = this.L
    const n = this.idle.size
    const top = this.toolbar(
      { kind: 'title', title: 'Idling', count: n },
      n
        ? [
            {
              kind: 'btn',
              id: 'idle-stopall',
              label: 'Stop all',
              icon: 'stop',
              variant: 'danger',
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
      // IdlingEmptyBanner: what idling is, and the two ways to start some
      const w = Math.min(CW, 620)
      const bx = X0 + (CW - w) / 2
      const by = compact ? 260 : 250
      const bh = compact ? 300 : 270
      this.card(bx, by, w, bh, 20)
      icon(ctx, 'idling', bx + w / 2, by + 62, 40, pal.accent)
      text(ctx, fonts, "Nothing's idling right now.", bx + w / 2, by + 118, {
        size: compact ? 20 : 22,
        weight: 700,
        color: pal.foreground,
        align: 'center',
      })
      ctx.font = `500 15px ${fonts.sans}`
      const desc = wrapLines(
        ctx,
        "Go to the Games page, hover over a game and press the play button. It'll show up here while it idles.",
        w - 60,
        3,
      )
      desc.forEach((l, i) =>
        text(ctx, fonts, l, bx + w / 2, by + 152 + i * 21, {
          size: 15,
          color: pal.muted,
          align: 'center',
        }),
      )
      const browse: BtnAction = {
        kind: 'btn',
        id: 'idle-browse',
        label: 'Browse your games',
        variant: 'primary',
        onClick: () => this.navigate('games', true),
      }
      const auto: BtnAction = {
        kind: 'btn',
        id: 'idle-auto',
        label: 'Set up Automatic Idler',
        variant: 'secondary',
        onClick: () => this.navigate('autoIdle', true),
      }
      const bw1 = this.actionWidth(browse)
      const bw2 = this.actionWidth(auto)
      const rowY = by + bh - 60
      if (compact) {
        this.btn(browse, bx + (w - bw1) / 2, rowY - 44)
        this.btn(auto, bx + (w - bw2) / 2, rowY)
      } else {
        const sx = bx + (w - bw1 - bw2 - 10) / 2
        this.btn(browse, sx, rowY)
        this.btn(auto, sx + bw1 + 10, rowY)
      }
      return
    }
    // grouped by owning feature, in groupIdlingGames.ts's precedence order
    const groups: [Owner, string, () => void][] = [
      ['farm', 'Card Farming', () => this.stopFarm()],
      ['unl', 'Achievement Unlocker', () => this.stopUnlocker()],
      ['auto', 'Automatic Idler', () => this.stopOwner('auto')],
      ['manual', 'Manually idled', () => this.stopOwner('manual')],
    ]
    const G = this.grid()
    let y = top
    for (const [owner, title, stop] of groups) {
      const games = [...this.idle.entries()].filter(([, v]) => v.owner === owner)
      if (!games.length) continue
      if (y > H) break
      this.titleWithCount(title, games.length, X0, y + 8, 15)
      const stopBtn: BtnAction = {
        kind: 'btn',
        id: `idle-stop-${owner}`,
        label: 'Stop',
        icon: 'stop',
        variant: 'danger',
        onClick: stop,
      }
      const sw = this.actionWidth(stopBtn) - 6
      this.btn(stopBtn, XR - sw, y - 7, sw, 30)
      y += 36
      const names = games.map(([name]) => name)
      this.cardGrid(names, y, name => ({ actions: this.playActions(name), key: `idle-${owner}` }))
      y += Math.ceil(names.length / G.cols) * (G.h + G.gap + 1) + 14
    }
  }

  private stopOwner(owner: Owner) {
    for (const [g, v] of this.idle) if (v.owner === owner) this.idle.delete(g)
    this.anim(0.4)
    this.emitStats()
  }

  private drawFavorites() {
    const favs = BY_PLAYTIME.filter(n => this.favorites.has(n))
    const top = this.toolbar(
      {
        kind: 'tabs',
        id: 'fav',
        tabs: [
          ['All Games', LIBRARY_SIZE],
          ['Favorites', favs.length],
        ],
        active: this.favTab,
        onTab: i => {
          this.favTab = i
          this.anim(0.3)
        },
      },
      [
        { kind: 'sort', id: 'fav-sort', label: 'Playtime (High to Low)' },
        { kind: 'icon', id: 'fav-add', icon: 'plus' },
      ],
    )
    // All Games marks the favorites it already holds; the Favorites tab lists just them
    const names = this.favTab === 0 ? BY_PLAYTIME : favs
    this.cardGrid(names, top, n => ({
      selected: this.favorites.has(n),
      key: `fav-${this.favTab}`,
      actions: [
        { id: 'play', icon: this.idle.has(n) ? 'stop' : 'play', onClick: () => this.toggleIdle(n) },
        {
          id: 'fav',
          icon: this.favorites.has(n) ? 'heartFilled' : 'favorites',
          onClick: () => this.toggleFavorite(n),
        },
      ],
    }))
  }

  private drawAutoIdle() {
    const top = this.toolbar(
      {
        kind: 'tabs',
        id: 'auto',
        tabs: [
          ['All Games', LIBRARY_SIZE],
          ['Queue', AUTO_IDLE.length],
        ],
        active: 1,
      },
      [
        { kind: 'sort', id: 'auto-sort', label: 'Playtime (High to Low)' },
        { kind: 'icon', id: 'auto-add', icon: 'plus' },
      ],
    )
    this.cardGrid(AUTO_IDLE, top, n => ({ actions: this.playActions(n) }))
  }

  /** Where the free game's Claim button sits (its centre), for the confetti burst. */
  private freeClaimAt(): [number, number] {
    const r = this.regionRect('free-claim')
    return r ? [r[0] + r[2] / 2, r[1] + r[3] / 2] : [this.L.X0 + 90, this.contentTop + 230]
  }

  private drawFree() {
    const { ctx, pal, fonts } = this
    const { X0, CW, compact } = this.L
    const name = FREE_GAMES[this.free.idx % FREE_GAMES.length]
    const claimed = this.free.claimedT >= 0
    const top = this.toolbar({ kind: 'title', title: 'Free Games', count: 1 }, [
      { kind: 'icon', id: 'free-refresh', icon: 'refresh', onClick: () => this.nextFreeGame() },
      { kind: 'icon', id: 'free-settings', icon: 'settings' },
    ])
    const G = this.grid()
    // FreeGameCard: always open, its one action a full-width Claim (Claimed once granted)
    const pop = claimed ? ease.back(prog(this.now, this.free.claimedT, 0.35)) : 1
    ctx.save()
    const cx = X0 + G.w / 2
    const cy = top + G.h - 26
    ctx.translate(cx, cy)
    ctx.scale(0.94 + 0.06 * pop, 0.94 + 0.06 * pop)
    ctx.translate(-cx, -cy)
    this.gameCard(name, X0, top, G.w, {
      revealed: true,
      chips: 'none',
      selected: claimed,
      key: 'free',
      actions: [
        claimed
          ? {
              id: 'claim',
              label: 'Claimed',
              variant: 'secondary',
              color: pal.success,
              domId: 'free-claim',
              disabled: true,
            }
          : {
              id: 'claim',
              label: 'Claim',
              variant: 'primary',
              domId: 'free-claim',
              onClick: () => this.claimFree(),
            },
      ],
    })
    ctx.restore()
    // illustrative: the notification the app pops when a game goes free - beside the card when
    // wide, under it when compact
    const nx = compact ? X0 : X0 + G.w + 24
    const ny = compact ? top + G.h + 20 : top
    const nw = compact ? CW : Math.min(460, CW - G.w - 24)
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

  /** Card farming's tabs, shared by both states; locked while a run is in progress. */
  private farmTabs(dim: boolean): TabsStart {
    return {
      kind: 'tabs',
      id: 'farm',
      tabs: [
        ['Games With Drops', FARM_POOL.length],
        ['Whitelisted', 0],
        ['Blacklisted', 0],
      ],
      active: 0,
      dim,
    }
  }

  private drawFarmIdle() {
    const top = this.toolbar(this.farmTabs(false), [
      { kind: 'sort', id: 'farm-sort', label: 'Drops Remaining (High to Low)', maxW: 160 },
      { kind: 'icon', id: 'farm-settings', icon: 'settings' },
      {
        kind: 'btn',
        id: 'farm-start',
        label: 'Start',
        icon: 'play',
        variant: 'primary',
        onClick: () => this.startFarm(),
      },
    ])
    this.cardGrid(FARM_POOL, top, n => ({ drops: FARM_DROPS[FARM_POOL.indexOf(n)] }))
  }

  private drawFarmRun() {
    const { ctx, pal, fonts } = this
    const { X0, CW, XR, compact } = this.L
    const f = this.farm
    const n = f.slots.length
    const top = this.toolbar(this.farmTabs(true), [
      {
        kind: 'sort',
        id: 'farm-sort',
        label: 'Drops Remaining (High to Low)',
        maxW: 160,
        dim: true,
      },
      { kind: 'icon', id: 'farm-settings', icon: 'settings' },
      {
        kind: 'btn',
        id: 'farm-stop',
        label: 'Stop farming',
        icon: 'stop',
        variant: 'danger',
        onClick: () => this.stopFarm(),
      },
    ])
    this.label(`Farming (${n})`, X0, top)
    f.slots.forEach((s, i) => {
      const b = this.farmCardBox(i)
      // a drop gives the cover a little kick
      const kick = Math.sin(prog(this.now, s.dropT, 0.4) * Math.PI) * 6
      const done = s.doneT >= 0
      const shown = s.total - s.left - 1 + ease.out(prog(this.now, s.dropT, 0.45))
      this.gameCard(s.game, b.x, b.y, b.w, {
        revealed: true,
        kick,
        key: 'farm-run',
        // CardFarmingActiveCard: the run's progress and what's left, always on show
        meta: (mx, my, mw) => {
          this.bar(
            mx,
            my,
            mw,
            (s.left === s.total ? 0 : shown) / s.total,
            6,
            'rgba(255,255,255,.22)',
          )
          text(
            ctx,
            fonts,
            done
              ? 'Nothing left to farm'
              : `${s.left} ${s.left === 1 ? 'drop' : 'drops'} remaining`,
            mx,
            my + 22,
            {
              size: compact ? 12 : 13,
              weight: 600,
              color: done ? pal.success : 'rgba(255,255,255,.85)',
              maxW: mw,
            },
          )
        },
      })
    })
    const last = this.farmCardBox(n - 1)
    const qy = last.y + last.h + 22
    this.label(`Up next (${f.queue.length})`, X0, qy)
    this.card(X0, qy + 26, CW, 12 + f.queue.length * 52, 16)
    f.queue.forEach((q, i) => {
      const ry = qy + 38 + i * 52
      fillRR(ctx, X0 + 12, ry, CW - 24, 44, 10, pal.default)
      text(ctx, fonts, q, X0 + 28, ry + 23, { size: 15, weight: 600, color: pal.foreground })
      icon(ctx, 'autoIdle', XR - 158, ry + 22, 15, pal.muted)
      text(ctx, fonts, 'Waiting its turn', XR - 144, ry + 23, {
        size: 13,
        weight: 500,
        color: pal.muted,
      })
    })
  }

  /** The unlocker's tabs + controls, shared by both states (locked while it runs). */
  private unlToolbar() {
    const running = this.unl.running
    return this.toolbar(
      {
        kind: 'tabs',
        id: 'unl',
        tabs: [
          ['All Games', LIBRARY_SIZE],
          ['Queue', UNL_GAMES.length],
        ],
        active: 1,
        dim: running,
      },
      [
        {
          kind: 'btn',
          id: 'unl-addall',
          label: 'Add all to queue',
          variant: 'secondary',
          dim: running,
          wideOnly: true,
        },
        { kind: 'sort', id: 'unl-sort', label: 'Playtime (High to Low)', dim: running },
        { kind: 'icon', id: 'unl-add', icon: 'plus', dim: running },
        { kind: 'icon', id: 'unl-settings', icon: 'settings' },
        running
          ? {
              kind: 'btn',
              id: 'unl-toggle',
              label: 'Stop',
              icon: 'stop',
              variant: 'danger',
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
      ],
    )
  }

  private drawUnlockerIdle() {
    const top = this.unlToolbar()
    this.cardGrid(UNL_GAMES, top, n => ({ actions: this.playActions(n) }))
  }

  /**
   * The unlocker's running view: the current-game card, "Up next" and the "Recently unlocked"
   * feed - side by side when wide, stacked when compact.
   */
  private unlLayout() {
    const { X0, CW, H, compact } = this.L
    const top = this.contentTop
    if (compact) {
      const up = { x: X0, y: top + 320, w: CW }
      const feedY = up.y + 168
      return {
        cur: { x: X0, y: top, w: CW, h: 300 },
        up,
        feed: { x: X0, y: feedY, w: CW, h: Math.max(140, H - feedY - 46) },
      }
    }
    return {
      cur: { x: X0, y: top, w: 540, h: H - top - 24 },
      up: { x: X0 + 560, y: top, w: CW - 560 },
      feed: { x: X0 + 560, y: top + 170, w: CW - 560, h: H - top - 24 - 196 },
    }
  }

  /** Where a new unlock appears (top row of the feed), for its spark burst. */
  private unlFeedPoint(): [number, number] {
    const f = this.unlLayout().feed
    return [f.x + f.w / 2, f.y + 26 + 12 + 29]
  }

  private drawUnlockerRun() {
    const { ctx, pal, fonts } = this
    const { compact } = this.L
    const u = this.unl
    const cur = UNL_GAMES[u.gameIdx]
    this.unlToolbar()
    const L = this.unlLayout()
    const c = L.cur
    const cx = c.x + c.w / 2
    this.card(c.x, c.y, c.w, c.h)
    const capW = compact ? 300 : 420
    const capY = compact ? c.y + 22 : c.y + 80
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
      u.done ? `${left} ${left === 1 ? 'achievement' : 'achievements'} remaining` : 'Starting…',
      cx,
      ty + (compact ? 112 : 134),
      { size: compact ? 15 : 16, weight: 600, color: pal.accent, align: 'center' },
    )
    const { x: rx, y: uy, w: rw } = L.up
    this.label('Up next', rx, uy)
    this.card(rx, uy + 26, rw, 116, 16)
    ;[1, 2].forEach((k, i) => {
      const ry = uy + 38 + i * 52
      fillRR(ctx, rx + 12, ry, rw - 24, 44, 10, pal.default)
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
      if (i === 0) ctx.globalAlpha *= enter
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
    if (compact) {
      let x = X0
      for (const a of actions) {
        const w = this.actionWidth(a)
        this.action(a, x, Y0 + 110, w)
        x += w + 8
      }
    } else this.actions(actions, XR, Y0 + 40)
    this.drawTabs(
      {
        kind: 'tabs',
        id: 'mgr',
        tabs: [
          ['Achievements', 30],
          ['Statistics', 4],
        ],
        active: 0,
      },
      X0,
      Y0 + (compact ? 170 : 152),
    )
    const rowH = compact ? 72 : 78
    m.achs.forEach((a, i) => {
      const y = this.mgrRowY(i)
      const flip = prog(this.now, a.flipT, 0.45)
      const pop = a.flipT > this.now - 1 ? 1 + 0.18 * Math.sin(flip * Math.PI) : 1
      fillRR(ctx, X0, y, CW, rowH, 14, pal.surface)
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
      const bw = this.actionWidth(b)
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
      this.btn(b, bx, y + rowH / 2 - 17, bw, 34)
    })
  }

  /** Inventory grid: four item cards beside the filter panel wide, two compact. */
  private invGrid() {
    const { compact, X0, XR } = this.L
    const left = compact ? X0 : X0 + 224
    const cols = compact ? 2 : 4
    const gap = compact ? 12 : 16
    const w = (XR - left - gap * (cols - 1)) / cols
    return {
      cols,
      w,
      x: (col: number) => left + col * (w + gap),
      top: this.contentTop - 8,
      cardH: 264,
      rowH: 280,
    }
  }

  private invPriceCentre(i: number): [number, number] {
    const G = this.invGrid()
    const row = Math.floor(i / G.cols)
    return [G.x(i % G.cols) + G.w / 2, G.top + row * G.rowH + 214]
  }

  /** InventoryManagerPage's left column: search, sort and the item-type filters. */
  private drawInvFilters(top: number) {
    const { ctx, pal, fonts } = this
    const { X0, H } = this.L
    const w = 183
    fillRR(ctx, X0, top + 4, w, 36, 18, pal.default)
    icon(ctx, 'search', X0 + 20, top + 22, 16, pal.muted)
    text(ctx, fonts, 'Search', X0 + 38, top + 23, { size: 15, color: pal.muted })
    ctx.letterSpacing = '0.04em'
    text(ctx, fonts, 'SORT BY', X0 + 4, top + 66, { size: 12, weight: 600, color: pal.muted })
    ctx.letterSpacing = '0px'
    fillRR(ctx, X0, top + 82, w, 36, 18, pal.default)
    icon(ctx, 'sort', X0 + 20, top + 100, 16, pal.foreground)
    text(ctx, fonts, 'Name (A-Z)', X0 + 38, top + 101, {
      size: 15,
      weight: 600,
      color: pal.foreground,
    })
    icon(ctx, 'chevronDown', X0 + w - 20, top + 100, 15, pal.muted)
    ctx.fillStyle = pal.border
    ctx.fillRect(X0, top + 138, w, 1)
    ctx.letterSpacing = '0.04em'
    text(ctx, fonts, 'FILTER', X0 + 4, top + 160, { size: 12, weight: 600, color: pal.muted })
    ctx.letterSpacing = '0px'
    INV_FILTERS.forEach(([label, ic], i) => {
      const y = top + 192 + i * 40
      if (y > H - 20) return
      const on = i === 0
      icon(ctx, ic, X0 + 18, y, 16, on ? pal.foreground : pal.muted, 1.5)
      text(ctx, fonts, label, X0 + 36, y + 1, {
        size: 15,
        weight: on ? 700 : 500,
        color: on ? pal.foreground : pal.muted,
      })
      if (on) icon(ctx, 'check', X0 + w - 18, y, 15, pal.foreground)
    })
    ctx.fillStyle = pal.border
    ctx.fillRect(X0 + 200, top - 8, 1, H - top + 8)
  }

  private drawInventory() {
    const { ctx, pal, fonts } = this
    const { compact } = this.L
    const sel = this.inv.items.filter(i => i.selected).length
    const top = this.toolbar({ kind: 'title', title: 'Inventory Manager', count: INV_TOTAL }, [
      {
        kind: 'btn',
        id: 'inv-list',
        label: `List selected (${sel})`,
        variant: 'primary',
        dim: !sel,
        onClick: () => this.listSelected(),
      },
      {
        kind: 'btn',
        id: 'inv-sellall',
        label: `List all (${INV_TOTAL})`,
        variant: 'secondary',
        wideOnly: true,
      },
      {
        kind: 'btn',
        id: 'inv-dupes',
        label: 'List dupes',
        variant: 'secondary',
        tier: 'gamer',
        onClick: () => this.toast('List dupes is part of the Gamer plan', 'sparkles', pal.gamer),
      },
      {
        kind: 'btn',
        id: 'inv-remove',
        label: 'Remove listings',
        variant: 'danger',
        wideOnly: true,
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
      { kind: 'icon', id: 'inv-settings', icon: 'settings', wideOnly: true },
    ])
    if (!compact) this.drawInvFilters(top)
    const G = this.invGrid()
    const w = G.w
    this.inv.items.forEach((it, i) => {
      const x = G.x(i % G.cols)
      const y = G.top + Math.floor(i / G.cols) * G.rowH
      if (y > this.L.H) return
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
      this.checkbox(`inv-cb-${i}`, x + 12, y + 12, it.selected, () => this.toggleInv(i), 18)
      if (!listed) this.region(`inv-${i}`, x, y + 40, w, 130, () => this.toggleInv(i))
      icon(ctx, 'lockOpen', x + w - 46, y + 21, 15, pal.muted)
      icon(ctx, 'x', x + w - 20, y + 21, 16, pal.foreground)
      // drop-shadowed item art, cached as a sprite (160x140 box centred on the art's centre)
      ctx.save()
      ctx.translate(x + w / 2, y + 82)
      ctx.scale(0.86, 0.86)
      sprite(ctx, `inv:${it.kind}:${it.game}`, -80, -70, 160, 140, c =>
        invArt(c, this.art, it.kind, game(it.game), 80, 70),
      )
      ctx.restore()
      text(ctx, fonts, it.name, x + w / 2, y + 155, {
        size: 15,
        weight: 700,
        color: pal.foreground,
        align: 'center',
        maxW: w - 24,
      })
      text(ctx, fonts, it.type, x + w / 2, y + 177, {
        size: 13,
        color: pal.muted,
        align: 'center',
        maxW: w - 24,
      })
      // price field with its stepper, and the sell button beside it
      const fx = x + 20
      const fw = w - 40 - 44
      fillRR(ctx, fx, y + 196, fw, 36, 10, pal.default)
      text(ctx, fonts, it.price, fx + 14, y + 215, {
        size: 15,
        weight: 600,
        color: listed ? pal.success : pal.foreground,
        tabular: true,
      })
      icon(ctx, 'chevronDown', fx + fw - 16, y + 221, 12, pal.muted)
      ctx.save()
      ctx.translate(fx + fw - 16, y + 209)
      ctx.scale(1, -1)
      icon(ctx, 'chevronDown', 0, 0, 12, pal.muted)
      ctx.restore()
      ctx.beginPath()
      ctx.arc(x + w - 38, y + 214, 18, 0, Math.PI * 2)
      ctx.fillStyle = pal.default
      ctx.fill()
      icon(ctx, 'cube', x + w - 38, y + 214, 16, pal.muted)
      if (listed) {
        const s = 0.8 + 0.2 * ease.back(prog(this.now, it.listedT, 0.35))
        ctx.save()
        ctx.translate(x + w / 2, y + 248)
        ctx.scale(s, s)
        icon(ctx, 'check', -30, 0, 15, pal.success)
        text(ctx, fonts, 'Listed', -18, 1, { size: 14, weight: 700, color: pal.success })
        ctx.restore()
      } else {
        text(ctx, fonts, 'Fetch price', x + w / 2 - 8, y + 248, {
          size: 13,
          color: pal.muted,
          align: 'center',
        })
        icon(ctx, 'arrowRight', x + w / 2 + 38, y + 248, 13, pal.muted)
      }
    })
  }
}

// ---------------------------------------------------------------------------------- static pieces

/** The left side of a page's toolbar: a title with a count, or a tab strip. */
type Start = { kind: 'title'; title: string; count: number } | TabsStart
interface TabsStart {
  kind: 'tabs'
  id: string
  /** label + count chip per tab */
  tabs: [string, number][]
  active: number
  onTab?: (i: number) => void
  /** locked (e.g. while a run is in progress) */
  dim?: boolean
}

type Action = BtnAction | IconAction | SortAction
interface BtnAction {
  kind: 'btn'
  id: string
  label: string
  icon?: IconName
  variant: 'primary' | 'secondary' | 'danger'
  tier?: 'casual' | 'gamer'
  dim?: boolean
  color?: string
  /** dropped from the narrow window's toolbar, which can't fit every control */
  wideOnly?: boolean
  onClick?: () => void
}
interface IconAction {
  kind: 'icon'
  id: string
  icon: IconName
  dim?: boolean
  wideOnly?: boolean
  onClick?: () => void
}
/** a sort dropdown (icon only in the narrow window) */
interface SortAction {
  kind: 'sort'
  id: string
  label: string
  /** label width cap, ellipsised past it */
  maxW?: number
  dim?: boolean
  wideOnly?: boolean
}

/** A button a game card opens on hover: a round icon button, or a full-width labelled one. */
interface CardAction {
  id: string
  icon?: IconName
  label?: string
  variant?: BtnAction['variant']
  color?: string
  disabled?: boolean
  /** a fixed region id (for the beacon/confetti), instead of the card-scoped one */
  domId?: string
  onClick?: () => void
}

interface CardOpts {
  actions?: CardAction[]
  /** buttons and status always on show (GamePosterCard's isAlwaysRevealed) */
  revealed?: boolean
  selected?: boolean
  dim?: boolean
  /** drops remaining, shown in the top-right chip instead of achievements */
  drops?: number
  chips?: 'stats' | 'none'
  /** a status block above the buttons (draws at x, y within width w) */
  meta?: (x: number, y: number, w: number) => void
  /** px the card is nudged up by (a card drop's kick) */
  kick?: number
  /** keeps hover state apart when one game appears in two places on a page */
  key?: string
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
  'M206.3 57.21Q228.46 70.21 228.46 96V160Q228.46 186 205.94 199L150.52 231Q128 244 105.48 231L83.69 218.42L165.26 171.33Q175.65 165.33 175.65 153.33V138.07Q175.65 132.07 173.05 130.57Q170.45 129.07 165.26 132.07L145 143.77V92.6L206.3 57.21ZM150.52 25 172.31 37.58 90.74 84.67Q80.35 90.67 80.35 102.67V117.93Q80.35 123.93 82.95 125.43Q85.55 126.93 90.74 123.93L111 112.23V163.4L49.7 198.79Q27.54 185.79 27.54 160V96Q27.54 70 50.06 57L105.48 25Q128 12 150.52 25Z'
let logoPath: Path2D | null = null

export function drawLogo(ctx: Ctx, x: number, y: number, size: number, color: string) {
  logoPath ??= new Path2D(LOGO_PATH)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 256, size / 256)
  ctx.fillStyle = color
  ctx.fill(logoPath)
  ctx.restore()
}
