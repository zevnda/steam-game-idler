import type { Achievement, SortOption } from '@/shared/types'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbLock, TbLockOpen, TbSortDescending2 } from 'react-icons/tb'
import { Button, cn, Select, SelectItem, useDisclosure } from '@heroui/react'
import {
  handleLockAllAchievements,
  handleSortingChange,
  handleUnlockAllAchievements,
} from '@/features/achievement-manager'
import { useStateStore } from '@/shared/stores'
import { CustomModal } from '@/shared/ui'

interface AchievementButtonsProps {
  achievements: Achievement[]
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  protectedAchievements: boolean
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>
}

export const AchievementButtons = ({
  achievements,
  setAchievements,
  protectedAchievements,
  setRefreshKey,
}: AchievementButtonsProps) => {
  const { t } = useTranslation()
  const appId = useStateStore(state => state.appId)
  const appName = useStateStore(state => state.appName)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [state, setState] = useState('')

  const sortOptions: SortOption[] = [
    {
      key: 'percent',
      label: t('achievementManager.achievements.sort.percent'),
    },
    {
      key: 'title',
      label: t('achievementManager.achievements.sort.title'),
    },
    {
      key: 'unlocked',
      label: t('achievementManager.achievements.sort.unlocked'),
    },
    {
      key: 'locked',
      label: t('achievementManager.achievements.sort.locked'),
    },
    {
      key: 'unprotected',
      label: t('achievementManager.achievements.sort.unprotected'),
    },
    {
      key: 'protected',
      label: t('achievementManager.achievements.sort.protected'),
    },
  ]

  const unAchieved = achievements.filter(achievement => !achievement.achieved)
  const achieved = achievements.filter(achievement => achievement.achieved)

  const getTranslatedState = (state: string) => {
    if (state === 'unlock') return t('achievementManager.achievements.unlock')
    if (state === 'lock') return t('achievementManager.achievements.lock')
    return state
  }

  const handleShowModal = (onOpen: () => void, state: string) => {
    setState(state)
    onOpen()
  }

  return (
    <div className='absolute top-0 right-0 flex gap-2 mt-4 px-10'>
      <Button
        className='bg-btn-secondary text-btn-text font-bold'
        radius='full'
        onPress={() => {
          if (setRefreshKey) setRefreshKey(prev => prev + 1)
        }}
      >
        {t('setup.refresh')}
      </Button>

      <Button
        className='bg-btn-secondary text-btn-text font-bold'
        radius='full'
        isDisabled={protectedAchievements || unAchieved.length === 0}
        onPress={() => handleShowModal(onOpen, 'unlock')}
        startContent={<TbLockOpen size={20} />}
      >
        {t('achievementManager.achievements.unlockAll')}
      </Button>

      <Button
        className='font-bold'
        radius='full'
        color='danger'
        isDisabled={protectedAchievements || achieved.length === 0}
        onPress={() => handleShowModal(onOpen, 'lock')}
        startContent={<TbLock size={20} />}
      >
        {t('achievementManager.achievements.lockAll')}
      </Button>

      <Select
        aria-label='sort'
        disallowEmptySelection
        radius='none'
        startContent={<TbSortDescending2 fontSize={26} />}
        items={sortOptions}
        className='w-57.5'
        classNames={{
          listbox: ['p-0'],
          value: ['text-sm !text-content'],
          trigger: cn(
            'bg-btn-achievement-header data-[hover=true]:!bg-btn-achievement-header-hover',
            'data-[open=true]:!bg-btn-achievement-header-open duration-100 rounded-lg',
          ),
          popoverContent: ['bg-input rounded-xl justify-start !text-content'],
        }}
        defaultSelectedKeys={['percent']}
        onSelectionChange={e => {
          handleSortingChange(e.currentKey, achievements, setAchievements)
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

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={
          <p className='text-sm'>
            <Trans
              i18nKey='achievementManager.achievements.modal'
              values={{
                state: getTranslatedState(state).toLowerCase(),
              }}
            >
              Are you sure you want to <strong>{state}</strong> all achievements?
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
              onPress={() => {
                if (state === 'unlock') {
                  if (appId && appName) {
                    handleUnlockAllAchievements(
                      appId,
                      appName,
                      achievements,
                      setAchievements,
                      onOpenChange,
                    )
                  }
                } else {
                  if (appId && appName) {
                    handleLockAllAchievements(
                      appId,
                      appName,
                      achievements,
                      setAchievements,
                      onOpenChange,
                    )
                  }
                }
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </div>
  )
}
