import { useTranslation } from 'react-i18next'
import { TbBan } from 'react-icons/tb'
import { AppTooltip } from '@/shared/components/AppTooltip'

// Compact replacement for the full-width warning Alert that used to sit under the overlay's header
// whenever a game had any protected achievement or statistic - permanently eating vertical space on
// every visit to such a game. Same title/explanation (dashboard.achievements.protectedAlert.*), now
// a small chip in the relevant tab's toolbar with the explanation on hover; each protected row
// still carries its own marker too (AchievementRow.tsx / StatisticRow.tsx).
export const ProtectedNotice = () => {
  const { t } = useTranslation()

  return (
    <AppTooltip.Root>
      <AppTooltip.Trigger>
        <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-warning'>
          <TbBan fontSize={13} />
          {t('dashboard.achievements.protectedAlert.title')}
        </span>
      </AppTooltip.Trigger>
      <AppTooltip.Content>
        {t('dashboard.achievements.protectedAlert.description')}
      </AppTooltip.Content>
    </AppTooltip.Root>
  )
}
