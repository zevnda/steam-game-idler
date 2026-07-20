import type { CurrentOs } from '@/shared/stores/platformStore'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAchievementOrder } from '../hooks/useAchievementOrder'
import { errorMessageKey } from '../utils/errorMessageKey'
import { AchievementOrderHeader } from './AchievementOrderHeader'
import { AchievementOrderList } from './AchievementOrderList'
import { AchievementOrderRow } from './AchievementOrderRow'
import { ImportTimingsModal } from './ImportTimingsModal'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { Alert, Button, EmptyState, Modal, Skeleton, Typography } from '@heroui/react'
import { errorMessageKey as achievementDataErrorMessageKey } from '@/features/achievement-manager/utils/errorMessageKey'
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

// Per-game achievement-order overlay - not a route (static export can't do a dynamic [appId]
// segment). Mirrors AchievementManagerOverlay.tsx's header/body
// split (a static header - close/title/reset/import - above a scrolling body, driven entirely by
// its own store) but with drag-reorder/skip/delay editing instead of unlock/lock actions, and no
// game art (a per-achievement editor has no use for hero/capsule art the way the achievements/
// statistics browser does). The delay-before-first-unlock control lives inside the virtualized list
// itself (AchievementOrderList.tsx's index-0 row), not the static header, so it scrolls with the
// achievement rows instead of staying pinned.
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
            <Modal.Dialog className='overflow-hidden p-0'>
              {openGame && (
                <AchievementOrderHeader
                  canImportTimings={canImportTimings}
                  isDisabled={areControlsDisabled}
                  name={openGame.name}
                  onClose={() => handleOpenChange(false)}
                  onImportTimings={() => setIsImportOpen(true)}
                  onReset={resetOrder}
                  onUpsell={() => openProModalWithTier('gamer')}
                />
              )}
              <Modal.Body className='relative z-10 flex min-h-0 flex-1 flex-col m-0 px-6'>
                {isLoading ? (
                  <div className='flex flex-col gap-2'>
                    {Array.from({ length: 8 }, (_, index) => (
                      <Skeleton key={index} className='h-14 w-full rounded-lg' />
                    ))}
                  </div>
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
                ) : achievements.length === 0 ? (
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
                            onDelayChange={setDelayBeforeFirstUnlock}
                            onSetDelay={setDelay}
                            onToggleSkip={toggleSkip}
                          />
                        </div>
                      </SortableContext>
                      <DragOverlay>
                        {activeAchievement ? (
                          <AchievementOrderRow
                            isOverlay
                            achievement={activeAchievement}
                            appId={openGame.appId}
                            onSetDelay={setDelay}
                            onToggleSkip={toggleSkip}
                          />
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )
                )}
              </Modal.Body>
              {!isLoading && !loadErrorCode && achievements.length > 0 && (
                <Modal.Footer className='bg-overlay shrink-0 border-t border-border px-6 py-3 mt-0'>
                  <Button isPending={isSaving} onPress={save}>
                    {t('common.actions.save')}
                  </Button>
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
