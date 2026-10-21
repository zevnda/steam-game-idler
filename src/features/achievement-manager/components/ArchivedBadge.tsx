import { useTranslation } from 'react-i18next'

// Marks an archived achievement (see `AchievementDto.archived`) in AchievementListItem.tsx. Neutral
// grey, unlike DlcBadge's violet, since it's a "no longer available" state rather than a category.
export const ArchivedBadge = () => {
  const { t } = useTranslation()

  return (
    <span className='shrink-0 rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-muted'>
      {t('dashboard.achievements.archived.badge')}
    </span>
  )
}
