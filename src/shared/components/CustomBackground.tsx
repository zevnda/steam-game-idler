import { useEffect } from 'react'
import { useCustomBackgroundStore } from '@/shared/stores/customBackgroundStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

// Mounted once in DashboardShell, as the sole owner of the main content area's canvas background -
// `DashboardShell`'s `<main>` has no `bg-background` of its own (see that file's comment), so this
// component's plain solid layer is what's normally visible; the image+scrim layer only renders on
// top of it once a Casual-tier account has a background set. `-z-10` (not `z-0`) is required, not
// cosmetic: a plain `fixed`/`absolute` positioned element with `z-index: 0` paints *above*
// non-positioned normal-flow content (the CSS stacking-order spec puts positioned descendants after
// in-flow block descendants regardless of DOM order), which would incorrectly cover Sidebar/main.
// A negative z-index moves it into the stacking bucket that paints *before* normal-flow content.
export const CustomBackground = () => {
  const dataUrl = useCustomBackgroundStore(state => state.dataUrl)
  const setDataUrl = useCustomBackgroundStore(state => state.setDataUrl)
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)

  useEffect(() => {
    invoke<string | null>('get_custom_background_data_url')
      .then(setDataUrl)
      .catch(error => {
        console.error('Error in (get_custom_background_data_url):', error)
      })
    // One-time hydration on mount, like `useAntiAwayStatus` - later changes come from
    // `useCustomizationSettings`'s save/clear actions writing to this store directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showImage = isSubscribed !== null && hasCasualAccess(subscriptionTier) && dataUrl

  return (
    <div className='pointer-events-none fixed inset-0 -z-10'>
      <div className='absolute inset-0 bg-background' />
      {showImage && (
        <>
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{
              backgroundImage: `url(${dataUrl})`,
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            }}
          />
          {/* Blurred scrim so foreground content (text, cards) stays readable over an arbitrary
              user-picked image - mirrors `main`'s `Layout.tsx` treatment. */}
          <div className='absolute inset-0 bg-background/80 backdrop-blur-xs' />
        </>
      )}
    </div>
  )
}
