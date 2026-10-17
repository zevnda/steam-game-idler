import type { TranslationKey } from '@/i18n'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebugSettings } from '../hooks/useDebugSettings'
import { AlertDialog, Button, ProgressBar, Typography } from '@heroui/react'
import { useSessionStore } from '@/shared/stores/sessionStore'

type LibraryRunDirection = 'lock' | 'unlock'

// Per-direction copy for the library-wide lock/unlock buttons and their one shared confirmation
// dialog.
const LIBRARY_RUN_KEYS: Record<
  LibraryRunDirection,
  { button: TranslationKey; confirmTitle: TranslationKey; confirmDescription: TranslationKey }
> = {
  lock: {
    button: 'dashboard.settings.debug.lockAllAchievements.button',
    confirmTitle: 'dashboard.settings.debug.lockAllAchievements.confirmTitle',
    confirmDescription: 'dashboard.settings.debug.lockAllAchievements.confirmDescription',
  },
  unlock: {
    button: 'dashboard.settings.debug.unlockAllAchievements.button',
    confirmTitle: 'dashboard.settings.debug.unlockAllAchievements.confirmTitle',
    confirmDescription: 'dashboard.settings.debug.unlockAllAchievements.confirmDescription',
  },
}

interface DebugSettingsTabProps {
  // Re-fetch callbacks from SettingsModal's own General/Achievement Unlocker/Inventory Manager/
  // Card Farming/Ownership hook instances - see useDebugSettings.ts's doc comment for why
  // `resetSettings` needs these rather than fetching its own independent copies.
  refreshGeneralSettings: () => void
  refreshAchievementUnlockerSettings: () => void
  refreshInventorySettings: () => void
  refreshCardFarmingSettings: () => void
  refreshFreeGamesSettings: () => void
  refreshOwnershipSettings: () => void
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
  refreshOwnershipSettings,
}: DebugSettingsTabProps) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const [openDialog, setOpenDialog] = useState<
    'reset' | 'clearData' | 'lockAllAchievements' | 'unlockAllAchievements' | null
  >(null)
  const closeDialog = () => setOpenDialog(null)
  const libraryRunDialog: LibraryRunDirection | null =
    openDialog === 'lockAllAchievements'
      ? 'lock'
      : openDialog === 'unlockAllAchievements'
        ? 'unlock'
        : null

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
    libraryRun,
    libraryRunProgress,
    viewLogFile,
    viewSettingsFile,
    clearLogs,
    exportSettings,
    resetSettings,
    clearData,
    setAllAchievements,
  } = useDebugSettings({
    account,
    refreshGeneralSettings,
    refreshAchievementUnlockerSettings,
    refreshInventorySettings,
    refreshCardFarmingSettings,
    refreshFreeGamesSettings,
    refreshOwnershipSettings,
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

      {/* Safe, read-only actions on the left; anything that deletes or changes data (danger
          variant) grouped on the right, so the two kinds can't be mistaken for each other. */}
      <div className='flex flex-wrap items-start justify-between gap-2'>
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
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button isPending={isClearingLogs} size='sm' variant='danger' onPress={clearLogs}>
            {t('dashboard.settings.debug.logs.clear')}
          </Button>
          <Button size='sm' variant='danger' onPress={() => setOpenDialog('reset')}>
            {t('dashboard.settings.debug.resetSettings.button')}
          </Button>
          <Button size='sm' variant='danger' onPress={() => setOpenDialog('clearData')}>
            {t('dashboard.settings.debug.clearData.button')}
          </Button>
          {/* Natively disabled with no account signed in - a genuine "nothing to act on" state,
              not a tier gate. No running state needed here: the confirmation dialog stays open
              (and modal) for the whole run. */}
          <Button
            isDisabled={!account}
            size='sm'
            variant='danger'
            onPress={() => setOpenDialog('lockAllAchievements')}
          >
            {t(LIBRARY_RUN_KEYS.lock.button)}
          </Button>
          <Button
            isDisabled={!account}
            size='sm'
            variant='danger'
            onPress={() => setOpenDialog('unlockAllAchievements')}
          >
            {t(LIBRARY_RUN_KEYS.unlock.button)}
          </Button>
        </div>
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

      {/* Can't be dismissed (Escape, Cancel, or onOpenChange) while a run is in flight - keeps the
          user from wandering off into features that touch the same achievements (or switching
          account) mid-run, and gives the live progress somewhere to stay visible. */}
      <AlertDialog
        isOpen={libraryRunDialog !== null}
        onOpenChange={open => !open && !libraryRun && closeDialog()}
      >
        <AlertDialog.Backdrop isKeyboardDismissDisabled={libraryRun !== null}>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              {libraryRunDialog && (
                <>
                  <AlertDialog.Header>
                    <AlertDialog.Heading>
                      {t(LIBRARY_RUN_KEYS[libraryRunDialog].confirmTitle)}
                    </AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    {/* Once running, the progress replaces the confirmation text - it's already
                        been read and acted on, and the progress is what matters now. */}
                    {libraryRun ? (
                      <div className='flex flex-col gap-2'>
                        {/* Indeterminate until the backend's initial 0-of-N event arrives. */}
                        <ProgressBar
                          aria-label={t('dashboard.settings.debug.allAchievementsRun.running')}
                          isIndeterminate={!libraryRunProgress}
                          maxValue={Math.max(libraryRunProgress?.total ?? 0, 1)}
                          minValue={0}
                          value={libraryRunProgress?.completed ?? 0}
                        >
                          <ProgressBar.Track>
                            <ProgressBar.Fill />
                          </ProgressBar.Track>
                        </ProgressBar>
                        <Typography color='muted' type='body-xs'>
                          {libraryRunProgress
                            ? t('dashboard.settings.debug.allAchievementsRun.progress', {
                                completed: libraryRunProgress.completed,
                                total: libraryRunProgress.total,
                                achievements: libraryRunProgress.achievementsChanged,
                              })
                            : t('dashboard.settings.debug.allAchievementsRun.running')}
                        </Typography>
                      </div>
                    ) : (
                      t(LIBRARY_RUN_KEYS[libraryRunDialog].confirmDescription)
                    )}
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button
                      isDisabled={libraryRun !== null}
                      variant='secondary'
                      onPress={closeDialog}
                    >
                      {t('common.actions.cancel')}
                    </Button>
                    <Button
                      isPending={libraryRun !== null}
                      variant='danger'
                      onPress={async () => {
                        await setAllAchievements(libraryRunDialog === 'unlock')
                        closeDialog()
                      }}
                    >
                      {t(LIBRARY_RUN_KEYS[libraryRunDialog].button)}
                    </Button>
                  </AlertDialog.Footer>
                </>
              )}
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
