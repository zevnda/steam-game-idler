import type { ReactNode } from 'react'
import type { AchievementManagerView } from '../types'
import type { AchievementSection } from '../utils/groupAchievements'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SiSteam, SiSteamdb } from 'react-icons/si'
import {
  TbArchive,
  TbChartBar,
  TbLock,
  TbLockOpen,
  TbRefresh,
  TbShoppingCartX,
  TbX,
} from 'react-icons/tb'
import { DlcBadge } from './DlcBadge'
import { ProgressRing } from './ProgressRing'
import { Button, cn, Typography } from '@heroui/react'
import Image from 'next/image'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { openExternalLink } from '@/shared/utils/links'

interface AchievementManagerSidebarProps {
  appId: number
  name: string
  // Null while loading/errored - the nav and progress only render once real data exists.
  sections: AchievementSection[] | null
  unlockedCount: number
  totalCount: number
  statCount: number
  view: AchievementManagerView
  canUnlockAll: boolean
  canLockAll: boolean
  isMutating: boolean
  isRefreshing: boolean
  onRefresh: () => void
  onViewChange: (view: AchievementManagerView) => void
  onUnlockAll: () => void
  onLockAll: () => void
  onClose: () => void
}

interface NavItemProps {
  isActive: boolean
  isMuted?: boolean
  icon?: ReactNode
  label: string
  badge?: ReactNode
  meta: string
  // 0-1, or undefined for no progress line (the Statistics entry).
  progress?: number
  onPress: () => void
}

// One sidebar entry - styled after the app's own dashboard Sidebar.tsx items (rounded, a lighter
// surface when active) so the overlay reads as part of the same app rather than a separate tool.
const NavItem = ({
  isActive,
  isMuted,
  icon,
  label,
  badge,
  meta,
  progress,
  onPress,
}: NavItemProps) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'flex w-full cursor-pointer flex-col gap-1.5 rounded-xl px-3 py-2 text-left duration-150',
      isActive ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/60',
    )}
    type='button'
    onClick={onPress}
  >
    <span className='flex w-full min-w-0 items-center gap-2'>
      {icon}
      <Typography
        truncate
        className='min-w-0 flex-1'
        color={isMuted ? 'muted' : undefined}
        title={label}
        type='body-sm'
        weight={isActive ? 'semibold' : 'medium'}
      >
        {label}
      </Typography>
      {badge}
      <span className='shrink-0 text-xs text-muted tabular-nums'>{meta}</span>
    </span>
    {progress !== undefined && (
      <span className='h-1 w-full overflow-hidden rounded-full bg-surface-tertiary'>
        <span
          className={cn(
            'block h-full rounded-full duration-300',
            progress >= 1 ? 'bg-amber-400' : isMuted ? 'bg-muted' : 'bg-accent',
          )}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </span>
    )}
  </button>
)

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Typography
    className='px-3 pt-4 pb-1 uppercase tracking-wide'
    color='muted'
    type='body-xs'
    weight='semibold'
  >
    {children}
  </Typography>
)

