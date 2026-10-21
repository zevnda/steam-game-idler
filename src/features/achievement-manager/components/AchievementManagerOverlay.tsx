import type { AchievementManagerView } from '../types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAchievementManager } from '../hooks/useAchievementManager'
import { errorMessageKey } from '../utils/errorMessageKey'
import {
  dlcGroupIdsOf,
  groupAchievementsBySet,
  isArchivedLocked,
  isInGroups,
  unownedDlcGroupIdsOf,
} from '../utils/groupAchievements'
import { AchievementManagerSidebar } from './AchievementManagerSidebar'
import { AchievementsView } from './AchievementsView'
import { StatisticsView } from './StatisticsView'
import { Alert, AlertDialog, Button, cn, Modal, Skeleton } from '@heroui/react'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'
import { usePlatformStore } from '@/shared/stores/platformStore'

const ALL_ACHIEVEMENTS: AchievementManagerView = { kind: 'achievements', setKey: null }

// Single-game achievements/statistics overlay - mounted once in DashboardShell, driven entirely by
// achievementManagerStore so opening it never depends on which /dashboard/* route is active.
//
// Split view: AchievementManagerSidebar.tsx on the left holds everything about the game as a whole
// (art, overall progress, Unlock all/Lock all, external links) plus the nav; the right pane shows
// whichever view is picked there - AchievementsView.tsx (all achievements, or one Achievement Set)
// or StatisticsView.tsx. The right pane is keyed by the view, so switching views always starts that
// pane fresh (search, filter, selection, staged stat edits).
export const AchievementManagerOverlay = () => {
  const { t } = useTranslation()
  const openGame = useAchievementManagerStore(state => state.openGame)
  const close = useAchievementManagerStore(state => state.close)
  const currentOs = usePlatformStore(state => state.currentOs)
  const [view, setView] = useState<AchievementManagerView>(ALL_ACHIEVEMENTS)
  const [confirmBulk, setConfirmBulk] = useState<'unlock' | 'lock' | null>(null)
  const {
    data,
    isLoading,
    isMutating,
    loadErrorCode,
    refresh,
    toggleAchievement,
    bulkSetAchievements,
    applyStagedChanges,
    saveStats,
    resetAllStats,
  } = useAchievementManager(openGame)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
      setView(ALL_ACHIEVEMENTS)
    }
  }

  const derived = useMemo(() => {
    if (!data) return null
    const unownedDlcGroupIds = unownedDlcGroupIdsOf(data.groups)
    // Unowned DLC achievements, and archived ones not yet earned, don't count toward overall
    // progress or "Unlock all" - Steam's own rule, and Unlock all skips them backend-side (see
    // AchievementData::unowned_dlc_group_ids / AchievementDto::is_unlock_blocked).
    const counted = data.achievements.filter(
      a => !isInGroups(a, unownedDlcGroupIds) && !isArchivedLocked(a),
    )
    return {
      sections: groupAchievementsBySet(data.achievements, data.achievements, data.groups),
      dlcGroupIds: dlcGroupIdsOf(data.groups),
      unownedDlcGroupIds,
      unlockedCount: counted.filter(a => a.achieved).length,
      totalCount: counted.length,
      canUnlockAll: counted.some(a => !a.achieved && !a.protectedAchievement),
      canLockAll: data.achievements.some(a => a.achieved && !a.protectedAchievement),
    }
  }, [data])

  // The picked set's achievements and title, falling back to "all" if the picked set no longer
  // exists (e.g. after a refresh).
  const activeSection =
    view.kind === 'achievements' && view.setKey !== null
      ? derived?.sections.find(section => section.key === view.setKey)
      : undefined
  const viewAchievements = activeSection ? activeSection.visible : (data?.achievements ?? [])
  const viewTitle = activeSection
    ? (activeSection.group?.name ?? t('dashboard.achievements.sets.baseGame'))
    : t('dashboard.achievements.views.all')
  const viewKey = view.kind === 'statistics' ? 'statistics' : `set-${view.setKey ?? 'all'}`

  const handleConfirmBulk = async () => {
    if (confirmBulk) await bulkSetAchievements(confirmBulk === 'unlock')
    setConfirmBulk(null)
  }

  return (
    <Modal isOpen={openGame !== null} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size='cover'>
          <Modal.Dialog className='flex-row overflow-hidden p-0'>
            {openGame && (
              <AchievementManagerSidebar
                appId={openGame.appId}
                canLockAll={derived?.canLockAll ?? false}
                canUnlockAll={derived?.canUnlockAll ?? false}
                isMutating={isMutating}
                isRefreshing={isLoading}
                name={openGame.name}
                sections={derived?.sections ?? null}
                statCount={data?.stats.length ?? 0}
                totalCount={derived?.totalCount ?? 0}
                unlockedCount={derived?.unlockedCount ?? 0}
                view={view}
                onClose={() => handleOpenChange(false)}
                onLockAll={() => setConfirmBulk('lock')}
                onRefresh={refresh}
                onUnlockAll={() => setConfirmBulk('unlock')}
                onViewChange={setView}
              />
            )}

            <main className='flex min-h-0 min-w-0 flex-1 flex-col bg-overlay'>
              {/* Shown for *every* load, refreshes included (not just the first, when there's no
                  data yet) - so pressing refresh visibly does something until the new data lands.
                  The pane remounts afterwards, so search/filter/selection start fresh, same as a
                  nav change; the sidebar keeps showing the previous data meanwhile. */}
              {isLoading ? (
                // Mirrors the active view's real layout (title line, toolbar line, then 64px
                // AchievementList / 56px StatisticsList rows with an 8px gap) so content lands where
                // the placeholders were instead of jumping. Keep in sync if those layouts change.
                <div className='flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-5'>
                  <Skeleton className='h-8 w-56 rounded-lg' />
                  <div className='mt-3 mb-4 flex gap-3'>
                    <Skeleton className='h-10 flex-1 rounded-full' />
                    {view.kind === 'statistics' ? (
                      <Skeleton className='h-10 w-32 rounded-full' />
                    ) : (
                      <>
                        <Skeleton className='h-10 w-60 rounded-full' />
                        <Skeleton className='h-10 w-62 rounded-full' />
                      </>
                    )}
                  </div>
                  <div className='flex flex-col gap-2'>
                    {Array.from({ length: 12 }, (_, index) => (
                      <Skeleton
                        key={index}
                        className={cn(
                          'w-full shrink-0 rounded-xl',
                          view.kind === 'statistics' ? 'h-14' : 'h-16',
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : loadErrorCode ? (
                <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
                  <Alert className='max-w-md' status='danger'>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{t('dashboard.achievements.errors.title')}</Alert.Title>
                      <Alert.Description>
                        {t(errorMessageKey(loadErrorCode, currentOs), { code: loadErrorCode })}
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                  <Button variant='secondary' onPress={refresh}>
                    {t('common.actions.tryAgain')}
                  </Button>
                </div>
              ) : data && derived && openGame ? (
                view.kind === 'statistics' ? (
                  <StatisticsView
                    key={viewKey}
                    isMutating={isMutating}
                    stats={data.stats}
                    onResetAll={resetAllStats}
                    onSave={saveStats}
                  />
                ) : (
                  <AchievementsView
                    key={viewKey}
                    achievements={viewAchievements}
                    appId={openGame.appId}
                    dlcGroupIds={derived.dlcGroupIds}
                    isMutating={isMutating}
                    title={viewTitle}
                    unownedDlcGroupIds={derived.unownedDlcGroupIds}
                    onApplySelection={applyStagedChanges}
                    onToggle={toggleAchievement}
                  />
                )
              ) : null}
            </main>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <AlertDialog
        isOpen={confirmBulk !== null}
        onOpenChange={open => !open && setConfirmBulk(null)}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {confirmBulk === 'lock'
                    ? t('dashboard.achievements.confirmLockAll.title')
                    : t('dashboard.achievements.confirmUnlockAll.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {confirmBulk === 'lock'
                  ? t('dashboard.achievements.confirmLockAll.description')
                  : t('dashboard.achievements.confirmUnlockAll.description')}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={isMutating}
                  variant='secondary'
                  onPress={() => setConfirmBulk(null)}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  isPending={isMutating}
                  variant={confirmBulk === 'lock' ? 'danger' : 'primary'}
                  onPress={handleConfirmBulk}
                >
                  {confirmBulk === 'lock'
                    ? t('dashboard.achievements.actions.lockAll')
                    : t('dashboard.achievements.actions.unlockAll')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Modal>
  )
}
