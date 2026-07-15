import type { AchievementDto } from '../types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbLock, TbLockOpen, TbRefresh, TbTrophy } from 'react-icons/tb'
import { searchByName } from '../utils/searchByName'
import {
  ACHIEVEMENT_SORT_LABEL_KEYS,
  ACHIEVEMENT_SORT_STYLES,
  sortAchievements,
} from '../utils/sortAchievements'
import { AchievementsList } from './AchievementsList'
import { AlertDialog, Button, cn, EmptyState, ProgressBar, Typography } from '@heroui/react'
import { GameSortSelect } from '@/shared/components/GameSortSelect'
import { useSortPreferencesStore } from '@/shared/stores/sortPreferencesStore'

interface AchievementsTabProps {
  achievements: AchievementDto[]
  appId: number
  query: string
  isMutating: boolean
  isRefreshing: boolean
  onToggle: (achievementId: string, achieved: boolean) => Promise<void>
  onBulkSet: (unlock: boolean) => Promise<unknown>
  onApplyStagedChanges: (unlockIds: string[], lockIds: string[]) => Promise<unknown>
  onRefresh: () => void
}

type BulkConfirmAction = 'unlock' | 'lock' | 'apply'

// Defaults to `percent` (global unlock rate, descending) - see sortAchievements.ts for why that's
// only meaningful for CLI/local-mode accounts. Search only narrows which rows render, applied after
// sorting - `unlockedCount`/`hasUnprotectedLocked`/`hasUnprotectedUnlocked`/Unlock all/Lock all
// all stay computed against the full `achievements` prop, never the filtered/sorted subset, since
// those bulk backend commands always apply to literally every achievement for the game.
//
// The checkbox-staging model mirrors main's AchievementsList/AchievementButtons: an achieved
// achievement starts checked and unchecking it stages a lock; a locked achievement starts
// unchecked and checking it stages an unlock. "Apply changes" hands the staged id lists to
// `onApplyStagedChanges`, which replays `set_achievement` per id and fires one summary toast -
// there's no dedicated bulk-apply command since the staged set is an arbitrary per-user mix.
export const AchievementsTab = ({
  achievements,
  appId,
  query,
  isMutating,
  isRefreshing,
  onToggle,
  onBulkSet,
  onApplyStagedChanges,
  onRefresh,
}: AchievementsTabProps) => {
  const { t } = useTranslation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<BulkConfirmAction | null>(null)
  const [selectedToUnlock, setSelectedToUnlock] = useState<Set<string>>(new Set())
  const [selectedToLock, setSelectedToLock] = useState<Set<string>>(new Set())
  // Persisted across navigation/reload/restart via `sortPreferencesStore` (localStorage) - see
  // GamesPage.tsx's identical wiring.
  const sortStyle = useSortPreferencesStore(state => state.achievements)
  const setSortStyle = useSortPreferencesStore(state => state.setSortPreference)
  const sortedAchievements = useMemo(
    () => sortAchievements(achievements, sortStyle),
    [achievements, sortStyle],
  )
  const filteredAchievements = useMemo(
    () => searchByName(sortedAchievements, query),
    [sortedAchievements, query],
  )

  const unlockedCount = achievements.filter(achievement => achievement.achieved).length
  const isFullyUnlocked = unlockedCount === achievements.length
  const hasUnprotectedLocked = achievements.some(
    achievement => !achievement.achieved && !achievement.protectedAchievement,
  )
  const hasUnprotectedUnlocked = achievements.some(
    achievement => achievement.achieved && !achievement.protectedAchievement,
  )
  const stagedCount = selectedToUnlock.size + selectedToLock.size

  const clearStaged = (id: string) => {
    setSelectedToUnlock(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setSelectedToLock(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleToggle = async (achievementId: string, achieved: boolean) => {
    setPendingId(achievementId)
    try {
      await onToggle(achievementId, achieved)
      clearStaged(achievementId)
    } finally {
      setPendingId(null)
    }
  }

  const handleSelectChange = (achievement: AchievementDto, checked: boolean) => {
    if (achievement.achieved) {
      setSelectedToLock(prev => {
        const next = new Set(prev)
        if (checked) next.delete(achievement.id)
        else next.add(achievement.id)
        return next
      })
    } else {
      setSelectedToUnlock(prev => {
        const next = new Set(prev)
        if (checked) next.add(achievement.id)
        else next.delete(achievement.id)
        return next
      })
    }
  }

  const handleConfirmBulk = async () => {
    if (confirmAction === 'apply') {
      await onApplyStagedChanges([...selectedToUnlock], [...selectedToLock])
      setSelectedToUnlock(new Set())
      setSelectedToLock(new Set())
    } else if (confirmAction) {
      await onBulkSet(confirmAction === 'unlock')
      setSelectedToUnlock(new Set())
      setSelectedToLock(new Set())
    }
    setConfirmAction(null)
  }

  if (achievements.length === 0) {
    return (
      <EmptyState className='flex flex-col items-center justify-center gap-2 p-8 text-center'>
        <Typography type='h3'>{t('dashboard.achievements.empty.title')}</Typography>
        <Typography color='muted' type='body-sm'>
          {t('dashboard.achievements.empty.description')}
        </Typography>
      </EmptyState>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex shrink-0 items-center justify-between gap-4'>
        {/* Trophy-cabinet-style completion readout in place of a plain count - a visual fill bar
            reads at a glance far better than text alone for a "how close am I" stat, and matches
            the gamified rarity pills AchievementRow.tsx now shows per achievement. Turns amber
            once every unprotected achievement is unlocked, mirroring a "100%" trophy-case flourish. */}
        <div className='flex min-w-0 items-center gap-2.5 bg-surface px-3 py-2 rounded-lg'>
          <TbTrophy
            className={cn('shrink-0', isFullyUnlocked ? 'text-amber-400' : 'text-muted')}
            fontSize={18}
          />
          <div className='flex min-w-0 flex-col gap-1'>
            <Typography className='whitespace-nowrap' color='muted' type='body-xs'>
              {t('dashboard.achievements.unlockedCount', {
                unlocked: unlockedCount,
                total: achievements.length,
              })}
            </Typography>
            <ProgressBar
              aria-label={t('dashboard.achievements.unlockedCount', {
                unlocked: unlockedCount,
                total: achievements.length,
              })}
              className='w-36'
              maxValue={achievements.length || 1}
              minValue={0}
              value={unlockedCount}
            >
              <ProgressBar.Track className='h-1.5'>
                <ProgressBar.Fill className={cn(isFullyUnlocked && 'bg-amber-400')} />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <GameSortSelect
            ariaLabel='Sort achievements'
            className='w-44'
            options={ACHIEVEMENT_SORT_STYLES.map(style => ({
              id: style,
              label: t(ACHIEVEMENT_SORT_LABEL_KEYS[style]),
            }))}
            value={sortStyle}
            onChange={style => setSortStyle('achievements', style)}
          />
          {stagedCount > 0 && (
            <Button
              isPending={isMutating}
              size='sm'
              variant='primary'
              onPress={() => setConfirmAction('apply')}
            >
              {t('dashboard.achievements.actions.applyChangesCount', { count: stagedCount })}
            </Button>
          )}
          <Button
            isDisabled={!hasUnprotectedLocked}
            isPending={isMutating}
            onPress={() => setConfirmAction('unlock')}
          >
            <TbLockOpen fontSize={16} />
            {t('dashboard.achievements.actions.unlockAll')}
          </Button>
          <Button
            isDisabled={!hasUnprotectedUnlocked}
            isPending={isMutating}
            variant='danger'
            onPress={() => setConfirmAction('lock')}
          >
            <TbLock fontSize={16} />
            {t('dashboard.achievements.actions.lockAll')}
          </Button>
          <Button
            isIconOnly
            aria-label={t('common.actions.refresh')}
            isPending={isRefreshing}
            onPress={onRefresh}
          >
            <TbRefresh fontSize={16} />
          </Button>
        </div>
      </div>

      {filteredAchievements.length === 0 ? (
        <EmptyState className='flex flex-col items-center justify-center gap-2 p-8 text-center'>
          <RiSearchLine fontSize={32} />
          <Typography type='h3'>{t('dashboard.achievements.searchNoResults.title')}</Typography>
          <Typography color='muted' type='body-sm'>
            {t('dashboard.achievements.searchNoResults.description')}
          </Typography>
        </EmptyState>
      ) : (
        <div className='flex min-h-0 flex-1 flex-col'>
          {/* Genuinely fixed above the virtualized list below (not "sticky while scrolling" -
              AchievementsList.tsx owns its own internal scroll, so this bar never needs to stick
              to anything). Keep this grid template in sync with AchievementRow.tsx's ROW_GRID. */}
          <div className='bg-surface grid shrink-0 grid-cols-[28px_52px_1fr_auto] items-center gap-3 border-b border-border px-3 py-2 rounded-lg'>
            <span aria-hidden />
            <span aria-hidden />
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('dashboard.achievements.tabs.achievements')}
            </Typography>
            <span aria-hidden />
          </div>
          <div className='min-h-0 flex-1'>
            <AchievementsList
              achievements={filteredAchievements}
              appId={appId}
              pendingId={pendingId}
              selectedToLock={selectedToLock}
              selectedToUnlock={selectedToUnlock}
              onSelectChange={handleSelectChange}
              onToggle={handleToggle}
            />
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={confirmAction !== null}
        onOpenChange={open => !open && setConfirmAction(null)}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {confirmAction === 'unlock'
                    ? t('dashboard.achievements.confirmUnlockAll.title')
                    : confirmAction === 'lock'
                      ? t('dashboard.achievements.confirmLockAll.title')
                      : t('dashboard.achievements.confirmApplyChanges.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {confirmAction === 'unlock'
                  ? t('dashboard.achievements.confirmUnlockAll.description')
                  : confirmAction === 'lock'
                    ? t('dashboard.achievements.confirmLockAll.description')
                    : selectedToUnlock.size > 0 && selectedToLock.size > 0
                      ? t('dashboard.achievements.confirmApplyChanges.descriptionBoth', {
                          unlockCount: selectedToUnlock.size,
                          lockCount: selectedToLock.size,
                        })
                      : selectedToUnlock.size > 0
                        ? t('dashboard.achievements.confirmApplyChanges.descriptionUnlockOnly', {
                            unlockCount: selectedToUnlock.size,
                          })
                        : t('dashboard.achievements.confirmApplyChanges.descriptionLockOnly', {
                            lockCount: selectedToLock.size,
                          })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={isMutating}
                  variant='secondary'
                  onPress={() => setConfirmAction(null)}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  isPending={isMutating}
                  variant={confirmAction === 'lock' ? 'danger' : 'primary'}
                  onPress={handleConfirmBulk}
                >
                  {confirmAction === 'unlock'
                    ? t('dashboard.achievements.actions.unlockAll')
                    : confirmAction === 'lock'
                      ? t('dashboard.achievements.actions.lockAll')
                      : t('dashboard.achievements.actions.applyChanges')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
