import { useTranslation } from 'react-i18next'
import { TbPlus } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'

interface FavoritesPageHeaderProps {
  favoriteCount: number
  onManualAdd: () => void
}

export const FavoritesPageHeader = ({ favoriteCount, onManualAdd }: FavoritesPageHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex shrink-0 items-center justify-between gap-4 px-6 py-2'>
      <div className='flex flex-col'>
        <Typography type='h2' className='font-black'>
          {t('dashboard.sidebar.nav.favorites')}
        </Typography>
        <Typography color='muted' type='body-sm'>
          {favoriteCount > 0
            ? t('dashboard.favorites.count', { count: favoriteCount })
            : t('dashboard.favorites.empty.title')}
        </Typography>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button isIconOnly aria-label={t('common.manualAdd.title')} onPress={onManualAdd}>
          <TbPlus fontSize={18} />
        </Button>
      </div>
    </div>
  )
}
