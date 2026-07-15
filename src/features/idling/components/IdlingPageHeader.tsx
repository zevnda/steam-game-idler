import { useTranslation } from 'react-i18next'
import { TbPlayerStopFilled } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'

interface IdlingPageHeaderProps {
  idlingCount: number
  isStoppingAll: boolean
  onStopAll: () => void
}

export const IdlingPageHeader = ({
  idlingCount,
  isStoppingAll,
  onStopAll,
}: IdlingPageHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.idling')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {idlingCount > 0
            ? t('dashboard.idling.count', { count: idlingCount })
            : t('dashboard.idling.empty.title')}
        </Typography>
      </div>
      {idlingCount > 0 && (
        <Button isPending={isStoppingAll} variant='danger' onPress={onStopAll}>
          <TbPlayerStopFilled fontSize={18} />
          {t('dashboard.idling.stopAll')}
        </Button>
      )}
    </div>
  )
}
