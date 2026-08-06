import type { CardFarmingSettings } from '../types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbExternalLink } from 'react-icons/tb'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, Modal, Separator, Skeleton, toast, Typography } from '@heroui/react'
import { BetaBadge } from '@/shared/components/BetaBadge'
import { InputField } from '@/shared/components/InputField'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { ToggleSwitch } from '@/shared/components/ToggleSwitch'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Where the "Hours until farmable" description's "Learn more" link goes - the docs page explaining
// card drop timing, so users curious about the setting land somewhere with a real explanation.
const CARD_DROP_TIMES_DOCS_URL =
  'https://steamgameidler.com/docs/features/card-farming/how-it-works'

interface CardFarmingSettingsTabProps {
  settings: CardFarmingSettings | null
  isLoading: boolean
  isSaving: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onSave: (next: CardFarmingSettings) => Promise<boolean>
}

// The card-farming category of the (app-wide) SettingsModal - mirrors
// AchievementUnlockerSettingsTab.tsx's shape exactly (draft-state-plus-auto-save, per-field
// layout, every field committing on change rather than an explicit Save button - see that file's
// doc comment for why). `autoFarmCards` is gated exactly like that tab's `multipleGames` toggle
// (real ToggleSwitch, never `isDisabled`, `TierBadge` + `onChange` rerouted to
// `openWithTier('gamer')` when ungated) - the actual periodic check/farm loop it enables lives in
// `useAutoFarmCards.ts` (mounted in DashboardShell), not here; this tab only persists the flag.
// Blacklisting/whitelisting each live in their own tab on `CardFarmingPage` now, not this settings
// tab - see `card_farming::blacklist`/`card_farming::whitelist`'s doc comments. `nextTask` reuses
// the sidebar's own nav labels (`dashboard.sidebar.nav.achievementUnlocker`/`autoIdle`) rather than
// duplicating the same English strings under new settings-specific keys.
//
// There is no ordering setting here at all (no more "farming order"/queue-mode toggle) - ordering
// is always automatic now (fewest drops remaining first while farming, closest to
// `hoursUntilFarmable` first while accumulating playtime), never user-configurable.
export const CardFarmingSettingsTab = ({
  settings,
  isLoading,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onSave,
}: CardFarmingSettingsTabProps) => {
  const { t } = useTranslation()
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canAutoFarm = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const account = useSessionStore(state => state.account)
  const isAgentMode = account?.mode === 'agent'
  const [draft, setDraft] = useState<CardFarmingSettings | null>(null)
  // Shown when turning `allowMultiGameFarming` on for the first time ever (per account) - see the
  // toggle's own `onChange` below. Not shown for anything else, since ordinary bulk-idling
  // (accumulating playtime) never risks the drop-rate collapse this warns about - only farming more
  // than one game with real card drops remaining at once does.
  const [showMultiGameNotice, setShowMultiGameNotice] = useState(false)

  // Syncs the draft from the loaded setting once per load, not on every `settings` identity
  // change - see AchievementUnlockerSettingsTab.tsx's identical effect for why.
  useEffect(() => {
    if (!isLoading && settings) {
      setDraft(settings)
    }
  }, [isLoading, settings])

  // Every field change flows through here - see AchievementUnlockerSettingsTab.tsx's identical
  // `commit` for why (optimistic update, persist, revert + toast on failure).
  const commit = async (next: CardFarmingSettings) => {
    setDraft(next)
    const ok = await onSave(next)
    if (!ok) {
      setDraft(settings)
      if (actionErrorCode) {
        toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
      }
    }
    return ok
  }

  const handleAllowMultiGameFarmingChange = (value: boolean) => {
    if (!draft) return
    if (value && !draft.multiGameFarmingNoticeSeen) {
      setShowMultiGameNotice(true)
      return
    }
    commit({ ...draft, allowMultiGameFarming: value })
  }

  // Dismissing (backdrop/escape/close button) always marks the notice seen so it never reappears,
  // same as clicking through it - only the explicit "Continue" action also turns the setting on, so
  // an accidental outside click or Escape press can't silently opt the account into simultaneous
  // multi-game farming nobody asked to actually enable yet.
  const dismissMultiGameNotice = () => {
    setShowMultiGameNotice(false)
    if (draft) commit({ ...draft, multiGameFarmingNoticeSeen: true })
  }

  if (loadErrorCode) {
    return (
      <div className='flex flex-col items-center gap-4 p-8 text-center'>
        <Alert className='max-w-md' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.settings.errors.title')}</Alert.Title>
            <Alert.Description>
              {t(errorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant='secondary' onPress={onRefresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  if (isLoading || !draft) {
    return (
      <div className='flex flex-col gap-4'>
        <Typography type='h3' className='font-bold mb-4'>
          {t('dashboard.sidebar.nav.cardFarming')}
        </Typography>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.sidebar.nav.cardFarming')}
      </Typography>

      <SettingsRow
        description={
          <>
            {t('dashboard.cardFarming.settings.hoursUntilFarmable.description')}
            <button
              type='button'
              className='mt-1 flex cursor-pointer items-center gap-1 text-accent hover:text-accent/80 duration-150'
              onClick={() => openExternalLink(CARD_DROP_TIMES_DOCS_URL)}
            >
              {t('common.learnMore')}
              <TbExternalLink fontSize={12} />
            </button>
          </>
        }
        title={t('dashboard.cardFarming.settings.hoursUntilFarmable.title')}
      >
        <InputField
          ariaLabel={t('dashboard.cardFarming.settings.hoursUntilFarmable.title')}
          className='w-20'
          maxValue={24}
          minValue={0}
          value={draft.hoursUntilFarmable}
          onCommit={hours => commit({ ...draft, hoursUntilFarmable: hours })}
        />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.cardFarming.settings.allowMultiGameFarming.description')}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.cardFarming.settings.allowMultiGameFarming.title')}
            <BetaBadge />
          </span>
        }
      >
        <ToggleSwitch
          isSelected={draft.allowMultiGameFarming}
          onChange={handleAllowMultiGameFarmingChange}
        />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.cardFarming.settings.autoFarmCards.description')}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.cardFarming.settings.autoFarmCards.title')}
            {!canAutoFarm && <TierBadge tier='gamer' />}
          </span>
        }
      >
        {canAutoFarm ? (
          <ToggleSwitch
            isSelected={draft.autoFarmCards}
            onChange={value => commit({ ...draft, autoFarmCards: value })}
          />
        ) : (
          // Not `isDisabled` - see AchievementUnlockerSettingsTab's identical `multipleGames` gate
          // for why this stays a real, normal-looking Switch whose `onChange` opens the upsell
          // instead of saving.
          <ToggleSwitch isSelected={false} onChange={() => openProModalWithTier('gamer')} />
        )}
      </SettingsRow>

      {/* Agent-mode only - no purchase-date data exists for a CLI-mode account, so the row is
          hidden entirely rather than shown disabled, matching GeneralSettingsTab.tsx's
          antiAway/personaState mode-gating (whole `SettingsRow` conditionally rendered on
          `activeAccount?.mode`). */}
      {isAgentMode && (
        <SettingsRow
          description={t('dashboard.cardFarming.settings.skipRefundableGames.description')}
          title={
            <span className='flex items-center gap-2'>
              {t('dashboard.cardFarming.settings.skipRefundableGames.title')}
              <BetaBadge />
            </span>
          }
        >
          <ToggleSwitch
            isSelected={draft.skipRefundableGames}
            onChange={value => commit({ ...draft, skipRefundableGames: value })}
          />
        </SettingsRow>
      )}

      <SettingsRow
        description={t('dashboard.cardFarming.settings.skipNoPlaytime.description')}
        title={t('dashboard.cardFarming.settings.skipNoPlaytime.title')}
      >
        <ToggleSwitch
          isSelected={draft.skipNoPlaytime}
          onChange={value =>
            commit({
              ...draft,
              skipNoPlaytime: value,
              farmUnplayedOnly: value ? false : draft.farmUnplayedOnly,
            })
          }
        />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.cardFarming.settings.farmUnplayedOnly.description')}
        showDivider={false}
        title={t('dashboard.cardFarming.settings.farmUnplayedOnly.title')}
      >
        <ToggleSwitch
          isSelected={draft.farmUnplayedOnly}
          onChange={value =>
            commit({
              ...draft,
              farmUnplayedOnly: value,
              skipNoPlaytime: value ? false : draft.skipNoPlaytime,
            })
          }
        />
      </SettingsRow>
      <Separator className='border-t border-border my-2' />

      <SettingsRow
        description={t('dashboard.cardFarming.settings.nextTask.description')}
        showDivider={false}
        title={t('dashboard.cardFarming.settings.nextTask.title')}
      >
        <ToggleSwitch
          isSelected={draft.nextTaskCheckbox}
          onChange={value => commit({ ...draft, nextTaskCheckbox: value })}
        />
      </SettingsRow>
      {draft.nextTaskCheckbox && (
        <div className='flex items-center justify-end gap-2'>
          {(['achievementUnlocker', 'autoIdle'] as const).map(task => (
            <Button
              key={task}
              size='sm'
              variant={draft.nextTask === task ? 'primary' : 'secondary'}
              onPress={() => commit({ ...draft, nextTask: task })}
            >
              {t(`dashboard.sidebar.nav.${task}`)}
            </Button>
          ))}
        </div>
      )}

      <Modal
        isOpen={showMultiGameNotice}
        onOpenChange={open => {
          if (!open) dismissMultiGameNotice()
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size='sm'>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{t('dashboard.cardFarming.multiGameNotice.title')}</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body>
                <p>{t('dashboard.cardFarming.multiGameNotice.description')}</p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  onPress={() => {
                    setShowMultiGameNotice(false)
                    commit({
                      ...draft,
                      allowMultiGameFarming: true,
                      multiGameFarmingNoticeSeen: true,
                    })
                  }}
                >
                  {t('common.actions.continue')}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
