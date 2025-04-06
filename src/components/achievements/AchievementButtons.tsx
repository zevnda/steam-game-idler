import type { Achievement, SortOption } from '@/types'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

import {
  Button,
  cn,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbLock, TbLockOpen, TbSortDescending2 } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import useAchievementButtons from '@/hooks/achievements/useAchievementButtons'

interface AchievementButtonsProps {
  achievements: Achievement[]
  setAchievements: Dispatch<SetStateAction<Achievement[]>>
  protectedAchievements: boolean
}

export default function AchievementButtons({
  achievements,
  setAchievements,
  protectedAchievements,
}: AchievementButtonsProps): ReactElement {
  const { t } = useTranslation()
  const { userSummary } = useUserContext()
  const { appId, appName } = useStateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { handleChange, handleUnlockAll, handleLockAll } = useAchievementButtons(userSummary, setAchievements)
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

  const getTranslatedState = (state: string): string => {
    if (state === 'unlock') return t('achievementManager.achievements.unlock')
    if (state === 'lock') return t('achievementManager.achievements.lock')
    return state
  }

  const handleShowModal = (onOpen: () => void, state: string): void => {
    setState(state)
    onOpen()
  }

  return (
    <div className='absolute top-0 right-0 flex gap-2 mr-8 mt-1'>
      <Button
        isDisabled={protectedAchievements || unAchieved.length === 0}
        size='sm'
        className='font-semibold rounded-lg bg-dynamic text-button-text'
        onPress={() => handleShowModal(onOpen, 'unlock')}
        startContent={<TbLockOpen size={20} />}
      >
        {t('achievementManager.achievements.unlockAll')}
      </Button>

      <Button
        isDisabled={protectedAchievements || achieved.length === 0}
        size='sm'
        color='danger'
        className='font-semibold rounded-lg'
        onPress={() => handleShowModal(onOpen, 'lock')}
        startContent={<TbLock size={20} />}
      >
        {t('achievementManager.achievements.lockAll')}
      </Button>

      <Select
        size='sm'
        aria-label='sort'
        disallowEmptySelection
        radius='none'
        startContent={<TbSortDescending2 fontSize={26} />}
        items={sortOptions}
        className='w-[230px]'
        classNames={{
          listbox: ['p-0'],
          value: ['text-sm !text-content'],
          trigger: cn(
            'bg-titlebar border border-border data-[hover=true]:!bg-input',
            'data-[open=true]:!bg-input duration-100 rounded-lg',
          ),
          popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
        }}
        defaultSelectedKeys={['percent']}
        onSelectionChange={e => {
          handleChange(e.currentKey, achievements, setAchievements)
        }}
      >
        {item => (
          <SelectItem
            classNames={{
              base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'],
            }}
          >
            {item.label}
          </SelectItem>
        )}
      </Select>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className='bg-modalbody text-content'
        classNames={{
          closeButton: ['text-altwhite hover:bg-titlehover duration-200'],
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                {t('common.confirm')}
              </ModalHeader>
              <ModalBody className='my-4'>
                <p className='text-sm'>
                  <Trans
                    i18nKey='achievementManager.achievements.modal'
                    values={{
                      state: getTranslatedState(state),
                    }}
                  >
                    Are you sure you want to <strong>{state}</strong> all achievements?
                  </Trans>
                </p>
              </ModalBody>
              <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                <Button size='sm' color='danger' variant='light' className='font-semibold rounded-lg' onPress={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  size='sm'
                  className='font-semibold rounded-lg bg-dynamic text-button-text'
                  onPress={() => {
                    if (state === 'unlock') {
                      if (appId && appName) {
                        handleUnlockAll(appId, appName, achievements, onClose)
                      }
                    } else {
                      if (appId && appName) {
                        handleLockAll(appId, appName, achievements, onClose)
                      }
                    }
                  }}
                >
                  {t('common.confirm')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
