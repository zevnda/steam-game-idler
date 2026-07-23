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
// root of their own, so `TabPanel` itself is the real `overflow-y-auto` ancestor a "back to top"
// button needs to watch/scroll. A tab backed by a react-window grid (VirtualizedGameGrid.tsx,
// AchievementUnlockerListGrid.tsx) wires its own back-to-top instead, since it owns its own scroll
// root and `TabPanel`'s own overflow never actually triggers there - those stay on a plain
// `TabPanel`.
export const GameListTabPanel = ({ children, ...props }: GameListTabPanelProps) => {
  const { setScrollElement, isVisible, scrollToTop } = useBackToTop()
  return (
    <TabPanel
      {...props}
      ref={setScrollElement}
      className='relative min-h-0 flex-1 overflow-y-auto p-0'
    >
      {children}
      <BackToTopButton visible={isVisible} onPress={scrollToTop} />
    </TabPanel>
  )
}
