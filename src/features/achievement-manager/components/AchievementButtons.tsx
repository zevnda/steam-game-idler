import type { Achievement, SortOption } from '@/shared/types'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbLock, TbLockOpen, TbSortDescending2 } from 'react-icons/tb'
import { Button, cn, Select, SelectItem, useDisclosure } from '@heroui/react'
import {
  applyAchievementChanges,
  lockAllAchievements,
  sortAchievements,
  unlockAllAchievements,
} from '@/features/achievement-manager/services/achievementsService'
import { CustomModal } from '@/shared/components/CustomModal'
import { useUiStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus } from '@/shared/utils'

interface AchievementButtonsProps {
  achievements: Achievement[]
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  protectedAchievements: boolean
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>
  selectedToUnlock: Set<string>
  setSelectedToUnlock: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedToLock: Set<string>
  setSelectedToLock: React.Dispatch<React.SetStateAction<Set<string>>>
}

export function AchievementButtons({
  achievements,
  setAchievements,
  protectedAchievements,
  setRefreshKey,
  selectedToUnlock,
  setSelectedToUnlock,
  selectedToLock,
  setSelectedToLock,
}: AchievementButtonsProps) {
  const { t } = useTranslation()
  const selectedGame = useUiStore(s => s.selectedGame)
  const userSummary = useUserStore(s => s.userSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [action, setAction] = useState('')

  const sortOptions: SortOption[] = [
    { key: 'percent', label: t('achievementManager.achievements.sort.percent') },
    { key: 'title', label: t('achievementManager.achievements.sort.title') },
    { key: 'unlocked', label: t('achievementManager.achievements.sort.unlocked') },
    { key: 'locked', label: t('achievementManager.achievements.sort.locked') },
    { key: 'unprotected', label: t('achievementManager.achievements.sort.unprotected') },
    { key: 'protected', label: t('achievementManager.achievements.sort.protected') },
  ]

  const handleApply = async (onClose: () => void) => {
    if (!selectedGame) return
    onClose()
    const running = await checkSteamStatus(true)
    if (!running) return
    const result = await applyAchievementChanges(
      userSummary?.steamId,
      selectedGame.appid,
      selectedGame.name,
      selectedToUnlock,
      selectedToLock,
      achievements,
    )
    if (result) {
      setAchievements(prev =>
        prev.map(a => {
          if (result.unlocked.has(a.id)) return { ...a, achieved: true }
          if (result.locked.has(a.id)) return { ...a, achieved: false }
          return a
        }),
      )
      setSelectedToUnlock(new Set())
      setSelectedToLock(new Set())
    }
  }

  const handleConfirm = async (onClose: () => void) => {
    if (!selectedGame) return
    onClose()
    const running = await checkSteamStatus(true)
    if (!running) return
    if (action === 'unlock') {
      const ok = await unlockAllAchievements(
        userSummary?.steamId,
        selectedGame.appid,
        achievements.length,
        selectedGame.name,
      )
      if (ok) setAchievements(prev => prev.map(a => ({ ...a, achieved: true })))
    } else if (action === 'lock') {
      const ok = await lockAllAchievements(
        userSummary?.steamId,
        selectedGame.appid,
        achievements.length,
        selectedGame.name,
      )
      if (ok) setAchievements(prev => prev.map(a => ({ ...a, achieved: false })))
    }
  }

  const hasChanges = selectedToUnlock.size > 0 || selectedToLock.size > 0

  return (
    <>
      <div className='flex items-center gap-2 py-3'>
        {hasChanges && (
          <Button
            size='sm'
            className='bg-btn-secondary text-btn-text font-semibold'
            radius='full'
            onPress={onOpen}
          >
            {t('achievementManager.achievements.applyChanges', {
              total: selectedToUnlock.size + selectedToLock.size,
            })}
          </Button>
        )}
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
        <div className='flex-1' />
        <Button
          size='sm'
          radius='full'
          className='font-semibold'
          color='success'
          startContent={<TbLockOpen size={16} />}
          isDisabled={protectedAchievements}
          onPress={() => {
            setAction('unlock')
            onOpen()
          }}
        >
          {t('achievementManager.achievements.unlockAll')}
        </Button>
        <Button
          size='sm'
          radius='full'
          className='font-semibold'
          color='danger'
          startContent={<TbLock size={16} />}
          isDisabled={protectedAchievements}
          onPress={() => {
            setAction('lock')
            onOpen()
          }}
        >
          {t('achievementManager.achievements.lockAll')}
        </Button>
        <Select
          aria-label='sort'
          disallowEmptySelection
          radius='none'
          items={sortOptions}
          className='w-44'
          classNames={{
            listbox: ['p-0'],
            value: ['text-sm !text-content'],
            trigger: cn(
              'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-xl h-8',
            ),
            popoverContent: ['bg-surface border border-border/20 rounded-xl !text-content'],
          }}
          startContent={<TbSortDescending2 />}
          defaultSelectedKeys={['percent']}
          onSelectionChange={e => {
            if (e.currentKey) setAchievements(sortAchievements(achievements, e.currentKey))
          }}
        >
          {item => (
            <SelectItem
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
            >
              {item.label}
            </SelectItem>
          )}
        </Select>
      </div>

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={
          hasChanges ? (
            <Trans
              i18nKey='achievementManager.achievements.applyChanges'
              values={{
                unlock: selectedToUnlock.size,
                lock: selectedToLock.size,
                appName: selectedGame?.name,
              }}
              components={{
                1: <span className='font-bold text-success' />,
                3: <span className='font-bold text-danger' />,
                5: <span className='font-bold' />,
              }}
            />
          ) : (
            <Trans
              i18nKey='achievementManager.achievements.modal'
              values={{ state: action === 'unlock' ? 'unlock' : 'lock' }}
              components={{
                1: (
                  <span
                    className={
                      action === 'unlock' ? 'font-bold text-success' : 'font-bold text-danger'
                    }
                  />
                ),
              }}
            />
          )
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
              onPress={() => (hasChanges ? handleApply(onOpenChange) : handleConfirm(onOpenChange))}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
