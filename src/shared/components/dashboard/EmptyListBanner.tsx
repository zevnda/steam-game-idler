import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TbDeviceGamepad2, TbPlus } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { PageBanner } from '@/shared/components/dashboard/PageBanner'

interface EmptyListBannerProps {
  title: string
  description: string
  art: ReactNode
  onBrowseGames: () => void
  onManualAdd: () => void
}

// An empty list the user fills from a sibling "All Games" tab: favorites, and the Auto Idle and
// Achievement Unlocker queues. They only differ in their text and preview, and in every case the two
// ways to fill the list are the same, so the banner's buttons are too.
export const EmptyListBanner = ({
  title,
  description,
  art,
  onBrowseGames,
  onManualAdd,
}: EmptyListBannerProps) => {
  const { t } = useTranslation()

  return (
    <PageBanner
      actions={
        <>
          <Button className='bg-white text-black hover:bg-white/85' onPress={onBrowseGames}>
            <TbDeviceGamepad2 fontSize={18} />
            {t('common.tabs.allGames')}
          </Button>
          <Button variant='secondary' onPress={onManualAdd}>
            <TbPlus fontSize={18} />
            {t('common.manualAdd.title')}
          </Button>
        </>
      }
      art={art}
      description={description}
      title={title}
    />
  )
}
