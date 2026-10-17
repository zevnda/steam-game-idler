import { useTranslation } from 'react-i18next'

// Marks a DLC Achievement Set - shared by AchievementSetHeader.tsx and the achievement-unlocker's
// AchievementOrderRow.tsx. Violet echoes Steam's own purple DLC-set styling. Whether the account
// owns that DLC is shown separately (AchievementSetHeader's "Not owned" chip), not by this badge.
export const DlcBadge = () => {
  const { t } = useTranslation()

  return (
    <span className='shrink-0 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300 whitespace-nowrap'>
      {t('dashboard.achievements.sets.dlc')}
    </span>
  )
}
