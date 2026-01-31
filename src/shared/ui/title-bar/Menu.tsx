import { cn, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaDiscord } from 'react-icons/fa'
import {
  TbBookFilled,
  TbBugFilled,
  TbBulbFilled,
  TbDownload,
  TbListCheck,
  TbSquareRoundedChevronDown,
  TbStarFilled,
} from 'react-icons/tb'

import { getRuntimeConfig } from '@/shared/config/runtime'
import { openExternalLink } from '@/shared/utils'

// TODO: Uncomment lines when changelog modal and update handler are implemented

export const Menu = () => {
  const { t } = useTranslation()
  const { isPortable } = getRuntimeConfig()
  const [showMenu, setShowMenu] = useState(false)

  const githubIssueUrl =
    'https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels='

  return (
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
              base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
            }}
            onPress={() => openExternalLink('https://steamgameidler.com/docs/')}
          >
            {t('titlebar_menu.user_guide')}
          </DropdownItem>

          <DropdownItem
            key='report'
            startContent={<TbBugFilled size={18} />}
            textValue='Report an issue'
            className='rounded-xl text-content'
            classNames={{
              base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
            }}
            onPress={() =>
              openExternalLink(`${githubIssueUrl}bug+report&projects=&template=bug_report.yml`)
            }
          >
            {t('titlebar_menu.report_issue')}
          </DropdownItem>

          <DropdownItem
            showDivider
            key='feature'
            startContent={<TbBulbFilled size={18} />}
            textValue='Feature request'
            className='rounded-xl text-content'
            classNames={{
              base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
            }}
            onPress={() =>
              openExternalLink(
                `${githubIssueUrl}feature+request&projects=&template=feature_request.yml`,
              )
            }
          >
            {t('titlebar_menu.request_feature')}
          </DropdownItem>

          <DropdownItem
            showDivider
            key='support-me'
            startContent={<TbStarFilled size={18} />}
            textValue='Support me'
            className='rounded-xl text-content'
            classNames={{
              base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
            }}
            onPress={() => openExternalLink('https://github.com/sponsors/zevnda')}
          >
            {t('titlebar_menu.support_project')}
          </DropdownItem>

          <DropdownItem
            showDivider
            key='join-discord'
            startContent={<FaDiscord size={18} />}
            textValue='Join our Discord'
            className='rounded-xl text-content'
            classNames={{
              base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
            }}
            onPress={() => openExternalLink('https://discord.com/invite/5kY2ZbVnZ8')}
          >
            {t('titlebar_menu.join_discord')}
          </DropdownItem>

          <DropdownItem
            key='changelog'
            startContent={<TbListCheck size={18} />}
            textValue='Changelog'
            className='rounded-xl text-content'
            classNames={{
              base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
            }}
            // onPress={() => setShowChangelog(true)}
          >
            {t('titlebar_menu.view_changelog')}
          </DropdownItem>

          {isPortable ? (
            <DropdownItem
              key='updates'
              startContent={<TbDownload size={18} />}
              textValue='Check for updates'
              className='rounded-xl text-content'
              classNames={{
                base: 'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
              }}
              // onPress={handleUpdate}
            >
              {t('titlebar_menu.check_for_updates')}
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
