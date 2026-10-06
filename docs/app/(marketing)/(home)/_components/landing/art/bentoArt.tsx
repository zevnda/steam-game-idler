'use client'

// The feature bento's illustrations. Each one is a little storyboard that plays while its tile is
// hovered (or on screen, on touch devices) and snaps back when it stops - every scene is a pure
// function of `t`, the seconds since play started (0 = the resting state). Coordinates are px
// inside each scene's fixed-size `.art-stage`, so the scripted cursor lines up with its targets.
//
// Same honesty rules as the 3D demo: fictional games, the desktop app's real UI wording.
import type { ThemeId } from '../showcase/engine/palette'
import { FaLinux, FaWindows } from 'react-icons/fa6'
import {
  TbBell,
  TbCheck,
  TbGift,
  TbLock,
  TbLockOpen,
  TbPlayerPlayFilled,
  TbTag,
  TbTrophy,
} from 'react-icons/tb'
import { game, GAMES } from '../showcase/engine/games'
import { THEMES } from '../showcase/engine/palette'
import { Burst, easeBack, easeInOut, easeOut, FakeCursor, prog } from './storyboard'
import Image from 'next/image'

const grad = (name: string, deg = 150) => {
  const g = game(name)
  return `linear-gradient(${deg}deg, ${g.c[0]}, ${g.c[1]})`
}
const achGrad = (h: number) => `linear-gradient(135deg,hsl(${h} 70% 58%),hsl(${h + 30} 55% 34%))`

// ------------------------------------------------------------------------------ Card Farming

const FARM_ROWS = [
  { name: 'Starfall Tactics', total: 5, left: 3 },
  { name: 'Crimson Circuit', total: 4, left: 2 },
  { name: 'Orbit Runners', total: 5, left: 4 },
]
/** [row, time] - uneven, like real drops */
const FARM_DROPS: [number, number][] = [
  [0, 0.7],
  [2, 1.5],
  [1, 2.3],
  [0, 3.2],
]
export const FARM_LOOP = 5

