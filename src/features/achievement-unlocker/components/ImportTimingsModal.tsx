import type { Achievement } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, cn, Input } from '@heroui/react'
import { CustomModal, ExtLink, showDangerToast, showSuccessToast } from '@/shared/components'
import { OpenDocs } from '@/shared/components/OpenDocs'
import { useUserStore } from '@/shared/stores'
import { decrypt } from '@/shared/utils'

interface ImportTimingsModalProps {
  isOpen: boolean
  onOpenChange: () => void
  appId: number
  achievements: Achievement[]
  onImport: (reordered: Achievement[]) => void
}

interface RawAchievement {
  apiname: string
  unlocktime: number
}

const getErrorKey = (e: unknown) => {
  const s = String(e)
  if (s.includes('PROFILE_PRIVATE')) return 'toast.importTimings.privateProfile'
  if (s.includes('NO_TIMESTAMPS')) return 'toast.importTimings.noTimestamps'
  if (s.includes('NOT_FOUND')) return 'toast.importTimings.notFound'
  return 'toast.importTimings.error'
}

export const ImportTimingsModal = ({
  isOpen,
  onOpenChange,
  appId,
  achievements,
  onImport,
}: ImportTimingsModalProps) => {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setInputValue('')
    onOpenChange()
  }

  const handleImport = async () => {
    if (!inputValue.trim()) return
    setIsLoading(true)
    try {
      const apiKey = userSettings.general?.apiKey || undefined
      const result = await invoke<{ achievements: RawAchievement[] }>('get_player_achievements', {
        appId,
        steamInput: inputValue.trim(),
        apiKey: apiKey ? decrypt(apiKey) : null,
      })

      const raw = [...result.achievements].sort((a, b) => a.unlocktime - b.unlocktime)

      const delayMap = new Map<string, number>()
      for (let i = 0; i < raw.length - 1; i++) {
        const minutes = (raw[i + 1].unlocktime - raw[i].unlocktime) / 60
        delayMap.set(raw[i].apiname, Math.round(minutes * 10) / 10)
      }

      const orderMap = new Map<string, number>()
      raw.forEach((a, idx) => orderMap.set(a.apiname, idx))

      const matched: Achievement[] = []
      const unmatched: Achievement[] = []

      for (const a of achievements) {
        if (orderMap.has(a.id)) {
          const delay = delayMap.get(a.id)
          matched.push(delay !== undefined ? { ...a, delayNextUnlock: delay } : { ...a })
        } else {
          const { delayNextUnlock: _, ...rest } = a
          unmatched.push({ ...rest, skip: true } as Achievement)
        }
      }

      matched.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

      onImport([...matched, ...unmatched])
      showSuccessToast(t('toast.importTimings.success', { count: matched.length }))
      handleClose()
    } catch (error) {
      showDangerToast(t(getErrorKey(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleImport()
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={handleClose}
      title={
        <div className='flex items-center gap-2'>
          <p>{t('customLists.achievementUnlocker.importTimings.title')}</p>
          <OpenDocs path='/features/achievement-unlocker/import-timings' />
        </div>
      }
      body={
        <div className='flex flex-col gap-3'>
          <p className='text-sm text-altwhite'>
            {t('customLists.achievementUnlocker.importTimings.description')}
          </p>
          <p className='text-sm text-altwhite'>
            <Trans i18nKey='customLists.achievementUnlocker.importTimings.descriptionTwo'>
              Use achievement tracking sites like{' '}
              <ExtLink
                href={`https://steamhunters.com/apps/${appId}/users?sort=achievements`}
                className='text-dynamic hover:text-dynamic-hover duration-150'
              >
                Steam Hunters
              </ExtLink>{' '}
              to find users with legitimate achievements
            </Trans>
          </p>

          <Input
            autoFocus
            placeholder={t('customLists.achievementUnlocker.importTimings.inputPlaceholder')}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            isDisabled={isLoading}
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover',
                'group-data-[focus-within=true]:!bg-inputhover',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
              ),
              input: ['!text-content placeholder:text-altwhite/50'],
            }}
          />
        </div>
      }
      buttons={
        <>
          <Button
            size='sm'
            color='danger'
            variant='light'
            radius='full'
            onPress={handleClose}
            isDisabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            isLoading={isLoading}
            isDisabled={!inputValue.trim()}
            onPress={handleImport}
          >
            {t('common.import')}
          </Button>
        </>
      }
    />
  )
}
