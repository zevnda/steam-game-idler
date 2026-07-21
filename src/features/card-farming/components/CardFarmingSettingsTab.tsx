import type { CardFarmingSettings, DropSortOrder } from '../types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, Separator, Skeleton, toast, Typography } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { ToggleSwitch } from '@/shared/components/ToggleSwitch'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

const DROP_SORT_ORDERS: DropSortOrder[] = ['highestFirst', 'lowestFirst']

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
// Blacklisting itself lives in its own "Blacklisted" tab on `CardFarmingPage` now, not this
// settings tab - see `card_farming::blacklist`'s doc comment. `nextTask` reuses the sidebar's own
// nav labels (`dashboard.sidebar.nav.achievementUnlocker`/`autoIdle`) rather than duplicating the
// same English strings under new settings-specific keys.
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
  const [draft, setDraft] = useState<CardFarmingSettings | null>(null)

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
        {Array.from({ length: 7 }, (_, index) => (
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

      {/* listGames/allGames are mutually exclusive and exactly one must always be on - farming
          needs one unambiguous game source, so toggling one forces the other to the opposite
          state rather than allowing both on or both off (mirrors `main`'s
          handleCheckboxChange.ts). */}
      <SettingsRow
        description={t('dashboard.cardFarming.settings.listGames.description')}
        title={t('dashboard.cardFarming.settings.listGames.title')}
      >
        <ToggleSwitch
          isSelected={draft.listGames}
          onChange={value => commit({ ...draft, listGames: value, allGames: !value })}
        />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.cardFarming.settings.allGames.description')}
        title={t('dashboard.cardFarming.settings.allGames.title')}
      >
        <ToggleSwitch
          isSelected={draft.allGames}
          onChange={value => commit({ ...draft, allGames: value, listGames: !value })}
        />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.cardFarming.settings.singleFarmingMode.description')}
        title={t('dashboard.cardFarming.settings.singleFarmingMode.title')}
      >
        <ToggleSwitch
          isSelected={draft.singleFarmingMode}
          onChange={value => commit({ ...draft, singleFarmingMode: value })}
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
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <ToggleSwitch isSelected={false} onChange={() => openProModalWithTier('gamer')} />
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('common.proTier.gamerRequired')}</AppTooltip.Content>
          </AppTooltip.Root>
        )}
      </SettingsRow>

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

      <SettingsRow
        description={t('dashboard.cardFarming.settings.dropSortOrder.description')}
        showDivider={false}
        title={t('dashboard.cardFarming.settings.dropSortOrder.title')}
      >
        <div className='flex items-center gap-2'>
          {DROP_SORT_ORDERS.map(option => (
            <Button
              key={option}
              size='sm'
              variant={draft.dropSortOrder === option ? 'primary' : 'secondary'}
              onPress={() => commit({ ...draft, dropSortOrder: option })}
            >
              {t(`dashboard.cardFarming.settings.dropSortOrder.options.${option}`)}
            </Button>
          ))}
        </div>
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
    </div>
  )
}
