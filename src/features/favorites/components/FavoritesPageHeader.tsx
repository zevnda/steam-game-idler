import { useTranslation } from 'react-i18next'
import { Typography } from '@heroui/react'

interface FavoritesPageHeaderProps {
  favoriteCount: number
}

export const FavoritesPageHeader = ({ favoriteCount }: FavoritesPageHeaderProps) => {
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
    </div>
  )
}
