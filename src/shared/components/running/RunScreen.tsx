import type { RunView, RunViewFeature } from '@/shared/stores/runViewStore'
import type { ReactNode } from 'react'
import { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabPanel,
  TabsRoot,
} from '@heroui/react'
import { PageToolbar } from '@/shared/components/dashboard/PageToolbar'
import { useNow } from '@/shared/hooks/useNow'
import { usePlayingSessionStore } from '@/shared/stores/playingSessionStore'
import { useRunViewStore } from '@/shared/stores/runViewStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { formatDuration } from '@/shared/utils/formatDuration'
import { switchViewWithTransition } from '@/shared/utils/pageTransition'

// "Running" (or "Paused" while another session on the account is playing a game, when nothing
// runs) with how long the session has been going. Shows nothing for a finished session's summary.
// Plain text, no status dot.
const RunStatus = ({ isRunning, startedAtMs }: { isRunning: boolean; startedAtMs: number }) => {
  const { t } = useTranslation()
  const now = useNow()
  const activeKey = useSessionStore(state => state.activeAccountKey)
  const isPaused = usePlayingSessionStore(state => Boolean(activeKey && state.entries[activeKey]))
  if (!isRunning) return <div />
  return (
    <div className='flex min-h-10 items-center gap-2.5'>
      <span className='font-bold'>
        {isPaused ? t('common.status.paused') : t('common.status.running')}
      </span>
      {startedAtMs > 0 && (
        <span className='tabular-nums text-muted'>
          {formatDuration((now - startedAtMs) / 1000)}
        </span>
      )}
    </div>
  )
}

interface RunScreenProps {
  feature: RunViewFeature
  isRunning: boolean
  startedAtMs: number
  // The page's own buttons (settings, start/stop...), kept exactly as the idle page has them
  actions: ReactNode
  // Shown above both tabs' content, e.g. the Achievement Unlocker's scan progress
  banner?: ReactNode
  overview: ReactNode
  details: ReactNode
  // Set only for a finished session's summary - renders the Done button that returns to the page
  onDismissFinished?: () => void
}

// The shell both running screens share: a toolbar with the session's status, the Overview /
// Details tabs and the page's buttons, then the selected tab's content. Switching tabs crossfades
// like every other tab in the app (pageTransition.ts). Rendered in place of the page's own tabs,
// never inside them, so the two tab sets can't get mixed up.
export const RunScreen = ({
  feature,
  isRunning,
  startedAtMs,
  actions,
  banner,
  overview,
  details,
  onDismissFinished,
}: RunScreenProps) => {
  const { t } = useTranslation()
  const view = useRunViewStore(state => state.views[feature])
  const setView = useRunViewStore(state => state.setView)
  const syncRun = useRunViewStore(state => state.syncRun)
  // A layout effect so a new run's first paint is already on Overview
  useLayoutEffect(() => syncRun(feature, startedAtMs), [feature, startedAtMs, syncRun])

  const done = onDismissFinished && (
    <div className='flex justify-center pt-2'>
      <Button variant='secondary' onPress={onDismissFinished}>
        {t('common.actions.done')}
      </Button>
    </div>
  )

  return (
    <TabsRoot
      className='tabs-transition-area flex min-h-0 flex-1 flex-col'
      selectedKey={view}
      onSelectionChange={key =>
        switchViewWithTransition('tabs', () => setView(feature, key as RunView))
      }
    >
      <PageToolbar start={<RunStatus isRunning={isRunning} startedAtMs={startedAtMs} />}>
        <TabListContainer className='shrink-0'>
          <TabList>
            <Tab className='whitespace-nowrap' id='overview'>
              {t('common.tabs.overview')}
              <TabIndicator />
            </Tab>
            <Tab className='whitespace-nowrap' id='details'>
              {t('common.tabs.details')}
              <TabIndicator />
            </Tab>
          </TabList>
        </TabListContainer>
        {actions}
      </PageToolbar>

      <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='overview'>
        <div className='page-banner-area-below-toolbar flex flex-col gap-4 @container'>
          {banner}
          {overview}
          {done}
        </div>
      </TabPanel>
      <TabPanel className='min-h-0 flex-1 overflow-y-auto p-0' id='details'>
        <div className='page-banner-area-below-toolbar flex flex-col gap-4 @container'>
          {banner}
          {details}
          {done}
        </div>
      </TabPanel>
    </TabsRoot>
  )
}
