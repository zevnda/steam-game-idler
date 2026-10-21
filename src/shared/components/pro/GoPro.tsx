import type { TranslationKey } from '@/i18n'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbCrown } from 'react-icons/tb'
import { cn } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { Logo } from '@/shared/components/dashboard/Logo'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'

// Sidebar upsell card (above the account footer) - shown for free (`null` tier) users only, same audience
// as the small animated titlebar pill it replaced. The sidebar has the width for a real card with
// copy, a much stronger CTA than a 1.6rem pill squeezed between titlebar controls.
//
// Hidden until `isSubscribed` resolves (not just on `subscriptionTier === null`, which is also the
// pre-check default) - `useCheckSubscription` (mounted in `DashboardShell`) needs a moment on first
// mount, and rendering before then would flash the upsell for a paying user who should never see
// it. Visuals live in globals.css (`.go-pro-card`); the ambient animation is
// gated on `forceReducedMotion` like every other expensive animation (see CLAUDE.md's platform
// gating notes).

// Perk names the subtitle cycles through - the GoProModal's own feature titles (see
// GoProModal/data.ts), reused rather than duplicated so they stay identical to what the modal
// shows once clicked. A curated subset, not every row: the highest-draw perks, and ones short
// enough to mostly fit the card's ~150px text column (anything longer truncates).
const PERK_KEYS = [
  'proMode.cards.autoFarmCards.title',
  'proMode.cards.adFree.title',
  'proMode.cards.multiAccount.title',
  'proMode.cards.freeGames.title',
  'proMode.cards.themes.title',
  'proMode.cards.sellDupes.title',
  'proMode.cards.liveSupport.title',
  'proMode.cards.customPresence.title',
] as const satisfies readonly TranslationKey[]

const PERK_INTERVAL_MS = 2500

export const GoPro = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation()
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const openProModal = useProModalStore(state => state.open)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const [perkIndex, setPerkIndex] = useState(0)
  // Paused while hovered/focused, so a user reading a perk doesn't have it swapped out from under
  // them right as they decide whether to click.
  const [isPaused, setIsPaused] = useState(false)

  const isVisible = isSubscribed !== null && subscriptionTier === null
  // Only ticks while the expanded card is actually on screen - the collapsed icon button has no
  // subtitle, and a paying user never renders the card at all.
  const isCycling = isVisible && !collapsed && !isPaused

  useEffect(() => {
    if (!isCycling) return
    const id = window.setInterval(
      () => setPerkIndex(index => (index + 1) % PERK_KEYS.length),
      PERK_INTERVAL_MS,
    )
    return () => window.clearInterval(id)
  }, [isCycling])

  if (!isVisible) return null

  const title = t('dashboard.sidebar.goPro.title')

  return (
    // `flex-col` so the collapsed button's tooltip trigger wrapper stretches to full width (a
    // plain block parent lets that wrapper shrink to the icon's width instead).
    <div className='flex shrink-0 flex-col px-2 mb-2'>
      {collapsed ? (
        <AppTooltip.Root delay={300}>
          <AppTooltip.Trigger>
            <button
              // Icon-only, so this is its only accessible name. `aria-label` is screen-reader-only
              // and never shows a hover popup (only a native `title` attribute would).
              aria-label={title}
              className={cn(
                'go-pro-card flex w-full cursor-pointer items-center justify-center rounded-lg py-2 text-white outline-none',
                'focus-visible:ring-2 focus-visible:ring-focus',
                forceReducedMotion && 'force-reduced-motion',
              )}
              type='button'
              onClick={() => openProModal()}
            >
              {/* No crown here (unlike the expanded card) - the collapsed button's `py-2` leaves
                  too little room above the logo for it. */}
              <Logo className='text-white!' height={18} width={18} />
            </button>
          </AppTooltip.Trigger>
          <AppTooltip.Content placement='right'>{title}</AppTooltip.Content>
        </AppTooltip.Root>
      ) : (
        <button
          className={cn(
            'go-pro-card group flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left outline-none',
            'focus-visible:ring-2 focus-visible:ring-focus',
            forceReducedMotion && 'force-reduced-motion',
          )}
          // Stable accessible name - without it the name would change every few seconds along
          // with the cycling perk text inside. Screen-reader-only, no hover popup.
          aria-label={title}
          type='button'
          onBlur={() => setIsPaused(false)}
          onClick={() => openProModal()}
          onFocus={() => setIsPaused(true)}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* The app's own logo, bare with a purple glow rather than sitting on a solid gradient
              tile - lighter visually, and the card's own tinted fill + animated border already
              carry the brand colour. `!` on the colour because Logo's own default `text-foreground`
              is on the same element, and without it whichever rule Tailwind emits later wins. */}
          {/* TEMP (design test): crown perched on top of the logo - remove the wrapper span +
              TbCrown (and its import) to revert. */}
          <span className='relative shrink-0 transition-transform duration-200 group-hover:scale-110'>
            {/* Crown after Logo in DOM order (+ z-10) so it paints on top where they overlap -
                the S's top edge widens fast enough that the logo otherwise covers it entirely. */}
            <Logo
              className='text-[#d9a6ff]! drop-shadow-[0_0_6px_rgb(183_0_255/0.9)]'
              height={22}
              width={22}
            />
            <TbCrown
              className='absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 -rotate-12 text-[#ffd36e] drop-shadow-[0_0_4px_rgb(255_200_80/0.8)]'
              fontSize={12}
            />
          </span>
          {/* Single-line + truncated, not wrapping: this renders the moment the sidebar starts
              expanding, while it's still mid-width-transition, so wrapping copy would balloon the
              card's height during the animation. */}
          <span className='flex min-w-0 flex-1 flex-col'>
            {/* No native `title` tooltips on either line - a browser tooltip popping up over
                the card's own text just reads as noise. */}
            <span className='truncate text-sm font-bold text-white'>{title}</span>
            {/* Keyed by index so each swap remounts the span and replays `.go-pro-perk`'s entrance
                animation (globals.css). */}
            <span key={perkIndex} className='go-pro-perk truncate text-xs text-white/70'>
              {t(PERK_KEYS[perkIndex])}
            </span>
          </span>
          <TbChevronRight
            className='shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white'
            fontSize={16}
          />
        </button>
      )}
    </div>
  )
}
