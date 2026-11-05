import type { ComponentProps, ReactNode } from 'react'
import { BackToTopButton } from './BackToTopButton'
import { TabPanel } from '@heroui/react'
import { useBackToTop } from '@/shared/hooks/useBackToTop'

interface GameListTabPanelProps extends Omit<
  ComponentProps<typeof TabPanel>,
  'children' | 'className' | 'ref'
> {
  children: ReactNode
}

// Thin `TabPanel` wrapper for every tabbed page's plain-CSS-grid game-card list (Favorites' "list"
// tab, every Card Farming tab, Auto Idle's "queue" tab) - these tabs have no virtualized scroll
// root of their own, so this provides one for a "back to top" button to watch/scroll. A tab backed
// by a react-window grid (VirtualizedGameGrid.tsx, AchievementUnlockerListGrid.tsx) wires its own
// back-to-top instead, since it owns its own scroll root - those stay on a plain `TabPanel`.
//
// The scrolling happens in an inner box, with the button beside it rather than inside it: an
// absolutely positioned button inside the element that scrolls is anchored to the scrolled content,
// so it scrolled away with the list instead of staying in the bottom-right corner. The inner box is
// a plain block, exactly as the panel used to be, so the content lays out the same.
export const GameListTabPanel = ({ children, ...props }: GameListTabPanelProps) => {
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()
  return (
    <TabPanel {...props} className='relative flex min-h-0 flex-1 flex-col p-0'>
      <div ref={setScrollElement} className='min-h-0 flex-1 overflow-y-auto'>
        {children}
      </div>
      <BackToTopButton visible={isVisible} onPress={scrollToTop} />
    </TabPanel>
  )
}
