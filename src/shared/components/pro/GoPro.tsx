import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'

// Titlebar upsell pill - shown for free (`null` tier) users only. Casual/gamer no longer show this:
// Sidebar's "Plan" row is the CTA for them now (a clickable "Casual" badge that opens the modal
// scrolled to tiers, a static "Gamer" badge since that's the max tier - see Sidebar.tsx). `.shiny-cta`
// (see globals.css) is `main`'s ported animated-border CSS, already defaulting to this button's blue
// variant since `main`'s gamer/casual purple-tint overrides don't apply here (only free ever renders
// this). Text/markup matches `main`'s free-tier branch verbatim - not run through i18n, matching
// `main`'s own `eslint-disable` carve-out for this button specifically.
export const GoPro = () => {
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const openProModal = useProModalStore(state => state.open)

  if (subscriptionTier !== null) return null

  return (
    <button
      className='shiny-cta mx-2 flex min-w-17! items-center justify-between'
      type='button'
      onClick={() => openProModal()}
    >
      <p className='mx-2 flex flex-col items-center text-[10px] font-bold uppercase'>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className='flex w-22.5 flex-col items-center space-y-0.5 text-[8px] font-bold uppercase'>
          Support
          <span className='block w-full text-center'>Steam Game Idler</span>
        </span>
      </p>
      <div className='flex h-[90%] w-13 items-center rounded-full bg-white px-1.5 py-1'>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <p className='text-center text-[10px] font-black text-[#0092d0] uppercase italic'>Go Pro</p>
      </div>
    </button>
  )
}
