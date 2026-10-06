'use client'

import type { ReactNode } from 'react'
import type { FeatureId } from './features'
import type { ThemeId } from './showcase/engine/palette'
import { FiArrowUpRight } from 'react-icons/fi'
import {
  ACCOUNTS_LOOP,
  AccountsArt,
  AUTO_LOOP,
  AutoIdleArt,
  FARM_LOOP,
  FarmArt,
  FREE_LOOP,
  FreeArt,
  INV_LOOP,
  InventoryArt,
  ManagerArt,
  MGR_LOOP,
  PLATFORMS_LOOP,
  PlatformsArt,
  PLAY_LOOP,
  PlaytimeArt,
  previewTheme,
  ThemeArt,
  UNL_LOOP,
  UnlockerArt,
} from './art/bentoArt'
import { useElapsed, usePlayTrigger } from './art/storyboard'
import { scrollToPlayground, useDemoStore } from './demoStore'
import { featureById } from './features'
import SectionHeading from './SectionHeading'
import { THEMES } from './showcase/engine/palette'
import Link from 'next/link'
import { FadeIn } from '@/app/lib/animations'

/**
 * "Every Steam chore, handled." - one tile per feature. Each illustration is a short storyboard
 * that plays while the tile is hovered (or on screen, on touch devices) and resets when it stops;
 * "Try it live" hands the visitor to the 3D playground with that feature already open.
 */
export default function FeatureBento() {
  return (
    <section id='features' aria-labelledby='features-heading' className='landing-section'>
      <div className='landing-container'>
        <SectionHeading
          id='features-heading'
          eyebrow='Features'
          title={
            <>
              Cards, hours and achievements, <span className='gradient-text'>handled.</span>
            </>
          }
          sub='Sign in once and SGI runs everything below in the background, from card drops to free-game claims.'
        />

        <div className='mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
          <Tile
            feature='card-farming'
            className='md:col-span-2 lg:col-span-4'
            title='Card Farming'
            col={0}
            body='Farms the trading card drops left in your library, one game at a time or up to 32 at once. Sell the cards on the Community Market, or craft them into badges to level up your profile.'
            loop={FARM_LOOP}
            art={t => <FarmArt t={t} />}
          />
          <Tile
            feature='achievement-unlocker'
            className='lg:col-span-2'
            title='Achievement Unlocker'
            col={1}
            body='Unlocks queued achievements with random, human-like delays, or only during the hours you choose.'
            loop={UNL_LOOP}
            art={t => <UnlockerArt t={t} />}
          />
          <Tile
            feature='achievement-manager'
            className='lg:col-span-2'
            title='Achievement Manager'
            col={0}
            body='Unlock, lock and edit stats for any game you own, then apply every change in one go.'
            loop={MGR_LOOP}
            art={t => <ManagerArt t={t} />}
          />
          <Tile
            feature='playtime'
            className='lg:col-span-2'
            title='Playtime Booster'
            col={1}
            body='Farm Steam hours on up to 32 games at once, and get new games eligible for card drops sooner.'
            loop={PLAY_LOOP}
            art={t => <PlaytimeArt t={t} />}
          />
          <Tile
            feature='free-games'
            className='lg:col-span-2'
            title='Free Games'
            col={2}
            body='Get told the moment a game goes free on Steam, and claim it in one click.'
            loop={FREE_LOOP}
            art={t => <FreeArt t={t} />}
          />
          <Tile
            feature='inventory'
            className='lg:col-span-3'
            title='Inventory Manager'
            col={0}
            body='List items on the Community Market straight from the app, priced from live buy or sell orders.'
            loop={INV_LOOP}
            art={t => <InventoryArt t={t} />}
          />
          <ThemeTile col={1} />

          <Mini
            title='Automatic Idler'
            col={0}
            body='Starts your chosen games every time SGI launches.'
            loop={AUTO_LOOP}
            art={t => <AutoIdleArt t={t} />}
          />
          <Mini
            title='Multiple Accounts'
            col={1}
            body='Run automation for several Steam accounts side by side.'
            loop={ACCOUNTS_LOOP}
            art={t => <AccountsArt t={t} />}
          />
          <Mini
            title='Windows & Linux'
            col={2}
            body='Installer or portable zip on Windows; .deb, .rpm or AppImage on Linux.'
            loop={PLATFORMS_LOOP}
            art={t => <PlatformsArt t={t} />}
          />
        </div>
      </div>
    </section>
  )
}

// one pass through every preset (previewTheme steps every 0.75s), so the replay cap applies here
// too instead of cycling forever while on screen
const THEME_LOOP = Object.keys(THEMES).length * 0.75

/**
 * Tiles reveal on their own, as each scrolls into view - not as one stagger fired when the grid's
 * top edge appears, which (10 tiles x 100ms, in a grid several screens tall) played out mostly
 * off-screen: by the time the lower rows were visible, their entrance was long over. Tiles that
 * share a desktop row still enter together, offset slightly left to right by `col`.
 */
