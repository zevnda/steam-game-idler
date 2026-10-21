import type { AchievementDto } from '../types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbChecks, TbX } from 'react-icons/tb'
import { isUnlockBlocked } from '../utils/groupAchievements'
import { searchByName } from '../utils/searchByName'
import {
  ACHIEVEMENT_SORT_LABEL_KEYS,
  ACHIEVEMENT_SORT_STYLES,
  DEFAULT_ACHIEVEMENT_SORT,
  PROTECTION_SORT_STYLES,
  sortAchievements,
} from '../utils/sortAchievements'
import { AchievementList } from './AchievementList'
import { FloatingActionBar } from './FloatingActionBar'
import { ProtectedNotice } from './ProtectedNotice'
import { AlertDialog, Button, cn, EmptyState, InputGroup, Typography } from '@heroui/react'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'

type StatusFilter = 'all' | 'locked' | 'unlocked'

const STATUS_FILTERS = [
  { id: 'all', labelKey: 'dashboard.achievements.filters.all' },
  { id: 'locked', labelKey: 'dashboard.achievements.filters.locked' },
  { id: 'unlocked', labelKey: 'dashboard.achievements.filters.unlocked' },
] as const

interface AchievementsViewProps {
  title: string
  // The achievements this view shows - every achievement, or one Achievement Set's (the overlay
  // picks which from the sidebar's nav).
  achievements: AchievementDto[]
  appId: number
  dlcGroupIds: Set<number>
  unownedDlcGroupIds: Set<number>
  isMutating: boolean
  onToggle: (achievementId: string, achieved: boolean) => Promise<void>
  onApplySelection: (unlockIds: string[], lockIds: string[]) => Promise<unknown>
}

