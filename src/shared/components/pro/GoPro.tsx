import { cn } from '@heroui/react'
import { useStateStore, useUserStore } from '@/shared/stores'

export const GoPro = () => {
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)

  return (
    <div
      className={cn(
        'shiny-cta flex justify-between items-center min-w-17!',
        subscriptionTier === 'gamer' ? 'cursor-default! pointer-events-none' : '',
      )}
      style={
        {
          'background':
            subscriptionTier === 'gamer'
              ? `
          linear-gradient(100deg, #3b0764ff 0%, #6b21a8ff 40%, #9333eaff 70%, #c026d3ff 100%) padding-box,
          conic-gradient(
            from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
            transparent,
            var(--shiny-cta-highlight) var(--gradient-percent),
            var(--gradient-shine) calc(var(--gradient-percent) * 2),
            var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
            transparent calc(var(--gradient-percent) * 4)
          )
          border-box
        `
              : `
          linear-gradient(100deg, #154d66ff 0%, #227ca5ff 40%, #2eabe5ff 70%, #34bfffff 100%) padding-box,
          conic-gradient(
            from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
            transparent,
            var(--shiny-cta-highlight) var(--gradient-percent),
            var(--gradient-shine) calc(var(--gradient-percent) * 2),
            var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
            transparent calc(var(--gradient-percent) * 4)
          )
          border-box
        `,
          '--shiny-cta-highlight': subscriptionTier === 'gamer' ? '#c026d3ff' : '#34bfffff',
          '--shiny-cta-highlight-subtle': subscriptionTier === 'gamer' ? '#c026d3ff' : '#34bfffff',
          '--shiny-cta-fg': '#ffffff',
        } as React.CSSProperties
      }
      onClick={() => {
        if (subscriptionTier === 'gamer') {
          return
        } else if (subscriptionTier === 'casual') {
          setProModalRequiredTier('gamer')
        }
        setProModalOpen(true)
      }}
    >
      <p className='flex flex-col font-bold items-center text-[10px] mx-2 uppercase'>
        {subscriptionTier === null ? (
          // eslint-disable-next-line i18next/no-literal-string
          <span className='flex flex-col font-bold items-center w-22.5 text-[8px] space-y-0.5 uppercase'>
            Support
            <span className='block w-full text-center'>Steam Game Idler</span>
          </span>
        ) : (
          <span className='flex flex-col font-bold items-center w-12 text-[10px] space-y-0.5'>
            {subscriptionTier}
          </span>
        )}
      </p>
      {subscriptionTier !== 'gamer' && (
        <div
          className={cn(
            'bg-white py-1 px-1.5 rounded-full h-[90%] flex items-center',
            subscriptionTier === null ? 'w-13' : '',
          )}
        >
          <p
            className={cn(
              'text-[10px] font-black italic text-center uppercase',
              subscriptionTier === null || 'casual' ? 'text-[#0092d0]' : 'text-[#9333eaff]',
            )}
          >
            {subscriptionTier === 'casual' ? 'Upgrade' : 'Go Pro'}
          </p>
        </div>
      )}
    </div>
  )
}
