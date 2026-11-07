import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertDialog, Button, Checkbox, toast } from '@heroui/react'
import { useRouter } from 'next/router'
import { useAddAccountModalStore } from '@/shared/stores/addAccountModalStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useReauthModalStore } from '@/shared/stores/reauthModalStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSteamWarningStore } from '@/shared/stores/steamWarningStore'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { useVersionPolicyStore } from '@/shared/stores/versionPolicyStore'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

const LOG_SOURCE = 'LegacyInstallPrompt'

// Mirror src-tauri/src/legacy_install/commands.rs.
interface LegacyInstallStatus {
  detected: boolean
  promptDismissed: boolean
}
type LegacyCleanupResult = 'removed' | 'declined' | 'notFound' | 'failed'

interface PromptGate {
  isDashboard: boolean
  isUpdating: boolean
  initialCheckSettled: boolean
  otherDialogOpen: boolean
  windowFocused: boolean
}

// When the prompt may open, in one place:
// - only on a signed-in /dashboard/* page, never over the sign-in flow;
// - never while an update is installing, nor before this launch's first update check has finished
//   without one - an install restarts the app, and the updated version asks instead;
// - never stacked on another dialog (changelog, outdated-version prompt, sign-in/re-auth, Go Pro,
//   Settings, the Steam warning) - it waits for them to close;
// - only while the window is focused, so a hidden start_minimized launch waits for the user to
//   open the window from the tray (a hidden window can't have focus).
const canShowPrompt = (gate: PromptGate) =>
  gate.isDashboard &&
  !gate.isUpdating &&
  gate.initialCheckSettled &&
  !gate.otherDialogOpen &&
  gate.windowFocused

const useWindowFocused = () => {
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const window = getCurrentWindow()
    let cancelled = false
    window
      .isFocused()
      .then(value => !cancelled && setFocused(value))
      .catch(() => {})
    const unlisten = window.onFocusChanged(({ payload }) => setFocused(payload))
    return () => {
      cancelled = true
      unlisten.then(fn => fn())
    }
  }, [])

  return focused
}

/**
 * Offers to remove the old per-machine (Program Files) install that the switch to per-user
 * installs leaves behind - see src-tauri/src/legacy_install/mod.rs for the whole picture. Windows
 * only in practice: the backend never reports a leftover install anywhere else, nor for a portable
 * or dev build.
 *
 * Shown at most once per launch. "Remind me later" brings it back next launch; "Don't show this
 * again" (settings.json) stops it for good. Neither path interrupts anything running - the cleanup
 * is a separate elevated process that never touches this copy or its automation.
 */
export const LegacyInstallPrompt = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const [status, setStatus] = useState<LegacyInstallStatus | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [handled, setHandled] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const windowFocused = useWindowFocused()

  const isUpdating = useUpdateStore(state => state.isUpdating)
  const initialCheckSettled = useUpdateStore(state => state.initialCheckSettled)
  const showChangelog = useUpdateStore(state => state.showChangelog)
  const outdatedPromptOpen = useVersionPolicyStore(
    state => state.status === 'outdated' && !state.outdatedDismissed,
  )
  const proModalOpen = useProModalStore(state => state.isOpen)
  const settingsOpen = useSettingsModalStore(state => state.isOpen)
  const addAccountOpen = useAddAccountModalStore(state => state.isOpen)
  const reauthOpen = useReauthModalStore(state => state.accountKey !== null)
  const steamWarningOpen = useSteamWarningStore(state => state.showSteamWarning)

  useEffect(() => {
    invoke<LegacyInstallStatus>('get_legacy_install_status')
      .then(setStatus)
      .catch(error =>
        logFrontendWarn(LOG_SOURCE, 'could not check for an old install', {
          error: String(error),
        }),
      )
  }, [])

  const shouldOpen =
    !!status?.detected &&
    !status.promptDismissed &&
    !handled &&
    canShowPrompt({
      isDashboard: router.pathname.startsWith('/dashboard'),
      isUpdating,
      initialCheckSettled,
      otherDialogOpen:
        showChangelog ||
        outdatedPromptOpen ||
        proModalOpen ||
        settingsOpen ||
        addAccountOpen ||
        reauthOpen ||
        steamWarningOpen,
      windowFocused,
    })

  useEffect(() => {
    if (shouldOpen && !isOpen) {
      logFrontendInfo(LOG_SOURCE, 'offering to remove the old install', {})
      setIsOpen(true)
    }
  }, [shouldOpen, isOpen])

  // Best-effort: failing to remember the choice only means the prompt can show again.
  const rememberDismissal = async () => {
    try {
      await invoke('dismiss_legacy_install_prompt')
    } catch (error) {
      logFrontendWarn(LOG_SOURCE, 'could not save "don\'t show again"', { error: String(error) })
    }
  }

  const close = () => {
    setIsOpen(false)
    setHandled(true)
  }

  const handleRemindLater = async () => {
    logFrontendInfo(LOG_SOURCE, 'user postponed removing the old install', { dontShowAgain })
    close()
    if (dontShowAgain) await rememberDismissal()
  }

  const handleContinue = async () => {
    logFrontendInfo(LOG_SOURCE, 'user chose to remove the old install', { dontShowAgain })
    setIsRemoving(true)
    let result: LegacyCleanupResult
    try {
      result = await invoke<LegacyCleanupResult>('remove_legacy_install')
    } catch (error) {
      logFrontendWarn(LOG_SOURCE, 'removing the old install failed', { error: String(error) })
      result = 'failed'
    }
    setIsRemoving(false)
    close()

    if (result === 'removed') {
      toast.success(t('legacyInstall.removed'))
    } else if (result === 'declined' || result === 'failed') {
      if (result === 'declined') toast.warning(t('legacyInstall.declined'))
      else toast.danger(t('legacyInstall.failed'))
      // The old copy is still there, so the tick still means "stop asking".
      if (dontShowAgain) await rememberDismissal()
    }
  }

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open && !isRemoving) handleRemindLater()
      }}
    >
      <AlertDialog.Backdrop isDismissable={false}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status='accent' />
              <AlertDialog.Heading>{t('legacyInstall.title')}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className='flex flex-col gap-4'>
              <p>{t('legacyInstall.description')}</p>
              <Checkbox isSelected={dontShowAgain} onChange={setDontShowAgain}>
                <Checkbox.Content>
                  <Checkbox.Control className='bg-field hover:bg-field-hover text-foreground'>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className='text-sm'>
                    {t('dashboard.cardFarming.presenceNotice.dontShowAgain')}
                  </span>
                </Checkbox.Content>
              </Checkbox>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant='secondary' isDisabled={isRemoving} onPress={handleRemindLater}>
                {t('versionPolicy.remindLater')}
              </Button>
              <Button isPending={isRemoving} onPress={handleContinue}>
                {t('legacyInstall.remove')}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