// Left column of the split-view Achievement Manager. Everything that applies to the *whole game*
// lives here - its art, overall progress, the game-wide Unlock all/Lock all actions, external
// links - and the nav picks what the main pane shows: all achievements, one Achievement Set (when
// the game has sets - base game first, unowned DLC last, see groupAchievements.ts), or Statistics.
// Sets used to be collapsible sections inside one long list; as nav entries each set gets its own
// progress at a glance and the main pane only ever shows one coherent group at a time.
export const AchievementManagerSidebar = ({
  appId,
  name,
  sections,
  unlockedCount,
  totalCount,
  statCount,
  view,
  canUnlockAll,
  canLockAll,
  isMutating,
  isRefreshing,
  onRefresh,
  onViewChange,
  onUnlockAll,
  onLockAll,
  onClose,
}: AchievementManagerSidebarProps) => {
  const { t } = useTranslation()
  const [artFailed, setArtFailed] = useState(false)
  const progressLabel = t('dashboard.achievements.unlockedCount', {
    unlocked: unlockedCount,
    total: totalCount,
  })
  const hasSets = sections !== null && sections.length > 0

  return (
    <aside className='flex w-72 shrink-0 flex-col border-r border-border bg-background'>
      {/* `data-tauri-drag-region` - the modal covers the app's titlebar, so this strip keeps the
          window draggable while the overlay is open (see Titlebar.tsx for the same pattern). */}
      <div className='flex shrink-0 items-center gap-1 px-3 pt-3' data-tauri-drag-region>
        <Button isIconOnly aria-label={t('common.actions.close')} variant='ghost' onPress={onClose}>
          <TbX fontSize={18} />
        </Button>
        <div className='flex-1' data-tauri-drag-region />
        {/* Refresh reloads the whole game's data (achievements and statistics alike), so it lives
            with the other game-level controls here rather than in each pane's toolbar. */}
        <AppTooltip.Root>
          <AppTooltip.Trigger>
            <Button
              isIconOnly
              aria-label={t('common.actions.refresh')}
              isPending={isRefreshing}
              size='sm'
              variant='ghost'
              onPress={onRefresh}
            >
              <TbRefresh fontSize={15} />
            </Button>
          </AppTooltip.Trigger>
          <AppTooltip.Content>{t('common.actions.refresh')}</AppTooltip.Content>
        </AppTooltip.Root>
        <AppTooltip.Root>
          <AppTooltip.Trigger>
            <Button
              isIconOnly
              aria-label={t('dashboard.achievements.header.viewOnSteam')}
              size='sm'
              variant='ghost'
              onPress={() =>
                openExternalLink(`https://steamcommunity.com/stats/${appId}/achievements/`)
              }
            >
              <SiSteam fontSize={15} />
            </Button>
          </AppTooltip.Trigger>
          <AppTooltip.Content>{t('dashboard.achievements.header.viewOnSteam')}</AppTooltip.Content>
        </AppTooltip.Root>
        <AppTooltip.Root>
          <AppTooltip.Trigger>
            <Button
              isIconOnly
              aria-label={t('dashboard.achievements.header.viewOnSteamDb')}
              size='sm'
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
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4'>
        <div className='flex flex-col gap-3 px-1 pt-2'>
          {!artFailed && (
            <Image
              unoptimized
              alt=''
              className='aspect-460/215 w-full rounded-xl object-cover'
              height={215}
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`}
              width={460}
              onError={() => setArtFailed(true)}
            />
          )}
          <Typography className='line-clamp-2' title={name} type='h4'>
            {name}
          </Typography>

          {sections !== null && (
            <>
              <div className='flex items-center gap-3'>
                <ProgressRing label={progressLabel} max={totalCount} value={unlockedCount} />
                <Typography color='muted' type='body-sm'>
                  {progressLabel}
                </Typography>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  fullWidth
                  isDisabled={!canUnlockAll}
                  isPending={isMutating}
                  size='sm'
                  variant='primary'
                  onPress={onUnlockAll}
                >
                  <TbLockOpen fontSize={15} />
                  {t('dashboard.achievements.actions.unlockAll')}
                </Button>
                <Button
                  fullWidth
                  isDisabled={!canLockAll}
                  isPending={isMutating}
                  size='sm'
                  variant='danger-soft'
                  onPress={onLockAll}
                >
                  <TbLock fontSize={15} />
                  {t('dashboard.achievements.actions.lockAll')}
                </Button>
              </div>
            </>
          )}
        </div>

        {sections !== null && (
          <nav className='flex flex-col gap-0.5'>
            <SectionLabel>{t('dashboard.achievements.tabs.achievements')}</SectionLabel>
            <NavItem
              isActive={view.kind === 'achievements' && view.setKey === null}
              label={t('dashboard.achievements.views.all')}
              meta={`${unlockedCount}/${totalCount}`}
              progress={totalCount > 0 ? unlockedCount / totalCount : 0}
              onPress={() => onViewChange({ kind: 'achievements', setKey: null })}
            />
            {hasSets &&
              sections.map(section => (
                <NavItem
                  key={section.key}
                  badge={
                    section.group?.dlcAppId !== undefined && !section.isUnownedDlc ? (
                      <DlcBadge />
                    ) : undefined
                  }
                  icon={
                    section.isUnownedDlc ? (
                      <TbShoppingCartX
                        aria-label={t('dashboard.achievements.sets.notOwned')}
                        className='shrink-0 text-muted'
                        fontSize={14}
                      />
                    ) : section.isArchived ? (
                      <TbArchive
                        aria-label={t('dashboard.achievements.archived.badge')}
                        className='shrink-0 text-muted'
                        fontSize={14}
                      />
                    ) : undefined
                  }
                  isActive={view.kind === 'achievements' && view.setKey === section.key}
                  isMuted={section.isUnownedDlc || section.isArchived}
                  label={section.group?.name ?? t('dashboard.achievements.sets.baseGame')}
                  meta={`${section.unlocked}/${section.total}`}
                  // No progress line for unowned DLC or an archived set - always empty or frozen,
                  // and eleven grey bars in a row (ETS2) were pure noise; the icon and muted
                  // label already say it all.
                  progress={
                    section.isUnownedDlc || section.isArchived
                      ? undefined
                      : section.total > 0
                        ? section.unlocked / section.total
                        : 0
                  }
                  onPress={() => onViewChange({ kind: 'achievements', setKey: section.key })}
                />
              ))}

            <div className='mx-3 my-2 border-t border-border' />
            <NavItem
              icon={<TbChartBar className='shrink-0 text-muted' fontSize={15} />}
              isActive={view.kind === 'statistics'}
              label={t('dashboard.achievements.tabs.statistics')}
              meta={String(statCount)}
              onPress={() => onViewChange({ kind: 'statistics' })}
            />
          </nav>
        )}
      </div>
    </aside>
  )
}
