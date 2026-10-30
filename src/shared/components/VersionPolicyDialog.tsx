import { check } from '@tauri-apps/plugin-updater'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertDialog, Button } from '@heroui/react'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { useVersionPolicyStore } from '@/shared/stores/versionPolicyStore'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { openExternalLink } from '@/shared/utils/links'
import { canAutoUpdateCheck, fetchLatest, performUpdate } from '@/shared/utils/update'

// GitHub's always-current redirect to the newest release's assets, so a portable/deb/rpm user can
// grab the matching file directly
const DOWNLOAD_URL = 'https://github.com/zevnda/steam-game-idler/releases/latest'

interface VersionPolicyDialogProps {
  // `unsupported` is the hard block: rendered alone by the `_app.tsx` gate, not dismissible, and
  // its only exits are updating or quitting. `outdated` is the dismissible pre-warning, rendered
  // inside the normal app.
  variant: 'outdated' | 'unsupported'
}

/**
 * The update prompt for a build the remote version policy has flagged (see `useVersionPolicy`).
 * "Install update" reuses the normal in-app update flow (`performUpdate`, which swaps in
 * `UpdateLoader` and relaunches). Builds that can't self-update (portable zip, Linux deb/rpm, dev)
 * get "Download update" instead, opening the latest GitHub release - as does any in-app update
 * attempt that fails or finds nothing to install, so the button never dead-ends.
 */
export const VersionPolicyDialog = ({ variant }: VersionPolicyDialogProps) => {
  const { t } = useTranslation()
  const setIsUpdating = useUpdateStore(state => state.setIsUpdating)
  const currentVersion = useVersionPolicyStore(state => state.currentVersion)
  const dismissOutdated = useVersionPolicyStore(state => state.dismissOutdated)
  const [canAutoUpdate, setCanAutoUpdate] = useState<boolean | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const isBlocking = variant === 'unsupported'

  useEffect(() => {
    canAutoUpdateCheck().then(setCanAutoUpdate)
  }, [])

  const handleUpdate = async () => {
    setIsBusy(true)
    logFrontendInfo('VersionPolicyDialog', 'user chose to update', {
      variant,
      canAutoUpdate,
      currentVersion,
    })
    try {
      // Re-resolved if the mount-time check hasn't landed yet, so an early click on an installed
      // build doesn't fall through to the download page
      if (canAutoUpdate ?? (await canAutoUpdateCheck())) {
        const update = await check()
        if (update) {
          const latest = await fetchLatest()
          await performUpdate(update, { major: !!latest?.major, setIsUpdating })
          return
        }
        logFrontendWarn(
          'VersionPolicyDialog',
          'no update available to install, opening download page instead',
          {
            currentVersion,
          },
        )
      }
    } catch (error) {
      setIsUpdating(false)
      logFrontendWarn(
        'VersionPolicyDialog',
        'in-app update failed, opening download page instead',
        {
          error: String(error),
        },
      )
    }
    await openExternalLink(DOWNLOAD_URL)
    setIsBusy(false)
  }

  const handleSecondary = () => {
    if (isBlocking) {
      logFrontendInfo('VersionPolicyDialog', 'user quit from the unsupported-version block', {
        currentVersion,
      })
      invoke('quit_app').catch(error =>
        logFrontendWarn('VersionPolicyDialog', 'quit failed', { error: String(error) }),
      )
    } else {
      logFrontendInfo('VersionPolicyDialog', 'user dismissed the outdated-version prompt', {
        currentVersion,
      })
      dismissOutdated()
    }
  }

  return (
    <AlertDialog
      isOpen
      onOpenChange={open => {
        if (!open && !isBlocking) handleSecondary()
      }}
    >
      <AlertDialog.Backdrop isDismissable={!isBlocking} isKeyboardDismissDisabled={isBlocking}>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status={isBlocking ? 'danger' : 'warning'} />
              <AlertDialog.Heading>
                {t(isBlocking ? 'versionPolicy.unsupported.title' : 'versionPolicy.outdated.title')}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                {t(
                  isBlocking
                    ? 'versionPolicy.unsupported.description'
                    : 'versionPolicy.outdated.description',
                )}
              </p>
              {currentVersion && (
                <p className='mt-2 text-sm text-muted'>
                  {t('versionPolicy.currentVersion', { version: currentVersion })}
                </p>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant='secondary' isDisabled={isBusy} onPress={handleSecondary}>
                {t(isBlocking ? 'tray.quit' : 'versionPolicy.remindLater')}
              </Button>
              <Button variant='primary' isPending={isBusy} onPress={handleUpdate}>
                {t(
                  canAutoUpdate === false
                    ? 'versionPolicy.downloadUpdate'
                    : 'versionPolicy.installUpdate',
                )}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
