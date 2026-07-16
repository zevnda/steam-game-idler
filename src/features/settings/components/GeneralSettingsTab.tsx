import type { TranslationKey } from '@/i18n'
import type { PersonaState } from '../types'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbExternalLink } from 'react-icons/tb'
import { usePresenceSettings } from '../hooks/usePresenceSettings'
import { errorMessageKey } from '../utils/errorMessageKey'
import {
  Alert,
  Avatar,
  Button,
  FieldError,
  Input,
  ListBox,
  Select,
  TextField,
  toast,
  Typography,
} from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { LanguageSwitch } from '@/shared/components/LanguageSwitch'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { ToggleSwitch } from '@/shared/components/ToggleSwitch'
import { useAccountSummaryStore } from '@/shared/stores/accountSummaryStore'
import { useAntiAwayStore } from '@/shared/stores/antiAwayStore'
import { useAutoUpdateGamesListStore } from '@/shared/stores/autoUpdateGamesListStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { openExternalLink } from '@/shared/utils/links'
import { hasCasualAccess, hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Where the language description's "Help translate SGI" link goes - the project's Crowdin page,
// so users interested in contributing a translation land somewhere they can actually start.
const CROWDIN_PROJECT_URL = 'https://crowdin.com/project/steam-game-idler'

// Agent-mode only (no CLI-mode equivalent). Wire values match
// `steam_agent::presence_settings::PersonaState`'s variant names exactly.
const PERSONA_STATE_OPTIONS: { id: PersonaState; labelKey: TranslationKey }[] = [
  { id: 'Online', labelKey: 'dashboard.settings.general.personaState.options.online' },
  { id: 'Busy', labelKey: 'dashboard.settings.general.personaState.options.busy' },
  { id: 'Away', labelKey: 'dashboard.settings.general.personaState.options.away' },
  { id: 'Snooze', labelKey: 'dashboard.settings.general.personaState.options.snooze' },
  {
    id: 'LookingToTrade',
    labelKey: 'dashboard.settings.general.personaState.options.lookingToTrade',
  },
  {
    id: 'LookingToPlay',
    labelKey: 'dashboard.settings.general.personaState.options.lookingToPlay',
  },
  { id: 'Invisible', labelKey: 'dashboard.settings.general.personaState.options.invisible' },
  { id: 'Offline', labelKey: 'dashboard.settings.general.personaState.options.offline' },
]

interface GeneralSettingsTabProps {
  steamWebApiKey: string | null
  startMinimized: boolean
  closeToTray: boolean
  isLoading: boolean
  isSaving: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onSave: (key: string) => Promise<boolean>
  onRefresh: () => void
  onSaveAntiAway: (enabled: boolean) => Promise<boolean>
  onSaveStartMinimized: (enabled: boolean) => Promise<boolean>
  onSaveCloseToTray: (enabled: boolean) => Promise<boolean>
  onSaveAutoUpdateGamesList: (enabled: boolean) => Promise<boolean>
}

export const GeneralSettingsTab = ({
  steamWebApiKey,
  startMinimized,
  closeToTray,
  isLoading,
  isSaving,
  loadErrorCode,
  actionErrorCode,
  onSave,
  onRefresh,
  onSaveAntiAway,
  onSaveStartMinimized,
  onSaveCloseToTray,
  onSaveAutoUpdateGamesList,
}: GeneralSettingsTabProps) => {
  const { t } = useTranslation()
  const [keyValue, setKeyValue] = useState('')
  // Header row (avatar/display name/identifier) mirrors `main`'s General settings header - reuses
  // the same account/summary stores AccountSwitcher.tsx already reads from, rather than a
  // duplicate lookup. `identifier` falls back to the raw username/steamId (matches
  // AccountSwitcher's own `identifierFor`) since a freshly-signed-in account may not have a
  // resolved `personaName`/`avatarUrl` yet.
  const activeAccount = useSessionStore(state => state.account)
  const activeAccountKey = useSessionStore(state => state.activeAccountKey)
  const accountSummary = useAccountSummaryStore(state =>
    activeAccountKey ? state.summaries[activeAccountKey] : undefined,
  )
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  // Casual tier (2026-07-15) - a background-refresh convenience, not a heavier automation, so it
  // moved down from gamer-only to give Casual its first real functional (non-cosmetic) perk. See
  // PRO_TIER.md.
  const canAutoUpdateGamesList = hasCasualAccess(subscriptionTier)
  const canUsePresenceSettings = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  // Agent-mode only - the hook itself no-ops (empty settings, no load/save) for a CLI-mode
  // account, so it's always safe to call.
  const presence = usePresenceSettings()
  const [customIdleStatusValue, setCustomIdleStatusValue] = useState('')

  // Same "sync from load, don't stomp active typing" split as `keyValue`/`steamWebApiKey` above.
  useEffect(() => {
    if (!presence.isLoading) {
      setCustomIdleStatusValue(presence.settings?.customIdleStatus ?? '')
    }
  }, [presence.isLoading, presence.settings?.customIdleStatus])
  // Same split as antiAway above - `useAutoUpdateGamesListStatus` (mounted in DashboardShell)
  // needs the live value regardless of whether this modal is open.
  const autoUpdateGamesListEnabled = useAutoUpdateGamesListStore(state => state.enabled)
  const setAutoUpdateGamesListEnabled = useAutoUpdateGamesListStore(state => state.setEnabled)
  const setHasCustomApiKey = useAutoUpdateGamesListStore(state => state.setHasCustomApiKey)
  // Reads/writes the live cross-component value directly (see antiAwayStore.ts's doc comment) -
  // not `settings.antiAway` from useSettingsModal, which is only a modal-local snapshot loaded
  // while the modal happens to be open. `useAntiAwayStatus` (mounted in DashboardShell) already
  // hydrates this store before the modal can ever be opened.
  const antiAwayEnabled = useAntiAwayStore(state => state.enabled)
  const setAntiAwayEnabled = useAntiAwayStore(state => state.setEnabled)
  // Unlike antiAway, `startMinimized`/`closeToTray` need no store - neither has an ongoing frontend
  // side effect to keep in sync (startMinimized is only read once by Rust at the *next* launch;
  // closeToTray is read fresh by useTitlebar.ts at close-click time), so the `settings` prop
  // snapshot useSettingsModal already refreshes after a save is sufficient, same as
  // `steamWebApiKey` above.

  // No settings.json field at all - the OS registry entry itself is the single source of truth,
  // queried live via the autostart plugin
  // rather than duplicated into a persisted setting that could drift from it. Local to this
  // component since nothing else in the app needs this value.
  const [runAtStartupEnabled, setRunAtStartupEnabled] = useState(false)

  useEffect(() => {
    isEnabled()
      .then(setRunAtStartupEnabled)
      .catch(error => {
        console.error('Error in (isEnabled) for run-at-startup hydration:', error)
      })
  }, [])

  // Syncs the field from the loaded setting once - not on every `steamWebApiKey` change, so the
  // field doesn't stomp on what the user is actively typing when `onSave`'s response re-sets it.
  useEffect(() => {
    if (!isLoading) {
      setKeyValue(steamWebApiKey ?? '')
    }
  }, [isLoading, steamWebApiKey])

  // Save/clear feedback is one-off action feedback, not a persistent page state - fires a toast
  // rather than rendering inline (unlike `loadErrorCode` below, which blocks the whole tab and
  // stays visible until the user retries).
  const handleSave = async () => {
    const ok = await onSave(keyValue)
    if (ok) {
      setHasCustomApiKey(keyValue.trim().length > 0)
      toast.success(t('common.status.saved'))
    } else if (actionErrorCode) {
      toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  const handleClear = async () => {
    const ok = await onSave('')
    if (ok) {
      setKeyValue('')
      setHasCustomApiKey(false)
      toast.success(t('common.status.cleared'))
    } else if (actionErrorCode) {
      toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  // A switch, not a form field - saves and reflects immediately on toggle rather than needing an
  // explicit Save button, matching `main`'s own instant-toggle behavior for this exact setting
  // (SettingsSwitch.tsx). No success toast - the switch's own state change is already the success
  // feedback; only a failure (which reverts the switch) needs an explanation.
  const handleToggleAntiAway = async (next: boolean) => {
    const ok = await onSaveAntiAway(next)
    if (ok) {
      setAntiAwayEnabled(next)
    } else if (actionErrorCode) {
      toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  const handleToggleStartMinimized = async (next: boolean) => {
    await onSaveStartMinimized(next)
    if (actionErrorCode) {
      toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  const handleToggleCloseToTray = async (next: boolean) => {
    await onSaveCloseToTray(next)
    if (actionErrorCode) {
      toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  const handleToggleAutoUpdateGamesList = async (next: boolean) => {
    const ok = await onSaveAutoUpdateGamesList(next)
    if (ok) {
      setAutoUpdateGamesListEnabled(next)
    } else if (actionErrorCode) {
      toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  // A Select, not a form field - saves immediately on selection, matching every other instant-apply
  // control in this tab (the toggle switches above). `presence.settings` is guaranteed non-null
  // here since the Select is only interactive once loaded (see the render below).
  const handleChangePersonaState = async (personaState: PersonaState) => {
    if (!presence.settings) return
    const ok = await presence.save({ ...presence.settings, personaState })
    if (!ok && presence.actionErrorCode) {
      toast.danger(t(errorMessageKey(presence.actionErrorCode), { code: presence.actionErrorCode }))
    }
  }

  // A text field with an explicit Save button, matching the Steam Web API key field above - not
  // instant-apply, since every keystroke shouldn't trigger a save.
  const handleSaveCustomIdleStatus = async () => {
    if (!presence.settings) return
    const ok = await presence.save({
      ...presence.settings,
      customIdleStatus: customIdleStatusValue.trim() || null,
    })
    if (ok) {
      toast.success(t('common.status.saved'))
    } else if (presence.actionErrorCode) {
      toast.danger(t(errorMessageKey(presence.actionErrorCode), { code: presence.actionErrorCode }))
    }
  }

  const handleClearCustomIdleStatus = async () => {
    if (!presence.settings) return
    const ok = await presence.save({ ...presence.settings, customIdleStatus: null })
    if (ok) {
      setCustomIdleStatusValue('')
      toast.success(t('common.status.cleared'))
    } else if (presence.actionErrorCode) {
      toast.danger(t(errorMessageKey(presence.actionErrorCode), { code: presence.actionErrorCode }))
    }
  }

  const handleToggleRunAtStartup = async (next: boolean) => {
    try {
      if (next) {
        await enable()
      } else {
        await disable()
      }
      setRunAtStartupEnabled(next)
      logFrontendInfo('generalSettings', 'run at startup setting saved', { enabled: next })
    } catch (error) {
      console.error('Error in (enable/disable) for run-at-startup:', error)
      toast.danger(t(errorMessageKey(String(error)), { code: String(error) }))
    }
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

  const identifier = activeAccount
    ? activeAccount.mode === 'agent'
      ? activeAccount.username
      : activeAccount.steamId
    : null
  const identifierLabel =
    activeAccount?.mode === 'agent'
      ? t('auth.signIn.usernameLabel')
      : t('dashboard.settings.general.account.steamIdLabel')
  const displayName = accountSummary?.personaName || identifier
  const avatarInitial = displayName?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className='flex flex-col gap-5'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.settings.general.title')}
      </Typography>

      {activeAccount && (
        <div className='flex items-end gap-4 mb-8'>
          <Avatar size='lg'>
            {accountSummary?.avatarUrl ? (
              <Avatar.Image alt={displayName ?? ''} src={accountSummary.avatarUrl} />
            ) : null}
            <Avatar.Fallback>{avatarInitial}</Avatar.Fallback>
          </Avatar>
          <div className='flex flex-col gap-1'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('dashboard.settings.general.account.displayNameLabel')}
            </Typography>
            <Typography
              className='w-58 rounded-lg bg-field px-2 py-1.5'
              truncate
              type='body-sm'
              weight='semibold'
            >
              {displayName}
            </Typography>
          </div>
          <div className='flex flex-col gap-1'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {identifierLabel}
            </Typography>
            <Typography
              className='w-58 rounded-lg bg-field px-2 py-1.5'
              truncate
              type='body-sm'
              weight='semibold'
            >
              {identifier}
            </Typography>
          </div>
          {/* Agent mode's own identifier above is the sign-in username, not a Steam ID (unlike CLI
              mode, where they're the same value) - show it separately once useAccountSummaries has
              resolved it, same fallback-until-resolved treatment as displayName above. */}
          {activeAccount?.mode === 'agent' && accountSummary?.steamId && (
            <div className='flex flex-col gap-1'>
              <Typography color='muted' type='body-xs' weight='semibold'>
                {t('dashboard.settings.general.account.steamIdLabel')}
              </Typography>
              <Typography
                className='w-58 rounded-lg bg-field px-2 py-1.5'
                truncate
                type='body-sm'
                weight='semibold'
              >
                {accountSummary.steamId}
              </Typography>
            </div>
          )}
        </div>
      )}

      <SettingsRow
        description={
          <>
            {t('dashboard.settings.general.language.description')}
            <button
              type='button'
              className='mt-1 flex cursor-pointer items-center gap-1 text-accent hover:text-accent/80 duration-150'
              onClick={() => openExternalLink(CROWDIN_PROJECT_URL)}
            >
              {t('dashboard.settings.general.language.helpTranslate')}
              <TbExternalLink fontSize={12} />
            </button>
          </>
        }
        title={t('dashboard.settings.general.language.label')}
      >
        <LanguageSwitch />
      </SettingsRow>

      {/* CLI-mode only - pokes the real local Steam client's own AFK detection
          (`useAntiAwayStatus.ts`), which agent mode has none of (no local client, no OS-level idle
          detection - see PresenceManager.cs's doc comment). The persona-state picker below already
          covers agent mode's equivalent need, with no periodic re-poke required since a set
          persona state doesn't decay on its own. */}
      {activeAccount?.mode !== 'agent' && (
        <SettingsRow
          description={t('dashboard.settings.general.antiAway.description')}
          title={t('dashboard.settings.general.antiAway.label')}
        >
          <ToggleSwitch isSelected={antiAwayEnabled} onChange={handleToggleAntiAway} />
        </SettingsRow>
      )}

      {/* Agent-mode only (no CLI-mode equivalent) - see presence_settings.rs's module doc comment. */}
      {activeAccount?.mode === 'agent' && (
        <>
          {/* Free for every agent-mode account - only the custom idle status message below stays
              Gamer-gated. */}
          <SettingsRow
            description={t('dashboard.settings.general.personaState.description')}
            title={t('dashboard.settings.general.personaState.label')}
          >
            <Select.Root
              aria-label={t('dashboard.settings.general.personaState.label')}
              className='w-62.5'
              isDisabled={presence.isLoading || !presence.settings}
              selectedKey={presence.settings?.personaState ?? 'Online'}
              onSelectionChange={key => handleChangePersonaState(key as PersonaState)}
            >
              <Select.Trigger className='border-none'>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox items={PERSONA_STATE_OPTIONS}>
                  {item => (
                    <ListBox.Item id={item.id} textValue={t(item.labelKey)}>
                      {t(item.labelKey)}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </Select.Popover>
            </Select.Root>
          </SettingsRow>

          <SettingsRow
            description={t('dashboard.settings.general.customIdleStatus.description')}
            title={
              <span className='flex items-center gap-2'>
                {t('dashboard.settings.general.customIdleStatus.label')}
                {!canUsePresenceSettings && <TierBadge tier='gamer' />}
              </span>
            }
          >
            <div className='flex flex-col items-end gap-3'>
              <TextField
                aria-label={t('dashboard.settings.general.customIdleStatus.label')}
                className='w-62.5'
                isDisabled={presence.isLoading || presence.isSaving}
                // Typable regardless of tier - only Save/Clear below are gated, so a non-Pro user
                // can draft a message before hitting the upsell rather than being blocked upfront.
                value={customIdleStatusValue}
                onChange={setCustomIdleStatusValue}
              >
                <Input placeholder={t('dashboard.settings.general.customIdleStatus.placeholder')} />
                <FieldError />
              </TextField>

              <div className='flex items-center gap-3'>
                <Button
                  size='sm'
                  isDisabled={
                    presence.isLoading || presence.isSaving || !presence.settings?.customIdleStatus
                  }
                  variant='secondary'
                  onPress={
                    canUsePresenceSettings
                      ? handleClearCustomIdleStatus
                      : () => openProModalWithTier('gamer')
                  }
                >
                  {t('common.actions.clear')}
                </Button>
                <Button
                  size='sm'
                  isDisabled={presence.isLoading}
                  isPending={canUsePresenceSettings && presence.isSaving}
                  onPress={
                    canUsePresenceSettings
                      ? handleSaveCustomIdleStatus
                      : () => openProModalWithTier('gamer')
                  }
                >
                  {t('common.actions.save')}
                </Button>
              </div>
            </div>
          </SettingsRow>
        </>
      )}

      <SettingsRow
        description={t('dashboard.settings.general.runAtStartup.description')}
        title={t('dashboard.settings.general.runAtStartup.label')}
      >
        <ToggleSwitch isSelected={runAtStartupEnabled} onChange={handleToggleRunAtStartup} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.general.startMinimized.description')}
        title={t('dashboard.settings.general.startMinimized.label')}
      >
        <ToggleSwitch isSelected={startMinimized} onChange={handleToggleStartMinimized} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.general.closeToTray.description')}
        title={t('dashboard.settings.general.closeToTray.label')}
      >
        <ToggleSwitch isSelected={closeToTray} onChange={handleToggleCloseToTray} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.general.autoUpdateGamesList.description')}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.settings.general.autoUpdateGamesList.label')}
            {!canAutoUpdateGamesList && <TierBadge tier='casual' />}
          </span>
        }
      >
        {canAutoUpdateGamesList ? (
          <ToggleSwitch
            isSelected={autoUpdateGamesListEnabled}
            onChange={handleToggleAutoUpdateGamesList}
          />
        ) : (
          // Not `isDisabled` - a real, enabled-looking Switch whose `onChange` opens the upsell
          // instead of saving, so the control doesn't visually read as unclickable (the
          // `TierBadge` above already signals the gate, this switch itself should look like
          // every other switch in the tab).
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <ToggleSwitch isSelected={false} onChange={() => openProModalWithTier('casual')} />
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('common.proTier.casualRequired')}</AppTooltip.Content>
          </AppTooltip.Root>
        )}
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.general.apiKey.description')}
        title={t('dashboard.settings.general.apiKey.label')}
        showDivider={false}
      >
        <div className='flex flex-col items-end gap-3'>
          <TextField
            aria-label={t('dashboard.settings.general.apiKey.label')}
            className='w-62.5'
            isDisabled={isLoading || isSaving}
            value={keyValue}
            onChange={setKeyValue}
          >
            <Input
              autoComplete='off'
              placeholder={t('dashboard.settings.general.apiKey.placeholder')}
              type='password'
            />
            <FieldError />
          </TextField>

          <div className='flex items-center gap-3'>
            <Button
              size='sm'
              isDisabled={isLoading || isSaving || !steamWebApiKey}
              variant='secondary'
              onPress={handleClear}
            >
              {t('common.actions.clear')}
            </Button>
            <Button size='sm' isDisabled={isLoading} isPending={isSaving} onPress={handleSave}>
              {t('common.actions.save')}
            </Button>
          </div>
        </div>
      </SettingsRow>
    </div>
  )
}
