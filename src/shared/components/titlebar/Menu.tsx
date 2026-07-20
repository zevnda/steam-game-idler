import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useState } from 'react'
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
import { Dropdown, toast } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { openExternalLink } from '@/shared/utils/links'
import { canAutoUpdateCheck, fetchLatest, performUpdate } from '@/shared/utils/update'

const GITHUB_ISSUE_URL =
  'https://github.com/zevnda/steam-game-idler/issues/new?assignees=zevnda&labels='

type MenuAction =
  'guide' | 'report' | 'feature' | 'support' | 'discord' | 'changelog' | 'checkUpdate'

// Titlebar overflow menu - guide/report/feature/support/discord links, a changelog toggle, and an
// opt-in "check for updates" entry (hidden on builds that can't self-update - a portable Windows
// zip, or a Linux deb/rpm install; see platform::can_auto_update's doc comment). Uses HeroUI v3's
// Dropdown (react-aria Menu underneath) rather than main's older Dropdown/DropdownItem API.
export const Menu = () => {
  const { t } = useTranslation()
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const setIsUpdating = useUpdateStore(state => state.setIsUpdating)
  const [canAutoUpdate, setCanAutoUpdate] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    canAutoUpdateCheck().then(setCanAutoUpdate)
  }, [])

  const handleCheckForUpdates = async () => {
    try {
      setIsChecking(true)
      const update = await check()
      if (!update) {
        toast.info(t('toast.checkUpdate.none'))
        return
      }
      const latest = await fetchLatest()
      await performUpdate(update, { major: !!latest?.major, setIsUpdating })
    } catch (error) {
      toast.danger(t('toast.checkUpdate.error'))
      console.error('Error in (handleCheckForUpdates):', error)
      logFrontendWarn('Menu', 'manual update check failed', { error: String(error) })
    } finally {
      setIsChecking(false)
    }
  }

  const handleAction = (key: MenuAction) => {
    switch (key) {
      case 'guide':
        openExternalLink('https://steamgameidler.com/docs/')
        break
      case 'report':
        openExternalLink(
          `${GITHUB_ISSUE_URL}bug%2Cinvestigating&projects=&template=issue_report.yml`,
        )
        break
      case 'feature':
        openExternalLink(
          `${GITHUB_ISSUE_URL}feature+request&projects=&template=feature_request.yml`,
        )
        break
      case 'support':
        openExternalLink('https://github.com/sponsors/zevnda')
        break
      case 'discord':
        openExternalLink('https://discord.com/invite/5kY2ZbVnZ8')
        break
      case 'changelog':
        setShowChangelog(true)
        break
      case 'checkUpdate':
        void handleCheckForUpdates()
        break
    }
  }

  return (
    <Dropdown.Root>
      <AppTooltip.Root delay={300}>
        <AppTooltip.Trigger>
          <Dropdown.Trigger
            aria-label={t('common.menu')}
            className='flex h-14 w-12 items-center justify-center text-foreground outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
            isDisabled={isChecking}
          >
            <TbSquareRoundedChevronDown fontSize={18} />
          </Dropdown.Trigger>
        </AppTooltip.Trigger>
        <AppTooltip.Content placement='bottom'>{t('common.menu')}</AppTooltip.Content>
      </AppTooltip.Root>

      <Dropdown.Popover placement='bottom end'>
        <Dropdown.Menu
          aria-label={t('common.menu')}
          onAction={key => handleAction(key as MenuAction)}
        >
          <Dropdown.Item id='guide' textValue={t('menu.guide')}>
            <TbBookFilled fontSize={16} />
            {t('menu.guide')}
          </Dropdown.Item>
          <Dropdown.Item id='report' textValue={t('menu.issue')}>
            <TbBugFilled fontSize={16} />
            {t('menu.issue')}
          </Dropdown.Item>
          <Dropdown.Item id='feature' textValue={t('menu.feature')}>
            <TbBulbFilled fontSize={16} />
            {t('menu.feature')}
          </Dropdown.Item>
          <Dropdown.Item id='support' textValue={t('menu.support')}>
            <TbStarFilled fontSize={16} />
            {t('menu.support')}
          </Dropdown.Item>
          <Dropdown.Item id='discord' textValue={t('menu.joinDiscord')}>
            <FaDiscord fontSize={16} />
            {t('menu.joinDiscord')}
          </Dropdown.Item>
          <Dropdown.Item id='changelog' textValue={t('menu.changelog')}>
            <TbListCheck fontSize={16} />
            {t('menu.changelog')}
          </Dropdown.Item>
          {canAutoUpdate && (
            <Dropdown.Item id='checkUpdate' textValue={t('menu.update')}>
              <TbDownload fontSize={16} />
              {t('menu.update')}
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  )
}
