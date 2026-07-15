import type { SettingsTab } from '@/shared/stores/settingsModalStore'
import { useTranslation } from 'react-i18next'
import { FaDiscord, FaGithub } from 'react-icons/fa6'
import { TbBookFilled } from 'react-icons/tb'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { openExternalLink } from '@/shared/utils/links'

const GITHUB_URL = 'https://github.com/zevnda/steam-game-idler'
const DISCORD_URL = 'https://discord.com/invite/5kY2ZbVnZ8'

// Maps each settings tab to its docs slug, mirroring `docs/app/(marketing)/docs/_content/settings/`'s
// file layout - `steamCredentials` is the one exception, living at the content tree's top level
// (`_content/steam-credentials.mdx`) rather than under `settings/`, since it covers Steam Community
// cookies rather than an in-app settings category (see docs/CLAUDE.md's content rewrite tracker).
const DOCS_SLUG_BY_TAB: Record<SettingsTab, string> = {
  general: 'settings/general',
  subscription: 'pro',
  customization: 'settings/customization',
  steamCredentials: 'steam-credentials',
  cardFarming: 'settings/card-farming',
  achievementUnlocker: 'settings/achievement-unlocker',
  inventoryManager: 'settings/inventory-manager',
  freeGames: 'settings/free-games',
  gameSettings: 'settings/game-settings',
  keybinds: '',
  debug: 'settings/debug',
}

// Settings sidebar footer row, matching `main`'s `SocialButtons` (docs/GitHub/Discord icon links) -
// only used here, same as `main`'s. The docs button deep-links to the active settings tab's page,
// like `main`'s did, now that the docs site's URL structure is known (it lives in this repo at
// `docs/app/(marketing)/docs/_content/`).
export const SocialButtons = () => {
  const { t } = useTranslation()
  const activeTab = useSettingsModalStore(state => state.activeTab)

  const links = [
    {
      href: `https://steamgameidler.com/docs/${DOCS_SLUG_BY_TAB[activeTab]}`,
      icon: TbBookFilled,
      labelKey: 'menu.guide',
    },
    { href: GITHUB_URL, icon: FaGithub, labelKey: 'dashboard.settings.footer.github' },
    { href: DISCORD_URL, icon: FaDiscord, labelKey: 'menu.joinDiscord' },
  ] as const

  return (
    <div className='flex items-center justify-center gap-1'>
      {links.map(({ href, icon: Icon, labelKey }) => (
        <AppTooltip.Root delay={300} key={href}>
          <AppTooltip.Trigger>
            <button
              aria-label={t(labelKey)}
              className='rounded-full p-2 text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus cursor-pointer'
              type='button'
              onClick={() => openExternalLink(href)}
            >
              <Icon fontSize={18} />
            </button>
          </AppTooltip.Trigger>
          <AppTooltip.Content placement='top'>{t(labelKey)}</AppTooltip.Content>
        </AppTooltip.Root>
      ))}
    </div>
  )
}
