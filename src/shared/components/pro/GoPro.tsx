import type { TranslationKey } from '@/i18n'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'
import { cn } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { revealTitleIfTruncated } from '@/shared/utils/revealTitleIfTruncated'

// Sidebar upsell card (above the account footer) - shown for free (`null` tier) users only, same audience
// as the small animated titlebar pill it replaced. The sidebar has the width for a real card with
// copy, a much stronger CTA than a 1.6rem pill squeezed between titlebar controls.
//
// Hidden until `isSubscribed` resolves (not just on `subscriptionTier === null`, which is also the
// pre-check default) - `useCheckSubscription` (mounted in `DashboardShell`) needs a moment on first
// mount, and rendering before then would flash the upsell for a paying user who should never see
// it. Visuals live in globals.css (`.go-pro-card`); the ambient animation is
// gated on `forceReducedMotion` like every other expensive animation.

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
  // `previous` is the perk currently fading out - kept mounted next to the incoming one so the
  // two crossfade instead of the old text vanishing the instant the new one starts. Updated
  // together so the outgoing/incoming pair can never be out of step for a render.
  const [perk, setPerk] = useState<{ index: number; previous: number | null }>({
    index: 0,
    previous: null,
  })
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
      () => setPerk(({ index }) => ({ index: (index + 1) % PERK_KEYS.length, previous: index })),
      PERK_INTERVAL_MS,
    )
    return () => window.clearInterval(id)
  }, [isCycling])

  if (!isVisible) return null

  const title = t('dashboard.sidebar.goPro.title')

  return (
    // `flex-col` so the collapsed button's tooltip trigger wrapper stretches to full width (a
    // plain block parent lets that wrapper shrink to the icon's width instead). `relative` anchors
    // the rim glow below.
    <div className='go-pro relative flex shrink-0 flex-col px-2 mb-2'>
      {/* The CTA rim's soft glow (globals.css `.go-pro-glow`) - a sibling behind the button, not
          part of it: the card clips its own overflow (for the perk text's crossfade), which would
          cut a glow off.
          Earlier in the DOM, so the button paints over it. */}
      <span
        aria-hidden='true'
        className={cn(
          'go-pro-glow',
          // the card's own corners: the collapsed icon button matches the other sidebar icons
          // (SidebarItem's rounded-lg); the expanded card, the website mobile menu's PRO card
          collapsed ? 'rounded-lg' : 'rounded-[20px]',
          forceReducedMotion && 'force-reduced-motion',
        )}
      />
      {collapsed ? (
        <AppTooltip.Root delay={300}>
          <AppTooltip.Trigger>
            <button
              // Icon-only, so this is its only accessible name. `aria-label` is screen-reader-only
              // and never shows a hover popup (only a native `title` attribute would).
              aria-label={title}
              className={cn(
                'go-pro-card flex w-full cursor-pointer items-center justify-center rounded-lg py-2 text-foreground outline-none',
                'focus-visible:ring-2 focus-visible:ring-focus',
                forceReducedMotion && 'force-reduced-motion',
              )}
              type='button'
              onClick={() => openProModal()}
            >
              {/* The word rather than the logo: on its own among the sidebar's icons, the logo
                  didn't say what the button was. A brand word, so not translated;
                  the button's accessible name and tooltip stay the translated title.
                  aria-hidden so screen readers get that name, not "PRO" read out as well. */}
              <span aria-hidden='true' className='text-xs leading-4.5 font-bold tracking-[0.06em]'>
                PRO
              </span>
            </button>
          </AppTooltip.Trigger>
          <AppTooltip.Content placement='right'>{title}</AppTooltip.Content>
        </AppTooltip.Root>
      ) : (
        <button
          className={cn(
            'go-pro-card group flex w-full cursor-pointer items-center gap-3 rounded-[20px] px-3 py-2.5 text-left outline-none',
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
          {/* The rainbow PRO pill every PRO surface shares (globals.css `.pro-pill` - the GoProModal
              title, the website's navbar and /pro). Not the app logo: that already sits at the top
              of the sidebar, and a second copy this close read as a repeat. aria-hidden: the
              button's name is already the title. */}
          <span
            aria-hidden='true'
            className='pro-pill shrink-0 text-[11px] font-black tracking-[0.12em]'
          >
            <span className='pro-pill__inner'>PRO</span>
          </span>
          {/* Single-line + truncated, not wrapping: this renders the moment the sidebar starts
              expanding, while it's still mid-width-transition, so wrapping copy would balloon the
              card's height during the animation. */}
          <span className='flex min-w-0 flex-1 flex-col'>
            {/* No static `title` tooltips on either line - a browser tooltip popping up over the
                card's own fully-visible text just reads as noise. `revealTitleIfTruncated` only
                sets one when a longer locale actually clips the line; the perk line can't change
                underneath it, since hovering the card pauses the rotation. */}
            <span
              className='truncate text-sm font-bold text-foreground'
              onMouseEnter={revealTitleIfTruncated}
            >
              {title}
            </span>
            {/* Both perks share one grid cell so they overlap while crossfading (globals.css
                `.go-pro-perk--in`/`--out`). Each is keyed by its index, so every swap remounts both
                and replays their animations. The outgoing one is dropped once its fade-out ends;
                under reduced motion it never animates, and its resting style is already
                invisible. `min-w-0` lets the grid shrink so each line still truncates. */}
            <span className='grid min-w-0 text-xs text-foreground/70'>
              {perk.previous !== null && (
                <span
                  key={`out-${perk.previous}`}
                  aria-hidden='true'
                  className='go-pro-perk--out col-start-1 row-start-1 truncate'
                  onAnimationEnd={() => setPerk(current => ({ ...current, previous: null }))}
                >
                  {t(PERK_KEYS[perk.previous])}
                </span>
              )}
              <span
                key={perk.index}
                className='go-pro-perk--in col-start-1 row-start-1 truncate'
                onMouseEnter={revealTitleIfTruncated}
              >
                {t(PERK_KEYS[perk.index])}
              </span>
            </span>
          </span>
          <TbChevronRight
            className='shrink-0 text-foreground/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground'
            fontSize={16}
          />
        </button>
      )}
    </div>
  )
}
