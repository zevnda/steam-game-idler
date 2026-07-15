import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { SiSteam, SiSteamdb } from 'react-icons/si'
import { TbX } from 'react-icons/tb'
import {
  Alert,
  Button,
  InputGroup,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  Typography,
} from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { openExternalLink } from '@/shared/utils/links'

interface AchievementManagerHeaderProps {
  name: string
  appId: number
  query: string
  onQueryChange: (query: string) => void
  hasProtectedItems: boolean
  onClose: () => void
}

// Static/fixed page header for the achievement-manager overlay - mirrors the header/body separation
// GamesPageHeader.tsx already established (border-b, shrink-0, unaffected by Modal.Body's own
// scroll), rather than main's Achievements.tsx PageHeader (an absolutely-positioned row floating
// over the hero image). Must be rendered as a descendant of the TabsRoot mounted in
// AchievementManagerOverlay.tsx (see that file) so `TabList` here shares context with the
// `TabPanel`s rendered in the body - react-aria-components' Tabs only needs both to be somewhere
// inside the same `<Tabs>` tree, not DOM-adjacent.
export const AchievementManagerHeader = ({
  name,
  appId,
  query,
  onQueryChange,
  hasProtectedItems,
  onClose,
}: AchievementManagerHeaderProps) => {
  const { t } = useTranslation()

  return (
    // `data-tauri-drag-region` throughout this header - the modal (`Modal.Backdrop`, z-50) paints
    // over Titlebar (also z-50, but earlier in DOM so it loses ties) whenever this overlay is open,
    // so the app's only other drag surface becomes unreachable without closing the overlay first.
    // Matches Titlebar.tsx's own pattern: the attribute goes on wrapping divs freely alongside real
    // buttons/inputs - Tauri only starts a drag when the pointerdown's target is literally the
    // tagged element itself, not a descendant, so interactive children keep working normally.
    <div
      className='bg-overlay relative z-10 flex shrink-0 flex-col gap-3 border-b border-border px-6 py-3'
      data-tauri-drag-region
    >
      <div className='flex items-center justify-between gap-4' data-tauri-drag-region>
        <div className='flex min-w-0 items-center gap-2' data-tauri-drag-region>
          <Button isIconOnly aria-label='Close' variant='ghost' onPress={onClose}>
            <TbX fontSize={18} />
          </Button>
          <Typography className='max-w-65 truncate' data-tauri-drag-region type='h3'>
            {name}
          </Typography>
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <Button
                isIconOnly
                aria-label={t('dashboard.achievements.header.viewOnSteam')}
                variant='ghost'
                onPress={() =>
                  openExternalLink(`https://steamcommunity.com/stats/${appId}/achievements/`)
                }
              >
                <SiSteam fontSize={15} />
              </Button>
            </AppTooltip.Trigger>
            <AppTooltip.Content>
              {t('dashboard.achievements.header.viewOnSteam')}
            </AppTooltip.Content>
          </AppTooltip.Root>
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <Button
                isIconOnly
                aria-label={t('dashboard.achievements.header.viewOnSteamDb')}
                variant='ghost'
                onPress={() => openExternalLink(`https://steamdb.info/app/${appId}/stats/`)}
              >
                <SiSteamdb fontSize={15} />
              </Button>
            </AppTooltip.Trigger>
            <AppTooltip.Content>
              {t('dashboard.achievements.header.viewOnSteamDb')}
            </AppTooltip.Content>
          </AppTooltip.Root>

          <TabListContainer className='ml-2 shrink-0'>
            <TabList>
              <Tab id='achievements'>
                {t('dashboard.achievements.tabs.achievements')}
                <TabIndicator />
              </Tab>
              <Tab id='statistics'>
                {t('dashboard.achievements.tabs.statistics')}
                <TabIndicator />
              </Tab>
            </TabList>
          </TabListContainer>
        </div>

        <InputGroup className='w-64 shrink-0'>
          <InputGroup.Prefix>
            <RiSearchLine className='text-muted' fontSize={16} />
          </InputGroup.Prefix>
          <InputGroup.Input
            placeholder={t('common.search.placeholder')}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
          />
          {query && (
            <InputGroup.Suffix>
              <button aria-label='Clear search' type='button' onClick={() => onQueryChange('')}>
                <TbX fontSize={16} />
              </button>
            </InputGroup.Suffix>
          )}
        </InputGroup>
      </div>

      {hasProtectedItems && (
        <Alert status='warning'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.achievements.protectedAlert.title')}</Alert.Title>
            <Alert.Description>
              {t('dashboard.achievements.protectedAlert.description')}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  )
}
