import type { Achievement, ChangedStats, Statistic, StatValue } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbRotateClockwise, TbUpload } from 'react-icons/tb'
import { Button, useDisclosure } from '@heroui/react'
import {
  resetAllStats,
  updateStats,
} from '@/features/achievement-manager/services/achievementsService'
import { CustomModal } from '@/shared/components/CustomModal'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus } from '@/shared/utils'

interface StatisticButtonsProps {
  statistics: Statistic[]
  setStatistics: React.Dispatch<React.SetStateAction<Statistic[]>>
  changedStats: ChangedStats
  setChangedStats: React.Dispatch<React.SetStateAction<ChangedStats>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>
}

export function StatisticButtons({
  statistics,
  setStatistics,
  changedStats,
  setChangedStats,
  setAchievements,
  setRefreshKey,
}: StatisticButtonsProps) {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const selectedGame = useUiStore(s => s.selectedGame)
  const userSummary = useUserStore(s => s.userSummary)
  const changedCount = Object.keys(changedStats).length

  const handleUpdate = async () => {
    if (changedCount === 0) return toast.warning(t('toast.updateAll.noChanges'))
    const running = await checkSteamStatus(true)
    if (!running) return
    const valuesArr: StatValue[] = Object.keys(changedStats).map(name => ({
      name,
      value: changedStats[name],
    }))
    const { success, achievements } = await updateStats(
      userSummary?.steamId,
      selectedGame?.appid ?? null,
      selectedGame?.name ?? null,
      valuesArr,
    )
    if (success) {
      if (achievements) setAchievements(achievements)
      toast.success(
        t('toast.updateAll.success', { count: valuesArr.length, appName: selectedGame?.name }),
      )
      setChangedStats({})
    } else {
      toast.danger(t('toast.updateAll.error'))
    }
  }

  const handleReset = async (onClose: () => void) => {
    onClose()
    const running = await checkSteamStatus(true)
    if (!running) return
    const ok = await resetAllStats(
      userSummary?.steamId,
      selectedGame?.appid ?? null,
      selectedGame?.name ?? null,
    )
    if (ok) {
      setStatistics(prev => prev.map(s => ({ ...s, value: 0 })))
      toast.success(
        t('toast.resetAll.success', { count: statistics.length, appName: selectedGame?.name }),
      )
      setChangedStats({})
    } else {
      toast.danger(t('toast.resetAll.error'))
    }
  }

  return (
    <>
      <div className='flex items-center gap-2 py-3'>
        <Button
          size='sm'
          className='bg-btn-secondary text-btn-text font-semibold'
          radius='full'
          onPress={() => {
            if (setRefreshKey) setRefreshKey(k => k + 1)
          }}
        >
          {t('common.refresh')}
        </Button>
        {changedCount > 0 && (
          <Button
            size='sm'
            className='bg-btn-secondary text-btn-text font-semibold'
            radius='full'
            startContent={<TbUpload size={16} />}
            onPress={handleUpdate}
          >
            {t('achievementManager.statistics.saveChanges')}
          </Button>
        )}
        <div className='flex-1' />
        <Button
          size='sm'
          radius='full'
          color='danger'
          className='font-semibold'
          startContent={<TbRotateClockwise className='rotate-90' size={16} />}
          onPress={onOpen}
        >
          {t('achievementManager.statistics.resetAll')}
        </Button>
      </div>
      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={
          <span className='text-sm'>
            {t('achievementManager.statistics.resetAll')} {statistics.length} stats for{' '}
            <span className='font-bold'>{selectedGame?.name}</span>?
          </span>
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
              className='bg-btn-secondary text-btn-text font-semibold'
              radius='full'
              onPress={() => handleReset(onOpenChange)}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
