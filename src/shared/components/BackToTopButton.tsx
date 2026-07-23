import { useTranslation } from 'react-i18next'
import { TbArrowUp } from 'react-icons/tb'
import { Button } from '@heroui/react'

interface BackToTopButtonProps {
  visible: boolean
  onPress: () => void
}

// Floating action button anchored to the nearest `relative` ancestor - every call site is a
// scrollable game-card list/grid's own container (a react-window scroll root or a `TabPanel`), so
// "bottom right" here means bottom-right of that list's own viewport, not the whole app window -
// see useBackToTop.ts for why each surface tracks its own independent scroll position.
export const BackToTopButton = ({ visible, onPress }: BackToTopButtonProps) => {
  const { t } = useTranslation()
  return (
    <Button
      isIconOnly
      aria-label={t('common.actions.backToTop')}
      className={`absolute bottom-4 right-4 z-10 shadow-lg transition-all duration-200 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
      onPress={onPress}
    >
      <TbArrowUp fontSize={18} />
    </Button>
  )
}