const ROW_STEP = 0.08

function Reveal({
  col,
  className,
  children,
}: {
  col: number
  className?: string
  children: ReactNode
}) {
  return (
    <FadeIn className={className} delay={col * ROW_STEP}>
      {children}
    </FadeIn>
  )
}

function tryLive(id: FeatureId) {
  useDemoStore.getState().select(id, 'page')
  scrollToPlayground()
}

function Tile({
  feature,
  col,
  className = '',
  title,
  body,
  loop,
  art,
}: {
  feature: FeatureId
  /** position within its desktop row (0 = leftmost) - see Reveal */
  col: number
  className?: string
  title: string
  body: string
  /** replay period while hovered; omit to play once and hold */
  loop?: number
  art: (t: number) => ReactNode
}) {
  const f = featureById(feature)
  const { ref, playing, handlers } = usePlayTrigger<HTMLElement>()
  const t = useElapsed(playing, loop)
  return (
    <Reveal col={col} className={className}>
      <article
        ref={ref}
        {...handlers}
        className={`bento-tile ${playing ? 'bento-tile--playing' : ''}`}
        style={{ '--accent': f.accent } as React.CSSProperties}
      >
        <div className='bento-tile__art' aria-hidden='true'>
          {art(t)}
        </div>
        <div className='p-6 sm:p-7 pt-0 sm:pt-0 flex flex-col gap-3 flex-1'>
          <h3 className='text-xl font-semibold tracking-tight text-text-primary'>{title}</h3>
          <p className='text-[15px] text-text-muted leading-relaxed'>{body}</p>
          <div className='mt-auto pt-2 flex items-center gap-4'>
            <button type='button' onClick={() => tryLive(feature)} className='bento-try'>
              Try it live
            </button>
            <Link
              prefetch={false}
              href={f.href}
              className='inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors'
            >
              {/* visually hidden prefix: a descriptive link name ("Card Farming docs") for search
                  engines and screen readers, same short visible label */}
              <span className='sr-only'>{title} </span>
              Docs <FiArrowUpRight className='w-3.5 h-3.5' />
            </Link>
          </div>
        </div>
      </article>
    </Reveal>
  )
}

/** The smaller "and also" tiles: same card language as the big ones, with a shorter scene. */
function Mini({
  col,
  title,
  body,
  loop,
  art,
}: {
  col: number
  title: string
  body: string
  /** replay period - phones autoplay these while on screen, so they must loop */
  loop: number
  art: (t: number) => ReactNode
}) {
  const { ref, playing, handlers } = usePlayTrigger<HTMLElement>()
  const t = useElapsed(playing, loop)
  return (
    <Reveal col={col} className='md:col-span-1 lg:col-span-2'>
      <article
        ref={ref}
        {...handlers}
        className='bento-tile'
        style={{ '--accent': '#94a3b8' } as React.CSSProperties}
      >
        <div className='bento-tile__art bento-tile__art--sm' aria-hidden='true'>
          {art(t)}
        </div>
        <div className='p-6 sm:p-7 pt-0 sm:pt-0 flex flex-col gap-2 flex-1'>
          <h3 className='flex items-center gap-2 text-lg font-semibold tracking-tight text-text-primary'>
            {title}
          </h3>
          <p className='text-[15px] text-text-muted leading-relaxed'>{body}</p>
        </div>
      </article>
    </Reveal>
  )
}

/**
 * Custom themes: the preview cycles through the real presets while the tile plays, and the
 * swatches below just track which one is showing - display only, nothing to click.
 */
function ThemeTile({ col }: { col: number }) {
  const { ref, playing, handlers } = usePlayTrigger<HTMLElement>()
  const t = useElapsed(playing, THEME_LOOP)
  const shown = previewTheme('default', t)
  return (
    <Reveal col={col} className='lg:col-span-3'>
      <article
        ref={ref}
        {...handlers}
        className='bento-tile'
        style={{ '--accent': '#38bdf8' } as React.CSSProperties}
      >
        <div className='bento-tile__art' aria-hidden='true'>
          <ThemeArt theme={shown} />
        </div>
        <div className='p-6 sm:p-7 pt-0 sm:pt-0 flex flex-col gap-3 flex-1'>
          <h3 className='text-xl font-semibold tracking-tight text-text-primary'>Custom Themes</h3>
          <p className='text-[15px] text-text-muted leading-relaxed'>
            Switch between built-in colour themes, pick your own font, or set a custom background.
          </p>
          <div className='mt-auto pt-2 flex flex-wrap gap-2' aria-hidden='true'>
            {(Object.keys(THEMES) as ThemeId[]).map(id => (
              <span
                key={id}
                title={THEMES[id].label}
                className={`theme-swatch ${shown === id ? 'theme-swatch--on' : ''}`}
                style={{ background: THEMES[id].swatch }}
              />
            ))}
          </div>
        </div>
      </article>
    </Reveal>
  )
}