/** Cards fan out, drops tick down row by row, each drop flies a card into the fan. */
export function FarmArt({ t }: { t: number }) {
  const open = t > 0
  // the front card flips over (showing its back) and back again, in 3D
  const flip = 180 * (easeInOut(prog(t, 1.9, 0.6)) - easeInOut(prog(t, 4.0, 0.6)))
  const fan = ['Starfall Tactics', 'Neon Drift', 'Skyward Isles']
  return (
    <div className='art-stage art-stage--farm'>
      <div className={`farm-fan ${open ? 'farm-fan--open' : ''}`}>
        {fan.map((n, i) => (
          <div key={n} className='farm-card' style={{ '--i': i - 1 } as React.CSSProperties}>
            <div
              className='farm-card__flip'
              style={{ transform: `rotateY(${i === 2 ? flip : 0}deg)` }}
            >
              <div className='farm-card__face' style={{ background: grad(n) }}>
                <span>{n}</span>
              </div>
              <div className='farm-card__face farm-card__face--back'>
                <Image src='/logo.png' alt='' width={34} height={34} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='farm-rows'>
        {FARM_ROWS.map((r, row) => {
          const dropped = FARM_DROPS.filter(([d, at]) => d === row && t >= at).length
          const left = r.left - dropped
          const lastDrop = Math.max(
            -9,
            ...FARM_DROPS.filter(([d, at]) => d === row && t >= at).map(([, at]) => at),
          )
          const kick = Math.sin(prog(t, lastDrop, 0.35) * Math.PI)
          return (
            <div
              key={r.name}
              className='art-row relative'
              style={{ transform: `translateX(${-kick * 4}px)` }}
            >
              <div className='flex justify-between text-[12px]'>
                <span className='text-text-primary font-medium'>{r.name}</span>
                <span className='text-sky-400 tabular-nums'>
                  {left} {left === 1 ? 'drop' : 'drops'} left
                </span>
              </div>
              <div className='art-bar'>
                <i style={{ width: `${((r.total - left) / r.total) * 100}%` }} />
              </div>
              {t >= lastDrop && t < lastDrop + 0.9 && (
                <span
                  className='farm-plus'
                  style={{
                    opacity: 1 - prog(t, lastDrop + 0.4, 0.5),
                    transform: `translateY(${-18 * easeOut(prog(t, lastDrop, 0.9))}px)`,
                  }}
                >
                  +1 card
                </span>
              )}
            </div>
          )
        })}
      </div>
      {/* each drop launches a card from its row into the fan */}
      {FARM_DROPS.map(([row, at]) => {
        const p = prog(t, at, 0.8)
        if (t < at || p >= 1) return null
        const e = easeInOut(p)
        const x = 350 + (125 - 350) * e
        const y = 34 + row * 56 + (70 - (34 + row * 56)) * e - Math.sin(p * Math.PI) * 50
        return (
          <span
            key={`${row}-${at}`}
            className='farm-fly'
            style={{
              background: grad(FARM_ROWS[row].name),
              transform: `translate(${x}px, ${y}px) rotate(${-20 + 380 * e}deg) rotateY(${180 * e}deg) scale(${0.6 + 0.4 * Math.sin(p * Math.PI)})`,
              opacity: 1 - prog(t, at + 0.65, 0.15),
            }}
          />
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------------ Achievement Unlocker

const UNL_ROWS = [
  { name: 'Master Tactician', clock: '14:08', hue: 280 },
  { name: 'Night Shift', clock: '14:19', hue: 210 },
  { name: 'Hold the Line', clock: '14:23', hue: 30 },
]
/** deliberately uneven - the unlocker waits a random delay between unlocks */
const UNL_TIMES = [0.6, 1.9, 2.45]
export const UNL_LOOP = 4.8

export function UnlockerArt({ t }: { t: number }) {
  // the "next unlock" bar refills over each (different) gap
  const bounds = [0, ...UNL_TIMES, UNL_LOOP]
  let wait = 0
  for (let i = 0; i < bounds.length - 1; i++)
    if (t >= bounds[i] && t < bounds[i + 1]) wait = (t - bounds[i]) / (bounds[i + 1] - bounds[i])
  const done = UNL_TIMES.filter(u => t > 0 && t >= u).length
  return (
    <div className='art-stage' style={{ width: 300, height: 190 }}>
      <div className='flex items-center justify-between text-[11px] text-text-muted mb-1.5'>
        <span>
          Starfall Tactics · <span className='text-text-primary tabular-nums'>{24 - done}</span>{' '}
          remaining
        </span>
        <span>Next unlock</span>
      </div>
      <div className='art-bar mb-3'>
        <i style={{ width: `${(t > 0 ? wait : 0.35) * 100}%`, background: '#a78bfa' }} />
      </div>
      <div className='flex flex-col gap-2'>
        {UNL_ROWS.map((r, i) => {
          const at = UNL_TIMES[i]
          const unlocked = t > 0 && t >= at
          const pop = unlocked ? easeBack(prog(t, at, 0.45)) : 1
          const fresh = unlocked && t < at + 1
          return (
            <div key={r.name} className={`art-feed relative ${fresh ? 'art-feed--new' : ''}`}>
              <span
                className='art-ach'
                style={{
                  background: unlocked ? achGrad(r.hue) : '#34343a',
                  transform: `scale(${pop})`,
                }}
              >
                {unlocked ? <TbTrophy /> : <TbLock className='text-white/40' />}
              </span>
              <span className={`flex-1 truncate ${unlocked ? '' : 'text-text-muted'}`}>
                {r.name}
              </span>
              <span className='text-text-muted tabular-nums'>{unlocked ? r.clock : '--:--'}</span>
              <TbCheck
                className={`transition-opacity duration-300 ${unlocked ? 'text-emerald-400 opacity-100' : 'opacity-0'}`}
              />
              {fresh && (
                <Burst
                  key={r.name}
                  x={26}
                  y={20}
                  colors={['#ffd36b', '#fff2c4', '#c4b5fd']}
                  count={10}
                  spread={30}
                  shape='star'
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------- Achievement Manager

const MGR_ROWS = [
  { name: 'Green Thumb', hue: 150, start: true },
  { name: 'Master Farmer', hue: 30, start: false },
  { name: 'Well Travelled', hue: 200, start: false },
]
const MGR_SELECT = [0.8, 1.35] // ticks rows 1 and 2
const MGR_APPLY = 2.05
const MGR_LOCK = 3.25 // then locks row 0 with its own button
export const MGR_LOOP = 5.4

/** A cursor ticks two achievements, applies them, then locks a third with its row button. */
export function ManagerArt({ t }: { t: number }) {
  const on = t > 0
  const selected = [
    false,
    on && t >= MGR_SELECT[0] && t < MGR_APPLY,
    on && t >= MGR_SELECT[1] && t < MGR_APPLY,
  ]
  const count = selected.filter(Boolean).length
  const unlocked = MGR_ROWS.map((r, i) => {
    if (i === 0) return !(on && t >= MGR_LOCK)
    return on && t >= MGR_APPLY + 0.15 * i
  })
  const flipAt = (i: number) => (i === 0 ? MGR_LOCK : MGR_APPLY + 0.15 * i)
  return (
    <div className='art-stage' style={{ width: 300, height: 200 }}>
      <div className='flex justify-end mb-3'>
        <span className={`art-pill art-pill--lg transition-opacity ${count ? '' : 'opacity-50'}`}>
          {count ? `Apply changes (${count})` : 'Apply changes'}
        </span>
      </div>
      <div className='flex flex-col gap-2'>
        {MGR_ROWS.map((r, i) => {
          const pop = on && t >= flipAt(i) ? easeBack(prog(t, flipAt(i), 0.45)) : 1
          return (
            <div key={r.name} className={`art-feed ${selected[i] ? 'art-feed--sel' : ''}`}>
              <span className={`art-check ${selected[i] ? 'art-check--on' : ''}`}>
                {selected[i] && <TbCheck />}
              </span>
              <span
                className='art-ach'
                style={{
                  background: unlocked[i] ? achGrad(r.hue) : '#34343a',
                  transform: `scale(${pop})`,
                }}
              >
                <TbTrophy className={unlocked[i] ? '' : 'text-white/40'} />
              </span>
              <span className='flex-1 truncate'>{r.name}</span>
              {/* AchievementRow.tsx: achieved -> red "Lock", not achieved -> white "Unlock" */}
              <span className={`art-pill ${unlocked[i] ? 'art-pill--lock' : ''}`}>
                {unlocked[i] ? <TbLock /> : <TbLockOpen />}
                {unlocked[i] ? 'Lock' : 'Unlock'}
              </span>
            </div>
          )
        })}
      </div>
      <FakeCursor
        t={t}
        keys={[
          { t: 0.25, x: 210, y: 175 },
          { t: MGR_SELECT[0], x: 21, y: 119, click: true },
          { t: MGR_SELECT[1], x: 21, y: 173, click: true },
          { t: MGR_APPLY, x: 232, y: 15, click: true },
          { t: MGR_LOCK, x: 256, y: 65, click: true },
          { t: 4.3, x: 256, y: 65 },
        ]}
      />
    </div>
  )
}

// --------------------------------------------------------------------------- Playtime Booster

export const PLAY_LOOP = 4.6

/** 32 tiles light up one by one, each with its own playtime bar filling - then it starts over. */
export function PlaytimeArt({ t }: { t: number }) {
  // 32 tiles from the 16 fictional games, each listed twice
  const tiles = GAMES.flatMap(g => [`${g.name}#1`, `${g.name}#2`])
  const litAt = (k: number) => (k < 3 ? -1 : 0.15 + (k - 3) * 0.05)
  const lit = Array.from({ length: 32 }, (_, k) => t >= litAt(k) && (t > 0 || k < 3))
  const count = lit.filter(Boolean).length
  return (
    <div
      className='art-stage flex flex-col items-center justify-center gap-4'
      style={{ width: 300, height: 190 }}
    >
      <div className='play-grid'>
        {tiles.map((id, k) => {
          const n = id.split('#')[0]
          const on = lit[k]
          const since = Math.max(0, t - litAt(k))
          return (
            <span
              key={id}
              className={`play-tile ${on ? 'play-tile--on' : ''}`}
              style={{
                background: grad(n),
                transform: on && t > 0 ? `scale(${easeBack(prog(t, litAt(k), 0.35))})` : undefined,
              }}
            >
              {on && <i style={{ width: `${Math.min(100, 20 + since * 30)}%` }} />}
            </span>
          )
        })}
      </div>
      <div className='flex items-baseline gap-2'>
        <span className='text-4xl font-semibold tracking-tighter text-text-primary tabular-nums leading-none'>
          {count}
        </span>
        <span className='text-sm text-text-muted'>/ 32 games idling</span>
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------------- Free Games

const FREE_CLAIM = 1.55
export const FREE_LOOP = 5.2

/** The "free game" notification lands, the cursor claims it, and a 3D gift box pops open. */
export function FreeArt({ t }: { t: number }) {
  const on = t > 0
  const claimed = on && t >= FREE_CLAIM
  const toast = on ? easeOut(prog(t, 0.15, 0.45)) * (1 - prog(t, FREE_CLAIM - 0.1, 0.3)) : 0
  const box = claimed ? easeBack(prog(t, FREE_CLAIM + 0.05, 0.5)) : 0
  const lid = claimed ? easeOut(prog(t, FREE_CLAIM + 0.55, 0.45)) : 0
  const boxOut = 1 - prog(t, 3.9, 0.5)
  return (
    <div className='art-stage' style={{ width: 300, height: 190 }}>
      <div
        className='free-toast'
        style={{ opacity: toast, transform: `translateY(${(1 - toast) * -14}px)` }}
      >
        <TbBell className='text-[#ffc700] shrink-0' />
        <div className='min-w-0'>
          <div className='font-semibold text-text-primary'>Free Games Available!</div>
          <div className='text-text-muted truncate'>Last Lantern is free on Steam right now.</div>
        </div>
      </div>
      <div className='art-free absolute left-1/2 -translate-x-1/2 bottom-1'>
        <div className='art-free__cap' style={{ background: grad('Last Lantern') }}>
          <span>Last Lantern</span>
        </div>
        <div className='flex items-center justify-between px-3 py-2.5'>
          <span className='text-[13px] font-semibold text-text-primary'>Last Lantern</span>
          <span
            className={`art-claim ${claimed ? 'art-claim--done' : ''}`}
            style={{
              transform: claimed ? `scale(${easeBack(prog(t, FREE_CLAIM, 0.35))})` : undefined,
            }}
          >
            {claimed ? <TbCheck /> : <TbGift />}
            {claimed ? 'Claimed' : 'Claim'}
          </span>
        </div>
      </div>
      {claimed && boxOut > 0 && (
        <div
          className='gift3d-wrap'
          style={{
            opacity: boxOut,
            transform: `translate(-50%, ${(1 - box) * 60}px) scale(${0.4 + box * 0.6})`,
          }}
        >
          <div
            className='gift3d'
            style={{ transform: `rotateX(-18deg) rotateY(${-30 + (t - FREE_CLAIM) * 40}deg)` }}
          >
            {(['front', 'back', 'left', 'right', 'bottom'] as const).map(f => (
              <i key={f} className={`gift3d__face gift3d__face--${f}`} />
            ))}
            <div
              className='gift3d__lid'
              style={{
                transform: `translateY(${-23 - lid * 34}px) rotateX(90deg) rotateY(${lid * 28}deg) translateZ(0px)`,
              }}
            >
              <i />
            </div>
          </div>
          {lid > 0.05 && (
            <Burst
              key='gift'
              x={0}
              y={-30}
              colors={['#ff4f6d', '#ffc700', '#3fd18a', '#5b8cff', '#b35bff']}
              count={18}
              spread={70}
              shape='confetti'
            />
          )}
        </div>
      )}
      <FakeCursor
        t={t}
        keys={[
          { t: 0.6, x: 120, y: 120 },
          { t: FREE_CLAIM, x: 213, y: 166, click: true },
          { t: 2.4, x: 250, y: 182 },
        ]}
      />
    </div>
  )
}

// -------------------------------------------------------------------------- Inventory Manager

const INV_ITEMS = [
  { name: 'Starfall Tactics', price: '$0.09' },
  { name: 'Pixel Harvest', price: '$0.11' },
  { name: 'Orbit Runners', price: '$0.12' },
  { name: 'Frostbound', price: '$0.09' },
]
const INV_PICK = [0.75, 1.25] // items 1 and 2
const INV_LIST = 1.95
const INV_FLIP = [2.25, 2.55]
export const INV_LOOP = 5.4

/** Two items ticked, "List selected (2)", the tiles flip to Listed as 3D coins spin out. */
export function InventoryArt({ t }: { t: number }) {
  const on = t > 0
  const picked = [1, 2].map((_, k) => on && t >= INV_PICK[k] && t < INV_LIST)
  const count = picked.filter(Boolean).length
  return (
    <div className='art-stage' style={{ width: 316, height: 190 }}>
      <div className='flex justify-end mb-3'>
        <span className={`art-pill art-pill--lg transition-opacity ${count ? '' : 'opacity-50'}`}>
          {count ? `List selected (${count})` : 'List selected'}
        </span>
      </div>
      <div className='flex gap-2.5'>
        {INV_ITEMS.map((it, i) => {
          const k = i - 1 // items 1 and 2 are the ones the cursor picks
          const isPick = k === 0 || k === 1
          const sel = isPick && picked[k]
          const flipT = isPick ? INV_FLIP[k] : 99
          const flip = on ? 180 * easeInOut(prog(t, flipT, 0.5)) : 0
          return (
            <div key={it.name} className='inv3d'>
              <div className='inv3d__inner' style={{ transform: `rotateY(${flip}deg)` }}>
                <div className={`art-item inv3d__face ${sel ? 'art-item--sel' : ''}`}>
                  <span className={`art-check absolute left-2 top-2 ${sel ? 'art-check--on' : ''}`}>
                    {sel && <TbCheck />}
                  </span>
                  <div className='art-item__card' style={{ background: grad(it.name) }} />
                  <span className='text-text-primary'>{it.price}</span>
                </div>
                <div className='art-item inv3d__face inv3d__face--back'>
                  <TbTag className='text-emerald-400 text-xl' />
                  <span className='text-emerald-400'>Listed</span>
                  <span className='text-text-primary'>{it.price}</span>
                </div>
              </div>
              {isPick &&
                on &&
                t >= flipT &&
                t < flipT + 1.4 &&
                [0, 1, 2].map(c => {
                  const p = prog(t, flipT + c * 0.12, 1.1)
                  return (
                    <span
                      key={c}
                      className='coin3d'
                      style={{
                        transform: `translate(${(c - 1) * 14 * p}px, ${-90 * easeOut(p) + 60 * p * p}px) rotateY(${p * 900}deg)`,
                        opacity: 1 - prog(p, 0.7, 0.3),
                      }}
                    />
                  )
                })}
            </div>
          )
        })}
      </div>
      <FakeCursor
        t={t}
        keys={[
          { t: 0.25, x: 150, y: 175 },
          { t: INV_PICK[0], x: 97, y: 60, click: true },
          { t: INV_PICK[1], x: 177, y: 60, click: true },
          { t: INV_LIST, x: 256, y: 15, click: true },
          { t: 3, x: 270, y: 34 },
        ]}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------- Make it yours

const THEME_IDS = Object.keys(THEMES) as ThemeId[]

/** Which theme the preview shows: the visitor's pick, or - while playing - a slow cycle. */
export function previewTheme(selected: ThemeId, t: number) {
  if (t <= 0) return selected
  return THEME_IDS[(THEME_IDS.indexOf(selected) + 1 + Math.floor(t / 0.75)) % THEME_IDS.length]
}

export function ThemeArt({ theme }: { theme: ThemeId }) {
  const p = THEMES[theme].palette
  return (
    <div className='theme-preview' style={{ background: p.background, borderColor: p.border }}>
      <div className='theme-preview__side' style={{ borderColor: p.border }}>
        {[0, 1, 2, 3].map(i => (
          <span key={i} style={{ background: i === 1 ? p.surface : 'transparent' }}>
            <i style={{ background: i === 1 ? p.foreground : p.muted }} />
          </span>
        ))}
      </div>
      <div className='theme-preview__main'>
        <i style={{ background: p.foreground, width: '40%' }} />
        <div className='grid grid-cols-3 gap-2 mt-3'>
          {['Neon Drift', 'Skyward Isles', 'Voidline'].map(n => (
            <span key={n} style={{ background: grad(n) }} />
          ))}
        </div>
        <div
          className='mt-3 h-10 rounded-lg'
          style={{ background: p.surface, border: `1px solid ${p.border}` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------- mini visuals

/** Automatic Idler: SGI starts, and its queued games spin up one after another. */
export const AUTO_LOOP = 4

export function AutoIdleArt({ t }: { t: number }) {
  return (
    <div className='flex flex-col gap-1.5 w-29.5'>
      {['Iron Tide', 'Mossy Kingdom', 'Voidline'].map((n, i) => {
        // spin up one by one, then wind down together before the loop restarts
        const p = t > 0 ? easeOut(prog(t, 0.2 + i * 0.3, 0.4)) * (1 - prog(t, 3.2, 0.5)) : 0
        const secs = t > 0 ? Math.max(0, Math.floor((t - 0.2 - i * 0.3) * 7)) : 0
        return (
          <span
            key={n}
            className='mini-chip'
            style={{ opacity: 0.35 + p * 0.65, transform: `translateX(${(1 - p) * 10}px)` }}
          >
            <i style={{ background: grad(n) }} />
            <TbPlayerPlayFilled className={p > 0.5 ? 'text-emerald-400' : 'text-text-muted'} />
            <span className='tabular-nums'>00:00:{String(secs).padStart(2, '0')}</span>
          </span>
        )
      })}
    </div>
  )
}

export const ACCOUNTS_LOOP = 4.4

/**
 * Multiple accounts: stacked avatars fan out, come online one by one, sign back out and slide
 * back together - then it loops. The slide is a CSS transition on `transform` (not `left`, which
 * relayouts every frame), toggled by `t`.
 */
export function AccountsArt({ t }: { t: number }) {
  const spread = t > 0 && t < 3.3
  const people = [
    ['I', '#5b8cff,#b35bff'],
    ['N', '#ff8a5b,#ff3d8b'],
    ['P', '#3fd18a,#1a8cff'],
  ]
  return (
    <div className='relative h-11 w-29.5'>
      {people.map(([l, g], i) => {
        const [a, b] = g.split(',')
        // online one by one, then signed out in reverse just before they slide back in
        const online = t > 0 && t >= 0.45 + i * 0.3 && t < 2.95 - i * 0.15
        return (
          <span
            key={l}
            className='mini-avatar'
            style={{
              background: `linear-gradient(135deg,${a},${b})`,
              transform: `translateX(${i * (spread ? 38 : 16)}px)`,
              zIndex: 3 - i,
            }}
          >
            {l}
            <i className={online ? 'mini-avatar__dot--on' : ''} />
          </span>
        )
      })}
    </div>
  )
}

export const PLATFORMS_LOOP = 4

/** Windows & Linux: the two platform marks coin-flip in 3D, then their packages appear and fade. */
export function PlatformsArt({ t }: { t: number }) {
  return (
    <div className='flex flex-col items-end gap-2 w-29.5'>
      <div className='flex gap-2' style={{ perspective: 300 }}>
        {[FaWindows, FaLinux].map((Icon, i) => (
          <span
            key={Icon === FaWindows ? 'win' : 'linux'}
            className='mini-coin'
            style={{
              transform: `rotateY(${t > 0 ? 360 * easeInOut(prog(t, i * 0.25, 0.9)) : 0}deg)`,
            }}
          >
            <Icon />
          </span>
        ))}
      </div>
      <div className='flex flex-wrap justify-end gap-1'>
        {['.exe', '.zip', '.deb', '.rpm', 'AppImage'].map((f, i) => (
          <span
            key={f}
            className='mini-tag'
            style={{
              opacity:
                t > 0 ? easeOut(prog(t, 0.6 + i * 0.12, 0.3)) * (1 - prog(t, 3.1, 0.5)) : 0.35,
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}
