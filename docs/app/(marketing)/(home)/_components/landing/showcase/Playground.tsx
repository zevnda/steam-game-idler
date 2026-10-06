'use client'

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
}

/** The playground's feature picker: beside the docked window on desktop, beneath it on phones. */
export default function Playground({ stacked, docked, position }: PlaygroundProps) {
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
          {FEATURES.map(f => {
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
                className={`playground__tile ${on ? 'playground__tile--on' : ''}`}
                style={{ '--accent': f.accent } as React.CSSProperties}
              >
                <Icon className='w-[18px] h-[18px]' aria-hidden='true' />
                <span>{f.short}</span>
              </button>
            )
          })}
        </div>
        <p className='mt-3 text-sm text-text-muted leading-relaxed'>
          {active.summary}{' '}
          <Link
            prefetch={false}
            href={active.href}
            className='inline-flex items-center gap-0.5 text-text-primary underline-offset-2 hover:underline'
          >
            How it works <FiArrowUpRight className='w-3.5 h-3.5' />
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className='playground' style={style} aria-hidden={!docked}>
      <div className='flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300/90'>
        <span className='live-dot' aria-hidden='true' />
        Live demo
      </div>
      <h2 className='mt-3 text-[2rem] xl:text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.03em] text-text-primary'>
        Take it for a spin.
      </h2>
      <p className='mt-3 text-[15px] text-text-muted leading-relaxed'>
        That&apos;s a working replica of SGI. Pick a feature, or just click around the app.
      </p>

      <div
        className='mt-6 flex flex-col gap-1.5'
        role='tablist'
        aria-orientation='vertical'
        aria-label='Demo features'
      >
        {FEATURES.map(f => {
          const Icon = FEATURE_ICONS[f.id]
          const on = f.id === featureId
          return (
            <div
              key={f.id}
              className={`playground__item ${on ? 'playground__item--on' : ''}`}
              style={{ '--accent': f.accent } as React.CSSProperties}
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
      <FiArrowUpRight className='w-3.5 h-3.5' />
    </Link>
  )
}
