import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebugSettings } from '../hooks/useDebugSettings'
import { AlertDialog, Button, Typography } from '@heroui/react'
import { useSessionStore } from '@/shared/stores/sessionStore'

interface DebugSettingsTabProps {
  // Re-fetch callbacks from SettingsModal's own General/Achievement Unlocker/Inventory Manager/
  // Card Farming hook instances - see useDebugSettings.ts's doc comment for why `resetSettings`
  // needs these rather than fetching its own independent copies.
  refreshGeneralSettings: () => void
  refreshAchievementUnlockerSettings: () => void
  refreshInventorySettings: () => void
  refreshCardFarmingSettings: () => void
  refreshFreeGamesSettings: () => void
}

// The Debug tab of the (app-wide) SettingsModal - see useDebugSettings.ts's doc comment for the
// full rationale behind each action's shape. Deliberately not a load-then-edit tab like
// AchievementUnlockerSettingsTab/InventorySettingsTab (there's no persisted draft to edit here) -
// every row is a standalone action with its own pending state and toast feedback, closer to
// InventoryPageHeader's action-button + AlertDialog-confirmation shape than to a settings form.
export const DebugSettingsTab = ({
  refreshGeneralSettings,
  refreshAchievementUnlockerSettings,
  refreshInventorySettings,
  refreshCardFarmingSettings,
  refreshFreeGamesSettings,
}: DebugSettingsTabProps) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const [openDialog, setOpenDialog] = useState<'reset' | 'clearData' | null>(null)
  const closeDialog = () => setOpenDialog(null)

  const {
    logLines,
    logsErrorCode,
    isClearingLogs,
    systemInfo,
    isPortable,
    appVersion,
    isExporting,
    isResetting,
    isClearingData,
    isViewingLogFile,
    isViewingSettingsFile,
    viewLogFile,
    viewSettingsFile,
    clearLogs,
    exportSettings,
    resetSettings,
    clearData,
  } = useDebugSettings({
    account,
    refreshGeneralSettings,
    refreshAchievementUnlockerSettings,
    refreshInventorySettings,
    refreshCardFarmingSettings,
    refreshFreeGamesSettings,
  })

  // Raw tracing lines have no id of their own, and can legitimately repeat (e.g. the same warning
  // logged twice in a row) - a running per-line occurrence count keeps each React key stable and
  // unique without falling back to the array index react/no-array-index-key disallows.
  const seenLineCounts = new Map<string, number>()
  const logLinesWithKeys = logLines.map(line => {
    const occurrence = (seenLineCounts.get(line) ?? 0) + 1
    seenLineCounts.set(line, occurrence)
    return { key: `${line}::${occurrence}`, line }
  })

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.settings.debug.title')}
      </Typography>

      {systemInfo && appVersion && isPortable !== null && (
        <Typography color='muted' type='body-xs'>
          {t('dashboard.settings.footer.version', { version: appVersion })}
          {' · '}
          {t('dashboard.settings.debug.system.os', {
            osVersion: systemInfo.osVersion,
            arch: systemInfo.arch,
          })}
          {' · '}
          {t(
            isPortable
              ? 'dashboard.settings.debug.system.portable'
              : 'dashboard.settings.debug.system.installed',
          )}
        </Typography>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        <Button isPending={isViewingLogFile} size='sm' variant='secondary' onPress={viewLogFile}>
          {t('dashboard.settings.debug.logs.viewFile')}
        </Button>
        <Button
          isPending={isViewingSettingsFile}
          size='sm'
          variant='secondary'
          onPress={viewSettingsFile}
        >
          {t('dashboard.settings.debug.settingsFile.viewFile')}
        </Button>
        <Button isPending={isExporting} size='sm' variant='secondary' onPress={exportSettings}>
          {t('dashboard.settings.debug.exportSettings.button')}
        </Button>
        <Button isPending={isClearingLogs} size='sm' variant='secondary' onPress={clearLogs}>
          {t('dashboard.settings.debug.logs.clear')}
        </Button>
        <Button size='sm' variant='danger' onPress={() => setOpenDialog('reset')}>
          {t('dashboard.settings.debug.resetSettings.button')}
        </Button>
        <Button size='sm' variant='danger' onPress={() => setOpenDialog('clearData')}>
          {t('dashboard.settings.debug.clearData.button')}
        </Button>
      </div>

      <div className='flex min-h-0 flex-1 flex-col rounded-lg border border-border'>
        <Typography className='border-b border-border px-4 py-2' color='muted' type='body-xs'>
          {t('dashboard.settings.debug.logs.description')}
        </Typography>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {logsErrorCode ? (
            <div className='flex h-full items-center justify-center p-4'>
              <Typography color='muted' type='body-sm'>
                {logsErrorCode}
              </Typography>
            </div>
          ) : logLines.length > 0 ? (
            <div className='divide-y divide-border/50 select-text'>
              {logLinesWithKeys.map(({ key, line }) => (
                <div className='px-4 py-1.5' key={key}>
                  <Typography
                    className={
                      /\bERROR\b/.test(line)
                        ? 'break-all font-mono text-danger'
                        : 'break-all font-mono'
                    }
                    color={/\bERROR\b/.test(line) ? undefined : 'muted'}
                    type='body-xs'
                  >
                    {line}
                  </Typography>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex h-full items-center justify-center'>
              <Typography color='muted' type='body-sm'>
                {t('dashboard.settings.debug.logs.empty')}
              </Typography>
            </div>
          )}
        </div>
      </div>

      <AlertDialog isOpen={openDialog === 'reset'} onOpenChange={open => !open && closeDialog()}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.settings.debug.resetSettings.confirmTitle')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.settings.debug.resetSettings.confirmDescription')}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button isDisabled={isResetting} variant='secondary' onPress={closeDialog}>
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  isPending={isResetting}
                  variant='danger'
                  onPress={async () => {
                    await resetSettings()
                    closeDialog()
                  }}
                >
                  {t('dashboard.settings.debug.resetSettings.button')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <AlertDialog
        isOpen={openDialog === 'clearData'}
        onOpenChange={open => !open && closeDialog()}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.settings.debug.clearData.confirmTitle')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.settings.debug.clearData.confirmDescription')}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button isDisabled={isClearingData} variant='secondary' onPress={closeDialog}>
                  {t('common.actions.cancel')}
                </Button>
                <Button isPending={isClearingData} variant='danger' onPress={clearData}>
                  {t('dashboard.settings.debug.clearData.button')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
