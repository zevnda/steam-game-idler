import type { CurrentOs } from '@/shared/stores/platformStore'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAchievementOrder } from '../hooks/useAchievementOrder'
import { errorMessageKey } from '../utils/errorMessageKey'
import { buildOrderTimeline, formatWait } from '../utils/orderTimeline'
import { AchievementOrderHeader } from './AchievementOrderHeader'
import { AchievementOrderList, AchievementOrderSkeleton, StepNode } from './AchievementOrderList'
import { AchievementOrderRow } from './AchievementOrderRow'
import { ImportTimingsModal } from './ImportTimingsModal'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { Alert, Button, EmptyState, Modal, Skeleton, Typography } from '@heroui/react'
import { errorMessageKey as achievementDataErrorMessageKey } from '@/features/achievement-manager/utils/errorMessageKey'
import { isInGroups } from '@/features/achievement-manager/utils/groupAchievements'
import { useAchievementOrderStore } from '@/shared/stores/achievementOrderStore'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// get_achievement_data/get_achievement_order errors overlap - a load failure here could come from
// either command, so this tries achievement-manager's mapping first (the achievement-data domain
// codes it already knows about) and falls back to this feature's own (achievement_order_io_failed
// and friends) rather than duplicating achievement-manager's known-code list a second time.
// `currentOs` only affects achievement-manager's `unsupported_game_coordinator` case - passed
// through unconditionally since it's a no-op for every other code.
const loadErrorMessageKey = (code: string, currentOs: CurrentOs | null) => {
  const achievementsKey = achievementDataErrorMessageKey(code, currentOs)
  return achievementsKey !== 'dashboard.achievements.errors.generic'
    ? achievementsKey
    : errorMessageKey(code)
}

// One end of the footer's finish estimate - `children` is filled in by `<Trans>` from the
// translation's `<time>` tag.
const FinishTimeChip = ({ children }: { children?: ReactNode }) => (
  <span className='rounded-full bg-default px-2 py-0.5 font-medium text-foreground whitespace-nowrap'>
    {children}
  </span>
)