// Main pane of the split-view Achievement Manager when an achievements entry is picked in
// AchievementManagerSidebar.tsx. Narrowing (search, Locked/Unlocked filter, sort) all lives in one
// toolbar at the top; acting on achievements is either the per-row quick action or select-then-act
// via the selection bar at the bottom.
//
// Selecting an achievement stages *flipping* it: a locked one will unlock, an unlocked one will
// lock, and one "Save changes" in the bar applies everything staged together - the same
// stage-then-save flow the old checkbox model had (and StatisticsView.tsx uses), without its
// confusing part: a checkbox's *checked* state used to mean "should end up unlocked", so an unlocked
// achievement started out pre-checked and you had to uncheck it to lock it. Here selection always
// means the same thing - "change this one" - whichever state the achievement is in.
// Selection, search and filter are local to this view - the overlay remounts it on every nav change,
// so switching sets always starts clean.
export const AchievementsView = ({
  title,
  achievements,
  appId,
  dlcGroupIds,
  unownedDlcGroupIds,
  isMutating,
  onToggle,
  onApplySelection,
}: AchievementsViewProps) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage).
  const savedSortStyle = useSortPreferencesStore(state => state.achievements)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const hasProtected = achievements.some(achievement => achievement.protectedAchievement)
  // "Protected first"/"Unprotected first" only mean something when this view actually has a
  // protected achievement - otherwise both just reproduce the default order, so they're hidden.
  // The saved preference is shared across every game, so a game without protected achievements
  // falls back to the default *for display only*, leaving the saved choice intact for the next
  // game that does have some.
  const sortStyles = hasProtected
    ? ACHIEVEMENT_SORT_STYLES
    : ACHIEVEMENT_SORT_STYLES.filter(style => !PROTECTION_SORT_STYLES.has(style))
  const sortStyle = sortStyles.includes(savedSortStyle) ? savedSortStyle : DEFAULT_ACHIEVEMENT_SORT

  const visibleAchievements = useMemo(() => {
    const byStatus = achievements.filter(achievement =>
      statusFilter === 'all' ? true : (statusFilter === 'unlocked') === achievement.achieved,
    )
    return searchByName(sortAchievements(byStatus, sortStyle), query)
  }, [achievements, statusFilter, sortStyle, query])

  const isSelectable = (achievement: AchievementDto) =>
    !achievement.protectedAchievement && !isUnlockBlocked(achievement, unownedDlcGroupIds)
  const selected = achievements.filter(achievement => selectedIds.has(achievement.id))
  const unlockIds = selected.filter(achievement => !achievement.achieved).map(a => a.id)
  const lockIds = selected.filter(achievement => achievement.achieved).map(a => a.id)
  // "Select all" adds everything currently showing (search + filter) to the selection, and hides
  // once there's nothing visible left to add; "Clear" (always shown) empties the whole selection.
  const selectableVisibleIds = visibleAchievements.filter(isSelectable).map(a => a.id)
  const areAllVisibleSelected =
    selectableVisibleIds.length > 0 && selectableVisibleIds.every(id => selectedIds.has(id))

  const toggleSelected = (achievement: AchievementDto) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(achievement.id)) next.delete(achievement.id)
      else next.add(achievement.id)
      return next
    })
  }

  const quickToggle = async (achievement: AchievementDto) => {
    setPendingId(achievement.id)
    try {
      await onToggle(achievement.id, achievement.achieved)
      setSelectedIds(prev => {
        if (!prev.has(achievement.id)) return prev
        const next = new Set(prev)
        next.delete(achievement.id)
        return next
      })
    } finally {
      setPendingId(null)
    }
  }

  // Confirmed first, like the sidebar's Unlock all/Lock all - the dialog spells out exactly how many
  // achievements each way the save will change, since the bar itself only shows a total.
  const [isConfirmingSave, setIsConfirmingSave] = useState(false)
  // Reuses the old staged-changes confirmation strings (already translated), so the counts are
  // passed as `unlockCount`/`lockCount`, matching those strings' placeholders.
  const saveDescription =
    unlockIds.length > 0 && lockIds.length > 0
      ? t('dashboard.achievements.confirmApplyChanges.descriptionBoth', {
          unlockCount: unlockIds.length,
          lockCount: lockIds.length,
        })
      : unlockIds.length > 0
        ? t('dashboard.achievements.confirmApplyChanges.descriptionUnlockOnly', {
            unlockCount: unlockIds.length,
          })
        : t('dashboard.achievements.confirmApplyChanges.descriptionLockOnly', {
            lockCount: lockIds.length,
          })

  const saveSelection = async () => {
    await onApplySelection(unlockIds, lockIds)
    setSelectedIds(new Set())
    setIsConfirmingSave(false)
  }

  return (
    // `relative` - FloatingActionBar positions itself over the bottom of this pane.
    <div className='relative flex h-full min-h-0 flex-col'>
      {/* Title on its own line, controls on the line below - a long set name (ETS2's "Multi-
          Expansion Achievements Group") used to shove the controls onto a ragged second row. */}
      <div className='flex shrink-0 flex-col gap-3 px-6 pt-5 pb-4' data-tauri-drag-region>
        <div className='flex min-w-0 items-center gap-3' data-tauri-drag-region>
          {/* No count beside the title - the sidebar's nav entry for this view already shows it. */}
          <div className='flex min-w-0 flex-1' data-tauri-drag-region>
            <Typography truncate title={title} type='h3'>
              {title}
            </Typography>
          </div>
          {hasProtected && <ProtectedNotice />}
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <InputGroup className='min-w-48 flex-1 rounded-full'>
            <InputGroup.Prefix>
              <RiSearchLine className='text-muted' fontSize={16} />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder={t('common.search.placeholder')}
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            {query && (
              <InputGroup.Suffix>
                <button
                  aria-label={t('common.actions.clear')}
                  type='button'
                  onClick={() => setQuery('')}
                >
                  <TbX fontSize={16} />
                </button>
              </InputGroup.Suffix>
            )}
          </InputGroup>
          {/* Segmented control styled after the app's tab lists - a one-click status filter, which
            the old sort dropdown's "Locked first"/"Unlocked first" only approximated. */}
          <div className='flex shrink-0 rounded-full bg-surface p-1'>
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.id}
                aria-pressed={statusFilter === filter.id}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1 text-sm duration-150',
                  statusFilter === filter.id
                    ? 'bg-surface-tertiary font-semibold text-foreground'
                    : 'text-muted hover:text-foreground',
                )}
                type='button'
                onClick={() => setStatusFilter(filter.id)}
              >
                {t(filter.labelKey)}
              </button>
            ))}
          </div>
          <GameSortSelect
            ariaLabel={t('dashboard.achievements.tabs.achievements')}
            // `ml-auto` keeps the dropdown right-aligned when a narrow window wraps it onto its own
            // row. `w-62` restates GameSortSelect's default, which any `className` replaces.
            className='ml-auto w-52'
            options={sortStyles.map(style => ({
              id: style,
              label: t(ACHIEVEMENT_SORT_LABEL_KEYS[style]),
            }))}
            value={sortStyle}
            onChange={style => setSortStyle('achievements', style)}
          />
        </div>
      </div>

      <div className='min-h-0 flex-1'>
        {achievements.length === 0 ? (
          <EmptyState className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center'>
            <Typography type='h3'>{t('dashboard.achievements.empty.title')}</Typography>
            <Typography color='muted' type='body-sm'>
              {t('dashboard.achievements.empty.description')}
            </Typography>
          </EmptyState>
        ) : visibleAchievements.length === 0 ? (
          <EmptyState className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center'>
            <RiSearchLine fontSize={32} />
            <Typography type='h3'>{t('dashboard.achievements.searchNoResults.title')}</Typography>
            <Typography color='muted' type='body-sm'>
              {t('dashboard.achievements.searchNoResults.description')}
            </Typography>
          </EmptyState>
        ) : (
          <AchievementList
            achievements={visibleAchievements}
            hasActionBar={selectedIds.size > 0}
            appId={appId}
            dlcGroupIds={dlcGroupIds}
            pendingId={pendingId}
            selectedIds={selectedIds}
            unownedDlcGroupIds={unownedDlcGroupIds}
            onQuickToggle={quickToggle}
            onSelectedChange={toggleSelected}
          />
        )}
      </div>

      {selectedIds.size > 0 && (
        <FloatingActionBar
          icon={<TbChecks fontSize={17} />}
          label={t('dashboard.achievements.pendingChanges', { count: selectedIds.size })}
        >
          <Button
            isDisabled={isMutating}
            size='sm'
            variant='ghost'
            onPress={() => setSelectedIds(new Set())}
          >
            {t('common.actions.clear')}
          </Button>
          {!areAllVisibleSelected && (
            <Button
              isDisabled={isMutating}
              size='sm'
              variant='secondary'
              onPress={() => setSelectedIds(prev => new Set([...prev, ...selectableVisibleIds]))}
            >
              {t('dashboard.achievements.selection.selectAll')}
            </Button>
          )}
          <Button
            isPending={isMutating}
            size='sm'
            variant='primary'
            onPress={() => setIsConfirmingSave(true)}
          >
            {t('dashboard.achievements.actions.saveChanges')}
          </Button>
        </FloatingActionBar>
      )}

      <AlertDialog
        isOpen={isConfirmingSave}
        onOpenChange={open => !open && setIsConfirmingSave(false)}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.achievements.confirmApplyChanges.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>{saveDescription}</AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={isMutating}
                  variant='secondary'
                  onPress={() => setIsConfirmingSave(false)}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button isPending={isMutating} variant='primary' onPress={saveSelection}>
                  {t('dashboard.achievements.actions.saveChanges')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
