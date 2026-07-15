import type { ManualCookiesFormValue } from '@/shared/components/ManualCookiesForm'
import type { SteamCookies } from '../types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbExternalLink } from 'react-icons/tb'
import { steamCredentialsErrorMessageKey } from '../utils/errorMessageKey'
import {
  Alert,
  Button,
  Skeleton,
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabPanel,
  TabsRoot,
  toast,
  Typography,
} from '@heroui/react'
import {
  EMPTY_MANUAL_COOKIES_FORM_VALUE,
  ManualCookiesForm,
} from '@/shared/components/ManualCookiesForm'
import { TierBadge } from '@/shared/components/TierBadge'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'
import { showErrorToast } from '@/shared/utils/showErrorToast'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

const STEAM_CREDENTIALS_DOCS_URL = 'https://steamgameidler.com/docs/steam-credentials'

type CookieMethod = 'automatic' | 'manual'

interface SteamCredentialsTabProps {
  cookies: SteamCookies | null
  isLoading: boolean
  isSaving: boolean
  isClearing: boolean
  isAcquiring: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onSave: (next: SteamCookies) => Promise<boolean>
  onClear: () => Promise<boolean>
  onAcquire: () => Promise<boolean>
}

function toFormValue(cookies: SteamCookies | null) {
  if (!cookies) return EMPTY_MANUAL_COOKIES_FORM_VALUE
  return { sid: cookies.sid, sls: cookies.sls, sma: cookies.sma ?? '' }
}

