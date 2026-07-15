import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@heroui/react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSteamWarningStore } from '@/shared/stores/steamWarningStore'
import { invoke } from '@/shared/utils/invoke'

// Hardcoded dev-account bypass, unchanged from `main` - known dev/test Steam IDs that should never
// see this modal, even outside a debug build.
const DEV_ACCOUNT_STEAM_IDS = ['76561198158912649', '76561198999797359']

const STEAM_RUNNING_POLL_INTERVAL_MS = 1000

// Mounted once in DashboardShell alongside `useSteamMonitor` (which sets `showSteamWarning` when
// the backend detects the local Steam client has closed mid-session). Blocking, undismissable -
// CLI-mode automations genuinely can't function without a real local Steam client, so this isn't
// optional/dismissable UI. Polls `is_steam_running` itself once open, independent of the backend's
// push event, so recovery is detected even if that event was somehow missed - mirrors `main`'s
// SteamWarning.tsx exactly.
export const SteamWarning = () => {
  const { t } = useTranslation()
  const showSteamWarning = useSteamWarningStore(state => state.showSteamWarning)
  const setShowSteamWarning = useSteamWarningStore(state => state.setShowSteamWarning)
  const accounts = useSessionStore(state => state.accounts)
  const [isOpen, setIsOpen] = useState(false)

  const localSteamId =
    Object.values(accounts).find(account => account.mode === 'local')?.steamId ?? null

  useEffect(() => {
    if (!showSteamWarning) return
    let cancelled = false

    invoke<boolean>('is_dev')
      .then(isDev => {
        if (cancelled) return
        const isDevAccount = localSteamId ? DEV_ACCOUNT_STEAM_IDS.includes(localSteamId) : false
        if (!isDev && !isDevAccount) setIsOpen(true)
      })
      .catch(error => {
        console.error('Error in (is_dev):', error)
        // Fails open (shows the warning) - a dev-tooling check failing shouldn't hide a real,
        // user-facing signal that CLI-mode automations just stopped.
        setIsOpen(true)
      })

    return () => {
      cancelled = true
    }
  }, [showSteamWarning, localSteamId])

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(async () => {
      try {
        if (await invoke<boolean>('is_steam_running')) {
          clearInterval(interval)
          setShowSteamWarning(false)
          setIsOpen(false)
        }
      } catch (error) {
        console.error('Error in (is_steam_running):', error)
      }
    }, STEAM_RUNNING_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isOpen, setShowSteamWarning])

  const handleLaunchSteam = () => {
    invoke('launch_steam').catch(error => {
      console.error('Error in (launch_steam):', error)
    })
  }

  return (
    <Modal isOpen={isOpen}>
      <Modal.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <Modal.Container size='sm'>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{t('common.steamWarning.title')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>{t('common.steamWarning.description')}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={handleLaunchSteam}>{t('common.actions.continue')}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