// Per-game achievement-order overlay - not a route (static export can't do a dynamic [appId]
// segment). Mirrors AchievementManagerOverlay.tsx's header/body
// split (a static header - close/title/reset/import - above a scrolling body, driven entirely by
// its own store) but with drag-reorder/skip/delay editing instead of unlock/lock actions, and no
// game art (a per-achievement editor has no use for hero/capsule art the way the achievements/
// statistics browser does). The list is drawn as a timeline (see AchievementOrderList.tsx), whose
// index-0 row holds the delay-before-first-unlock wait, so it scrolls with the achievement rows
// instead of staying pinned. The footer's summary (how many unlock, roughly how long it takes) is
// derived from the same `buildOrderTimeline` projection the list's "Unlocks at" times come from.
export const AchievementOrderOverlay = () => {
  const { t } = useTranslation()
  const openGame = useAchievementOrderStore(state => state.openGame)
  const close = useAchievementOrderStore(state => state.close)
  const currentOs = usePlatformStore(state => state.currentOs)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canImportTimings = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)

  const {
    achievements,
    delayBeforeFirstUnlock,
    setDelayBeforeFirstUnlock,
    isLoading,
    isSaving,
    loadErrorCode,
    hasProtectedAchievements,
    protectedAchievements,
    unownedDlcAchievements,
    archivedAchievements,
    dlcGroupIds,
    unlockInterval,
    refresh,
    reorder,
    toggleSkip,
    setDelay,
    resetOrder,
    save,
    importTimings,
  } = useAchievementOrder(openGame)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const timeline = useMemo(
    () => buildOrderTimeline(achievements, delayBeforeFirstUnlock, unlockInterval),
    [achievements, delayBeforeFirstUnlock, unlockInterval],
  )

  const activeAchievement = useMemo(
    () => achievements.find(achievement => achievement.id === activeId) ?? null,
    [achievements, activeId],
  )

  // Header controls (reset, import) and the list's delay-before-first-unlock row are meaningless
  // with nothing loaded yet - keep them visible but inert until there's real order data to edit.
  // The gamer-gated upsell button is exempt (see AchievementOrderHeader's own comment).
  const areControlsDisabled = isLoading || Boolean(loadErrorCode) || achievements.length === 0

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = achievements.findIndex(achievement => achievement.id === active.id)
      const newIndex = achievements.findIndex(achievement => achievement.id === over.id)
      reorder(arrayMove(achievements, oldIndex, newIndex))
    }
  }

  const handleImportTimings = async (steamInput: string) => {
    setIsImporting(true)
    try {
      return await importTimings(steamInput)
    } finally {
      setIsImporting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) close()
  }

  return (
    <>
      <Modal isOpen={openGame !== null} onOpenChange={handleOpenChange}>
        <Modal.Backdrop>
          <Modal.Container size='cover'>
            <Modal.Dialog className='overflow-hidden bg-background p-0'>
              {openGame && (
                <AchievementOrderHeader
                  canImportTimings={canImportTimings}
                  hasProtectedAchievements={hasProtectedAchievements}
                  isDisabled={areControlsDisabled}
                  name={openGame.name}
                  onClose={() => handleOpenChange(false)}
                  onImportTimings={() => setIsImportOpen(true)}
                  onUpsell={() => openProModalWithTier('gamer')}
                />
              )}
              {/* No side padding here - AchievementOrderList.tsx's rows (and its skeleton) pad
                  themselves, so the List's scrollbar sits at the modal's edge. The error and empty
                  states below carry their own `p-8`. */}
              <Modal.Body className='relative z-10 flex min-h-0 flex-1 flex-col m-0 px-0'>
                {isLoading ? (
                  <AchievementOrderSkeleton />
                ) : loadErrorCode ? (
                  <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
                    <Alert className='max-w-md' status='danger'>
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>{t('dashboard.achievementUnlocker.errors.title')}</Alert.Title>
                        <Alert.Description>
                          {t(loadErrorMessageKey(loadErrorCode, currentOs), {
                            code: loadErrorCode,
                          })}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                    <Button variant='secondary' onPress={refresh}>
                      {t('common.actions.tryAgain')}
                    </Button>
                  </div>
                ) : achievements.length === 0 &&
                  protectedAchievements.length === 0 &&
                  unownedDlcAchievements.length === 0 &&
                  archivedAchievements.length === 0 ? (
                  <EmptyState className='flex flex-col items-center justify-center gap-2 p-8 text-center'>
                    <Typography type='h3'>
                      {t('dashboard.achievementUnlocker.order.empty.title')}
                    </Typography>
                    <Typography color='muted' type='body-sm'>
                      {t('dashboard.achievementUnlocker.order.empty.description')}
                    </Typography>
                  </EmptyState>
                ) : (
                  openGame && (
                    <DndContext
                      modifiers={[restrictToVerticalAxis]}
                      sensors={sensors}
                      onDragEnd={handleDragEnd}
                      onDragStart={handleDragStart}
                    >
                      <SortableContext items={achievements.map(achievement => achievement.id)}>
                        <div className='min-h-0 flex-1'>
                          <AchievementOrderList
                            achievements={achievements}
                            appId={openGame.appId}
                            delayBeforeFirstUnlock={delayBeforeFirstUnlock}
                            isDelayDisabled={areControlsDisabled}
                            interval={unlockInterval}
                            timeline={timeline}
                            onDelayChange={setDelayBeforeFirstUnlock}
                            onSetDelay={setDelay}
                            protectedAchievements={protectedAchievements}
                            unownedDlcAchievements={unownedDlcAchievements}
                            archivedAchievements={archivedAchievements}
                            dlcGroupIds={dlcGroupIds}
                            onToggleSkip={toggleSkip}
                          />
                        </div>
                      </SortableContext>
                      {/* `dropAnimation={null}` disables dnd-kit's built-in drop animation, which
                          otherwise races the underlying list's own re-render (`reorder` below runs
                          synchronously in `onDragEnd`, but React's commit still lands a frame later
                          than the overlay's animation start) and reads as a snap-back-then-correct
                          glitch - same fix as AchievementUnlockerListGrid.tsx's DragOverlay. */}
                      {/* The overlay is sized to the whole dragged unit (rail + card + wait), so it
                          redraws the rail's step node beside the card to keep the card in its own
                          column instead of stretching across the rail. The wait itself is left out -
                          just the card follows the pointer. */}
                      <DragOverlay dropAnimation={null}>
                        {activeAchievement ? (
                          <div className='flex gap-3'>
                            <div className='flex w-9 shrink-0 items-center justify-center'>
                              <StepNode step={timeline.steps.get(activeAchievement.id)?.step} />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <AchievementOrderRow
                                isOverlay
                                achievement={activeAchievement}
                                appId={openGame.appId}
                                isDlc={isInGroups(activeAchievement, dlcGroupIds)}
                                isSkipped={activeAchievement.skip}
                                onToggleSkip={toggleSkip}
                              />
                            </div>
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )
                )}
              </Modal.Body>
              {/* Footer placeholder while loading - same bar as the real footer below (summary on
                  the left, Reset + Save on the right) so it doesn't pop in once data arrives. */}
              {isLoading && (
                <Modal.Footer className='bg-background shrink-0 justify-between gap-4 border-t border-border px-6 py-3 mt-0'>
                  <Skeleton className='h-3.5 w-80 rounded-full' />
                  <div className='flex shrink-0 items-center gap-2'>
                    <Skeleton className='h-10 w-20 rounded-full' />
                    <Skeleton className='h-10 w-18 rounded-full' />
                  </div>
                </Modal.Footer>
              )}
              {!isLoading && !loadErrorCode && achievements.length > 0 && (
                <Modal.Footer className='bg-background shrink-0 justify-between gap-4 border-t border-border px-6 py-3 mt-0'>
                  <Typography
                    className='flex flex-wrap items-center gap-x-1 gap-y-1 tabular-nums'
                    color='muted'
                    type='body-xs'
                  >
                    {t('dashboard.achievementUnlocker.order.summary.unlocking', {
                      included: timeline.includedCount,
                      total: achievements.length,
                    })}
                    {/* The finish estimate needs the Unlock interval for any random wait - left
                        out rather than shown wrong if that setting couldn't be loaded. */}
                    {unlockInterval && timeline.latestFinish > 0 && (
                      <>
                        <span aria-hidden className='mx-1 size-1 rounded-full bg-muted' />
                        {/* Times in chips so the two ends of the range stand out from the
                            sentence around them - a range only when random waits make the two
                            ends differ, same rule as formatTimeRange. */}
                        {Math.round(timeline.earliestFinish * 60) ===
                        Math.round(timeline.latestFinish * 60) ? (
                          <Trans
                            components={{ time: <FinishTimeChip /> }}
                            i18nKey='dashboard.achievementUnlocker.order.summary.finishes'
                            values={{ duration: formatWait(t, timeline.latestFinish) }}
                          />
                        ) : (
                          <Trans
                            components={{ time: <FinishTimeChip /> }}
                            i18nKey='dashboard.achievementUnlocker.order.summary.finishesRange'
                            values={{
                              from: formatWait(t, timeline.earliestFinish),
                              to: formatWait(t, timeline.latestFinish),
                            }}
                          />
                        )}
                      </>
                    )}
                  </Typography>
                  {/* Reset sits with Save - both act on the whole order, and Reset only changes
                      the unsaved draft (useAchievementOrder.ts's `resetOrder`), so it lands next to
                      the button that would commit it. */}
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button isDisabled={isSaving} variant='danger-soft' onPress={resetOrder}>
                      {t('dashboard.achievementUnlocker.order.reset')}
                    </Button>
                    <Button isPending={isSaving} onPress={save}>
                      {t('common.actions.save')}
                    </Button>
                  </div>
                </Modal.Footer>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ImportTimingsModal
        isImporting={isImporting}
        isOpen={isImportOpen}
        onImport={handleImportTimings}
        onOpenChange={setIsImportOpen}
      />
    </>
  )
}
