import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'

import { cn, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useUpdateStore } from '@/stores/updateStore'
import { useTranslation } from 'react-i18next'
import { FaDiscord } from 'react-icons/fa6'
import {
  TbBookFilled,
  TbBugFilled,
  TbBulbFilled,
  TbDownload,
  TbListCheck,
  TbSquareRoundedChevronDown,
  TbStarFilled,
} from 'react-icons/tb'

import CustomTooltip from '@/components/ui/CustomTooltip'
import { fetchLatest, handleOpenExtLink, isPortableCheck, logEvent, preserveKeysAndClearData } from '@/utils/tasks'
import { showDangerToast, showPrimaryToast } from '@/utils/toasts'

export default function HeaderMenu(): ReactElement {
  const { t } = useTranslation()
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const [showMenu, setShowMenu] = useState(false)
  const [isPortable, setIsPortable] = useState(false)

  const githubIssueUrl = 'https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels='

  useEffect(() => {
    ;(async () => {
      const portable = await isPortableCheck()
      setIsPortable(portable)
    })()
  }, [])

  const handleUpdate = async (): Promise<void> => {
    try {
      const update = await check()
      if (update) {
        localStorage.setItem('hasUpdated', 'true')
        await invoke('kill_all_steamutil_processes')
        const latest = await fetchLatest()
        await update.downloadAndInstall()
        if (latest?.major) {
          await preserveKeysAndClearData()
        }
        await relaunch()
      } else {
        showPrimaryToast(t('toast.checkUpdate.none'))
      }
    } catch (error) {
      showDangerToast(t('toast.checkUpdate.error'))
      console.error('Error in (handleUpdate):', error)
      logEvent(`Error in (handleUpdate): ${error}`)
    }
  }

  return (
    <CustomTooltip content={t('common.menu')}>
      <div>
        <Dropdown
          aria-label='Settings actions'
          backdrop='opaque'
          onOpenChange={() => setShowMenu(!showMenu)}
          classNames={{
            content: ['rounded-xl p-0 bg-transparent'],
          }}
        >
          <DropdownTrigger>
            <div
              className={cn(
                'flex items-center justify-center hover:text-content/80 hover:bg-header-hover/10 h-9 w-12',
                'cursor-pointer active:scale-90 relative duration-150',
              )}
            >
              <TbSquareRoundedChevronDown fontSize={18} />
            </div>
          </DropdownTrigger>

          <DropdownMenu
            aria-label='Settings actions'
            classNames={{ base: 'bg-popover border border-border rounded-xl' }}
          >
            <DropdownItem
              showDivider
              key='help'
              startContent={<TbBookFilled size={18} />}
              textValue='Help'
              className='rounded-xl text-content'
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
              onPress={() => handleOpenExtLink('https://steamgameidler.com/docs/')}
            >
              {t('menu.guide')}
            </DropdownItem>

            <DropdownItem
              key='report'
              startContent={<TbBugFilled size={18} />}
              textValue='Report an issue'
              className='rounded-xl text-content'
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
              onPress={() =>
                handleOpenExtLink(githubIssueUrl + 'bug%2Cinvestigating&projects=&template=issue_report.yml')
              }
            >
              {t('menu.issue')}
            </DropdownItem>

            <DropdownItem
              showDivider
              key='feature'
              startContent={<TbBulbFilled size={18} />}
              textValue='Feature request'
              className='rounded-xl text-content'
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
              onPress={() =>
                handleOpenExtLink(githubIssueUrl + 'feature+request&projects=&template=feature_request.yml')
              }
            >
              {t('menu.feature')}
            </DropdownItem>

            <DropdownItem
              showDivider
              key='support-me'
              startContent={<TbStarFilled size={18} />}
              textValue='Support me'
              className='rounded-xl text-content'
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
              onPress={() => handleOpenExtLink('https://github.com/sponsors/zevnda')}
            >
              {t('menu.support')}
            </DropdownItem>

            <DropdownItem
              showDivider
              key='join-discord'
              startContent={<FaDiscord size={18} />}
              textValue='Join our Discord'
              className='rounded-xl text-content'
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
              onPress={() => handleOpenExtLink('https://discord.com/invite/eB3uRXZ3Am')}
            >
              {t('menu.joinDiscord')}
            </DropdownItem>

            <DropdownItem
              key='changelog'
              startContent={<TbListCheck size={18} />}
              textValue='Changelog'
              className='rounded-xl text-content'
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
              onPress={() => setShowChangelog(true)}
            >
              {t('menu.changelog')}
            </DropdownItem>

            {isPortable === false ? (
              <DropdownItem
                key='updates'
                startContent={<TbDownload size={18} />}
                textValue='Check for updates'
                className='rounded-xl text-content'
                classNames={{
                  base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
                }}
                onPress={handleUpdate}
              >
                {t('menu.update')}
              </DropdownItem>
            ) : null}
          </DropdownMenu>
        </Dropdown>
      </div>
    </CustomTooltip>
  )
}
