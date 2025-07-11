import type { Achievement, ChangedStats, Statistic } from '@/types'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button, useDisclosure } from '@heroui/react'
import { Trans, useTranslation } from 'react-i18next'
import { TbRotateClockwise, TbUpload } from 'react-icons/tb'

import CustomModal from '@/components/ui/CustomModal'
import useStatisticButtons from '@/hooks/achievements/useStatisticButtons'

interface StatisticButtonsProps {
  statistics: Statistic[]
  setStatistics: Dispatch<SetStateAction<Statistic[]>>
  changedStats: ChangedStats
  setChangedStats: Dispatch<SetStateAction<ChangedStats>>
  setAchievements: Dispatch<SetStateAction<Achievement[]>>
}

export default function StatisticButtons({
  statistics,
  setStatistics,
  changedStats,
  setChangedStats,
  setAchievements,
}: StatisticButtonsProps): ReactElement {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { handleUpdateAllStats, handleResetAll } = useStatisticButtons(
    statistics,
    setStatistics,
    changedStats,
    setChangedStats,
    setAchievements,
  )

  const changedCount = Object.keys(changedStats).length
  const hasChanges = changedCount > 0

  return (
    <div className='absolute top-0 right-0 flex gap-2 mt-4 px-10'>
      <Button
        className='bg-btn-secondary text-btn-text font-bold'
        radius='full'
        onPress={handleUpdateAllStats}
        isDisabled={!hasChanges}
        startContent={<TbUpload size={19} />}
      >
        {t('achievementManager.statistics.saveChanges')} {hasChanges && `(${changedCount})`}
      </Button>
      <Button
        className='font-bold'
        radius='full'
        color='danger'
        onPress={onOpen}
        startContent={<TbRotateClockwise className='rotate-90' size={20} />}
      >
        {t('achievementManager.statistics.resetAll')}
      </Button>

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={
          <p className='text-sm'>
            <Trans i18nKey='confirmation.resetStatistics'>
              Are you sure you want to <strong>reset</strong> all statistics?
            </Trans>
          </p>
        }
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => handleResetAll(onOpenChange)}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </div>
  )
}