// The Steam Credentials category of the (app-wide) SettingsModal - lets a CLI-mode user save
// Steam Community cookies (sid/sls/sma) once, either automatically (gamer-tier, mirrors
// CardFarmingStartPanel/InventoryConnectPanel's own automatic option - see `onAcquire`'s doc
// comment on `acquire_and_save_steam_credentials`) or by pasting them manually, so
// CardFarmingStartPanel/InventoryConnectPanel's own manual-entry tab doesn't need them re-entered
// every time (see `src-tauri/src/steam_community/credentials.rs`'s doc comment - the same store
// backs all three surfaces via the frontend's `useSavedSteamCookies` hook).
//
// Agent-mode accounts never need this (they derive cookies straight from their live daemon
// session) - shown as an inline note instead of the
// form. The automatic/manual tab split always shows both tabs regardless of tier (brought in line
// 2026-07-13 with `SteamCookiesConnectPanel`'s own pattern, which this previously diverged from)
// - the automatic tab is never `isDisabled`/hidden for a non-gamer
// account, just intercepted in `onSelectionChange` to open the upsell instead of switching tabs.
export const SteamCredentialsTab = ({
  cookies,
  isLoading,
  isSaving,
  isClearing,
  isAcquiring,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onSave,
  onClear,
  onAcquire,
}: SteamCredentialsTabProps) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canUseAutomatic = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const [method, setMethod] = useState<CookieMethod>(canUseAutomatic ? 'automatic' : 'manual')
  const [draft, setDraft] = useState<ManualCookiesFormValue>(EMPTY_MANUAL_COOKIES_FORM_VALUE)

  // Syncs the draft from the loaded value once per load, not on every `cookies` identity change -
  // same reasoning as GeneralSettingsTab's identical effect for `steamWebApiKey`.
  useEffect(() => {
    if (!isLoading) {
      setDraft(toFormValue(cookies))
    }
  }, [isLoading, cookies])

  const canSubmit = draft.sid.trim() !== '' && draft.sls.trim() !== ''

  const reportError = (code: string | null) => {
    if (code) {
      showErrorToast(
        t(steamCredentialsErrorMessageKey(code), { code }),
        code,
        t('common.learnMore'),
      )
    }
  }

  const handleSave = async () => {
    const ok = await onSave({
      sid: draft.sid.trim(),
      sls: draft.sls.trim(),
      sma: draft.sma.trim() || undefined,
    })
    if (ok) {
      toast.success(t('dashboard.settings.steamCredentials.saved'))
    } else {
      reportError(actionErrorCode)
    }
  }

  const handleClear = async () => {
    const ok = await onClear()
    if (ok) {
      setDraft(EMPTY_MANUAL_COOKIES_FORM_VALUE)
      toast.success(t('dashboard.settings.steamCredentials.cleared'))
    } else {
      reportError(actionErrorCode)
    }
  }

  const handleAcquire = async () => {
    const ok = await onAcquire()
    if (ok) {
      toast.success(t('dashboard.settings.steamCredentials.saved'))
    } else {
      reportError(actionErrorCode)
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
              {t(steamCredentialsErrorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button size='sm' variant='secondary' onPress={onRefresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <Typography type='h3' className='font-bold mb-4'>
          {t('dashboard.settings.steamCredentials.title')}
        </Typography>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  const clearButton = (
    <Button
      size='sm'
      isDisabled={isSaving || isAcquiring || !cookies}
      isPending={isClearing}
      variant='secondary'
      onPress={handleClear}
    >
      {t('common.actions.clear')}
    </Button>
  )

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between gap-4'>
        <Typography type='h3' className='font-bold'>
          {t('dashboard.settings.steamCredentials.title')}
        </Typography>
        {account?.mode !== 'agent' && (
          <Button
            size='sm'
            variant='secondary'
            className='inline-flex shrink-0 items-center gap-1 text-sm duration-150 cursor-pointer'
            type='button'
            onClick={() => openExternalLink(STEAM_CREDENTIALS_DOCS_URL)}
          >
            {t('common.learnMore')}
            <TbExternalLink fontSize={14} />
          </Button>
        )}
      </div>
      <Typography color='muted' type='body-sm'>
        {t('dashboard.settings.steamCredentials.description')}
      </Typography>

      {account?.mode === 'agent' ? (
        <Alert status='default'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t('dashboard.settings.steamCredentials.agentModeNote')}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        // Always shows both tabs - the automatic tab is never
        // `isDisabled`/hidden for a non-gamer account, just intercepted below to open the upsell
        // instead of switching, mirroring SteamCookiesConnectPanel's identical split exactly.
        <TabsRoot
          selectedKey={method}
          onSelectionChange={key => {
            if (key === 'automatic' && !canUseAutomatic) {
              openProModalWithTier('gamer')
              return
            }
            setMethod(key as CookieMethod)
          }}
        >
          <TabListContainer>
            <TabList>
              <Tab className={!canUseAutomatic ? 'opacity-60' : undefined} id='automatic'>
                <span className='inline-flex items-center gap-1.5'>
                  {t('common.connect.automaticTab')}
                  {!canUseAutomatic && <TierBadge tier='gamer' />}
                </span>
                <TabIndicator />
              </Tab>
              <Tab id='manual'>
                {t('common.connect.manualTab')}
                <TabIndicator />
              </Tab>
            </TabList>
          </TabListContainer>
          <TabPanel className='flex flex-col gap-4 pt-4' id='automatic'>
            <Typography color='muted' type='body-sm'>
              {t('dashboard.settings.steamCredentials.automaticDescription')}
            </Typography>
            <div className='flex items-center gap-3'>
              <Button
                size='sm'
                isDisabled={isClearing}
                isPending={isAcquiring}
                onPress={handleAcquire}
              >
                {t('common.actions.signIn')}
              </Button>
              {cookies && clearButton}
            </div>
          </TabPanel>
          <TabPanel className='flex flex-col gap-4 pt-4' id='manual'>
            <ManualCookiesForm
              isDisabled={isSaving || isClearing}
              value={draft}
              onChange={setDraft}
            />
            <div className='flex items-center gap-3'>
              {clearButton}
              <Button
                size='sm'
                isDisabled={isClearing || isAcquiring || !canSubmit}
                isPending={isSaving}
                onPress={handleSave}
              >
                {t('common.actions.save')}
              </Button>
            </div>
          </TabPanel>
        </TabsRoot>
      )}
    </div>
  )
}
