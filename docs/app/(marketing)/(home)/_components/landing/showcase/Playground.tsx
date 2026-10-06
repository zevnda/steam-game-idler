'use client'

import type { CSSProperties, Ref } from 'react'
import type { IconType } from 'react-icons'
import type { FeatureId } from '../features'
import { FiArrowUpRight } from 'react-icons/fi'
import {
  TbAward,
  TbBuildingStore,
  TbCards,
  TbDeviceGamepad2,
  TbGift,
  TbListCheck,
  TbPlayerPlay,
} from 'react-icons/tb'
import { useDemoStore } from '../demoStore'
import { FEATURES } from '../features'
import Link from 'next/link'

export const FEATURE_ICONS: Record<FeatureId, IconType> = {
  'games': TbDeviceGamepad2,
  'card-farming': TbCards,
  'achievement-unlocker': TbAward,
  'achievement-manager': TbListCheck,
  'playtime': TbPlayerPlay,
  'inventory': TbBuildingStore,
  'free-games': TbGift,
}

interface PlaygroundProps {
  stacked: boolean
  /** the window has docked - the panel is visible and interactive */
  docked: boolean
  position: { left: number; width: number; top: number }
  /** the panel itself (wide layout) - Showcase measures it to land the hero headline */
  panelRef?: Ref<HTMLDivElement>
  /** the heading slot the hero headline travels into (and then stays in) */
  headingRef?: Ref<HTMLDivElement>
}

/**
 * Scroll-linked build-out: each element fades up out of a blur as the showcase's `--t` passes
 * `at` (see .pg-reveal in globals.css). The panel itself never fades as a whole - it assembles.
 */
const reveal = (at: number) => ({ '--at': at }) as CSSProperties

// Wide layout: the intro and the feature rows build in beneath the hero headline as it travels
// into the heading slot (Showcase.tsx's HAND_OVER.travel, ending 0.86), and the "Live demo" label
// appears above it as it lands. `heading` only matters under reduced motion, where the slot's own
// copy is shown instead of a travelling headline. Phones: the tile grid, then the summary - only
// once the window has nearly docked, never over it mid-rise.
const WIDE_AT = { intro: 0.66, firstRow: 0.69, rowStep: 0.03, heading: 0.78, label: 0.82 }
const STACKED_AT = { firstTile: 0.72, tileStep: 0.025, summary: 0.88 }

/** The playground's feature picker: beside the docked window on desktop, beneath it on phones. */
export default function Playground({
  stacked,
  docked,
  position,
  panelRef,
  headingRef,
}: PlaygroundProps) {
  const featureId = useDemoStore(s => s.feature)
  const select = useDemoStore(s => s.select)
  const active = FEATURES.find(f => f.id === featureId) ?? FEATURES[0]

  const style = stacked
    ? { left: position.left, width: position.width, top: position.top }
    : { left: position.left, width: position.width }

  if (stacked) {
    return (
      <div className='playground playground--stacked' style={style} aria-hidden={!docked}>
        {/* every feature at once as a 4-column grid - no horizontally scrolling row on phones */}
        <div className='playground__grid' role='tablist' aria-label='Demo features'>
          {FEATURES.map((f, k) => {
            const Icon = FEATURE_ICONS[f.id]
            const on = f.id === featureId
            return (
              <button
                key={f.id}
                type='button'
                role='tab'
                aria-selected={on}
                aria-label={f.name}
                tabIndex={docked ? 0 : -1}
                onClick={() => select(f.id)}
                className={`playground__tile pg-reveal ${on ? 'playground__tile--on' : ''}`}
                style={
                  {
                    '--accent': f.accent,
                    ...reveal(STACKED_AT.firstTile + k * STACKED_AT.tileStep),
                  } as CSSProperties
                }
              >
                <Icon className='w-[18px] h-[18px]' aria-hidden='true' />
                <span>{f.short}</span>
              </button>
            )
          })}
        </div>
        <p
          className='pg-reveal mt-3 text-sm text-text-muted leading-relaxed'
          style={reveal(STACKED_AT.summary)}
        >
          {active.summary}{' '}
          <Link
            prefetch={false}
            href={active.href}
            className='inline-flex items-center gap-0.5 text-text-primary underline-offset-2 hover:underline'
          >
            How it works
            {/* visually hidden: gives the link a descriptive name ("How it works: Card Farming")
                for search engines and screen readers without lengthening the visible label */}
            <span className='sr-only'>: {active.name}</span>{' '}
            <FiArrowUpRight className='w-3.5 h-3.5' />
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div ref={panelRef} className='playground' style={style} aria-hidden={!docked}>
      <div
        className='pg-reveal flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300/90'
        style={reveal(WIDE_AT.label)}
      >
        <span className='live-dot' aria-hidden='true' />
        Live demo
      </div>
      {/*
        The heading slot. The hero's own headline (the page's h1) travels here and stays as this
        panel's heading, so this copy is normally an invisible spacer that sizes the slot - same
        text and type as the headline, at this size (Showcase.tsx scales the headline to match).
        Under reduced motion the headline just fades in place and this copy is shown instead.
        nowrap: the lines must break exactly where the headline's do, or the two won't line up.
      */}
      <div
        ref={headingRef}
        aria-hidden='true'
        className='playground__title pg-reveal mt-3 whitespace-nowrap text-[1.9rem] 2xl:text-[2.2rem] font-semibold leading-[0.98] tracking-[-0.04em] text-text-primary'
        style={reveal(WIDE_AT.heading)}
      >
        Your Steam library,
        <br />
        <span className='gradient-text'>on autopilot.</span>
      </div>
      <p
        className='pg-reveal mt-3 text-[15px] text-text-muted leading-relaxed'
        style={reveal(WIDE_AT.intro)}
      >
        That&apos;s a working replica of SGI. Pick a feature, or just click around the app.
      </p>

      <div
        className='mt-6 flex flex-col gap-1.5'
        role='tablist'
        aria-orientation='vertical'
        aria-label='Demo features'
      >
        {FEATURES.map((f, k) => {
          const Icon = FEATURE_ICONS[f.id]
          const on = f.id === featureId
          return (
            <div
              key={f.id}
              className={`playground__item pg-reveal ${on ? 'playground__item--on' : ''}`}
              style={
                {
                  '--accent': f.accent,
                  ...reveal(WIDE_AT.firstRow + k * WIDE_AT.rowStep),
                } as CSSProperties
              }
            >
              <button
                type='button'
                role='tab'
                aria-selected={on}
                tabIndex={docked ? 0 : -1}
                onClick={() => select(f.id)}
                className='playground__trigger'
              >
                <span className='playground__icon'>
                  <Icon className='w-[18px] h-[18px]' aria-hidden='true' />
                </span>
                <span className='flex-1 text-left font-medium'>{f.name}</span>
              </button>
              <div className='playground__body'>
                <div className='overflow-hidden'>
                  <div className='pl-[52px] pr-3 pb-4'>
                    <p className='text-sm text-text-muted leading-relaxed'>{f.summary}</p>
                    <FeatureFooter feature={f} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatureFooter({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <Link
      prefetch={false}
      href={feature.href}
      className='mt-3 inline-flex w-fit items-center gap-1 text-[13px] text-text-muted hover:text-text-primary transition-colors'
    >
      How it works
      {/* see the stacked layout's link above */}
      <span className='sr-only'>: {feature.name}</span>
      <FiArrowUpRight className='w-3.5 h-3.5' />
    </Link>
  )
}
