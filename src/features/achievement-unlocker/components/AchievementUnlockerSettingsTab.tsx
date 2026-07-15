import type { AchievementUnlockerSettings } from '../types'
import { Time } from '@internationalized/date'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CASUAL_MAX_CONCURRENT_GAMES, MAX_CONCURRENT_GAMES } from '../types'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, Separator, Skeleton, TimeField, toast, Typography } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { InputField } from '@/shared/components/InputField'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { ToggleSwitch } from '@/shared/components/ToggleSwitch'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasCasualAccess, hasGamerAccess } from '@/shared/utils/subscriptionAccess'

interface AchievementUnlockerSettingsTabProps {
  settings: AchievementUnlockerSettings | null
  isLoading: boolean
  isSaving: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onSave: (next: AchievementUnlockerSettings) => Promise<boolean>
}

// The achievement-unlocker category of the (app-wide) SettingsModal - see
// useAchievementUnlockerSettings.ts's doc comment for why a per-account category lives in an
// otherwise app-wide modal. Deliberately simpler than `main`'s AchievementSettings.tsx: the
// unlock-interval range is two plain number inputs (min/max minutes), not a dual-thumb range
// Slider, and `scheduleFrom`/`scheduleTo` render via HeroUI's `TimeField` forced to
// `hourCycle={24}`/`granularity='minute'` to match `ScheduleTime`'s `{hour, minute}` shape exactly.
// `nextTask` is a two-button toggle since only two real values exist (`cardFarming`/`autoIdle`).
//
// Every field auto-saves (toggles/buttons on change, number fields on blur via `InputField`)
// rather than needing an explicit Save button - no field here is expensive enough to warrant
// staging. Rows use the shared `SettingsRow` with `showDivider={false}` - each row group manages
// its own trailing divider manually so it doesn't appear/disappear as the row expands and collapses.
export const AchievementUnlockerSettingsTab = ({
  settings,
  isLoading,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onSave,
}: AchievementUnlockerSettingsTabProps) => {
  const { t } = useTranslation()
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  // Casual tier (2026-07-15) - a modest 3-game concurrency step, not gamer's full 32. See
  // resolveMaxConcurrentGames.ts and PRO_TIER.md.
  const canUseMultipleGames = hasCasualAccess(subscriptionTier)
  const multipleGamesCap = hasGamerAccess(subscriptionTier)
    ? MAX_CONCURRENT_GAMES
    : CASUAL_MAX_CONCURRENT_GAMES
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const [draft, setDraft] = useState<AchievementUnlockerSettings | null>(null)

  // Syncs the draft from the loaded setting once per load, not on every `settings` identity change,
  // so it doesn't stomp on in-progress edits when a commit's response re-sets `settings`.
  useEffect(() => {
    if (!isLoading && settings) {
      setDraft(settings)
    }
  }, [isLoading, settings])

  // Every field change flows through here - optimistically updates the visible draft, persists,
  // and reverts + toasts on failure. Returns whether it succeeded so `InputField` knows
  // whether to revert its own local draft.
  const commit = async (next: AchievementUnlockerSettings) => {
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

  const updateSchedule = (
    which: 'scheduleFrom' | 'scheduleTo',
    patch: { hour?: number; minute?: number },
  ) => {
    if (!draft) return Promise.resolve(false)
    return commit({ ...draft, [which]: { ...draft[which], ...patch } })
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
          {t('dashboard.sidebar.nav.achievementUnlocker')}
        </Typography>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.sidebar.nav.achievementUnlocker')}
      </Typography>

      <SettingsRow
        description={t('dashboard.achievementUnlocker.settings.idle.description')}
        showDivider={false}
        title={t('dashboard.achievementUnlocker.settings.idle.title')}
      >
        <ToggleSwitch
          isSelected={draft.idle}
          onChange={value => commit({ ...draft, idle: value })}
        />
      </SettingsRow>
      <Separator className='border-t border-border my-2' />

      <SettingsRow
        description={t('dashboard.achievementUnlocker.settings.multipleGames.description', {
          count: multipleGamesCap,
        })}
        showDivider={true}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.achievementUnlocker.settings.multipleGames.title')}
            {!canUseMultipleGames && <TierBadge tier='casual' />}
          </span>
        }
      >
        {canUseMultipleGames ? (
          <ToggleSwitch
            isSelected={draft.multipleGames}
            onChange={value => commit({ ...draft, multipleGames: value })}
          />
        ) : (
          // Not `isDisabled` - see GeneralSettingsTab's identical gate for why this stays a real,
          // normal-looking Switch whose `onChange` opens the upsell instead of saving.
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <ToggleSwitch isSelected={false} onChange={() => openProModalWithTier('casual')} />
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('common.proTier.casualRequired')}</AppTooltip.Content>
          </AppTooltip.Root>
        )}
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.achievementUnlocker.settings.hidden.description')}
        showDivider={false}
        title={t('dashboard.achievementUnlocker.settings.hidden.title')}
      >
        <ToggleSwitch
          isSelected={draft.hidden}
          onChange={value => commit({ ...draft, hidden: value })}
        />
      </SettingsRow>
      <Separator className='border-t border-border my-2' />

      <SettingsRow
        description={t('dashboard.achievementUnlocker.settings.interval.description', {
          min: draft.interval[0],
          max: draft.interval[1],
        })}
        showDivider={false}
        title={t('dashboard.achievementUnlocker.settings.interval.title')}
      >
        <div className='flex items-center gap-2'>
          <InputField
            ariaLabel={t('dashboard.achievementUnlocker.settings.interval.title')}
            className='w-20'
            maxValue={draft.interval[1]}
            minValue={1}
            value={draft.interval[0]}
            onCommit={min => commit({ ...draft, interval: [min, draft.interval[1]] })}
          />
          <Typography color='muted' type='body-xs'>
            {t('dashboard.achievementUnlocker.settings.interval.to')}
          </Typography>
          <InputField
            ariaLabel={t('dashboard.achievementUnlocker.settings.interval.title')}
            className='w-20'
            maxValue={2880}
            minValue={draft.interval[0]}
            value={draft.interval[1]}
            onCommit={max => commit({ ...draft, interval: [draft.interval[0], max] })}
          />
        </div>
      </SettingsRow>
      <Separator className='border-t border-border my-2' />

      <SettingsRow
        description={t('dashboard.achievementUnlocker.settings.schedule.description')}
        showDivider={false}
        title={t('dashboard.achievementUnlocker.settings.schedule.title')}
      >
        <ToggleSwitch
          isSelected={draft.schedule}
          onChange={value => commit({ ...draft, schedule: value })}
        />
      </SettingsRow>
      {draft.schedule && (
        <div className='flex items-center justify-end gap-3'>
          <ScheduleTimeInputs
            value={draft.scheduleFrom}
            onChange={patch => updateSchedule('scheduleFrom', patch)}
          />
          <Typography color='muted' type='body-xs'>
            {t('dashboard.achievementUnlocker.settings.interval.to')}
          </Typography>
          <ScheduleTimeInputs
            value={draft.scheduleTo}
            onChange={patch => updateSchedule('scheduleTo', patch)}
          />
        </div>
      )}
      <Separator className='border-t border-border my-2' />

      <SettingsRow
        description={t('dashboard.achievementUnlocker.settings.nextTask.description')}
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
          {(
            [
              { task: 'cardFarming', labelKey: 'dashboard.sidebar.nav.cardFarming' },
              { task: 'autoIdle', labelKey: 'dashboard.sidebar.nav.autoIdle' },
            ] as const
          ).map(({ task, labelKey }) => (
            <Button
              key={task}
              size='sm'
              variant={draft.nextTask === task ? 'primary' : 'secondary'}
              onPress={() => commit({ ...draft, nextTask: task })}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

const ScheduleTimeInputs = ({
  value,
  onChange,
}: {
  value: { hour: number; minute: number }
  onChange: (patch: { hour?: number; minute?: number }) => Promise<boolean>
}) => {
  const { t } = useTranslation()

  return (
    <TimeField
      aria-label={t('dashboard.achievementUnlocker.settings.schedule.title')}
      granularity='minute'
      value={new Time(value.hour, value.minute)}
      onChange={time => time && onChange({ hour: time.hour, minute: time.minute })}
    >
      <TimeField.Group>
        <TimeField.InputContainer>
          <TimeField.Input>{segment => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.InputContainer>
      </TimeField.Group>
    </TimeField>
  )
}
