import type { PresenceSettings } from '@/features/settings/types'
import type { CardFarmingSettings } from '../types'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertDialog, Button, Checkbox, toast } from '@heroui/react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

const LOG_SOURCE = 'CardFarmingPresenceNotice'

// GitHub issue #2096: card farming starts and switches games, and while an agent-mode account's
// status is Online each new game can send friends a "now playing" notification. Online stays the
// default status on purpose (someone who just signed in with Steam expects to show as online), so
// instead the option to appear offline is offered at the moment it matters: when the user presses
// Start. Only for a manual Start press - automatic starts (Trading Card Monitor, a finished task's
// "next task") run unattended and never block on a dialog.
//
// Wraps `start` rather than living inside useCardFarming so the dialog stays a page concern and the
// hook keeps one job. Agent mode only: CLI mode has no status setting (its local Steam client owns
// presence). Shown only while the status is exactly Online and the user hasn't ticked "Don't show
// this again" (`CardFarmingSettings::presence_notice_seen`, per account).
export const useCardFarmingPresenceNotice = (start: () => Promise<void>) => {
  const account = useSessionStore(state => state.account)
  const [presence, setPresence] = useState<PresenceSettings | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // Both settings are read fresh on every press rather than cached: either can change in the
  // Settings modal while this page stays mounted underneath it. A failed read never blocks
  // farming - it just skips the notice.
  const requestStart = useCallback(async () => {
    if (account?.mode !== 'agent') {
      await start()
      return
    }
    try {
      const [farming, currentPresence] = await Promise.all([
        invoke<CardFarmingSettings>('get_card_farming_settings', { account }),
        invoke<PresenceSettings>('agent_get_presence_settings', { username: account.username }),
      ])
      if (farming.presenceNoticeSeen || currentPresence.personaState !== 'Online') {
        await start()
        return
      }
      setPresence(currentPresence)
      setDontShowAgain(false)
      setIsOpen(true)
    } catch (error) {
      logFrontendWarn(LOG_SOURCE, 'could not read settings for the presence notice, skipping it', {
        error: String(error),
      })
      await start()
    }
  }, [account, start])

  // Read-modify-write of the whole settings struct, the same shape CardFarmingSettingsTab saves.
  // Best-effort: failing to remember the choice only means the notice can show again.
  const rememberDismissal = useCallback(async () => {
    if (!account) return
    try {
      const current = await invoke<CardFarmingSettings>('get_card_farming_settings', { account })
      await invoke('set_card_farming_settings', {
        account,
        settings: { ...current, presenceNoticeSeen: true },
      })
    } catch (error) {
      logFrontendWarn(LOG_SOURCE, 'could not save "don\'t show again" for the presence notice', {
        error: String(error),
      })
    }
  }, [account])

  return {
    account,
    presence,
    isOpen,
    dontShowAgain,
    isApplying,
    setDontShowAgain,
    setIsApplying,
    setIsOpen,
    rememberDismissal,
    requestStart,
    start,
  }
}

type PresenceNoticeState = ReturnType<typeof useCardFarmingPresenceNotice>

export const CardFarmingPresenceNotice = ({ notice }: { notice: PresenceNoticeState }) => {
  const { t } = useTranslation()
  const {
    account,
    presence,
    isOpen,
    dontShowAgain,
    isApplying,
    setDontShowAgain,
    setIsApplying,
    setIsOpen,
    rememberDismissal,
    start,
  } = notice

  // Both buttons start farming - the user already pressed Start, so the notice only decides how,
  // never whether. Closing it (X/Escape) is the one way to back out without starting.
  const finish = async (appearOffline: boolean) => {
    if (account?.mode !== 'agent') return
    setIsApplying(true)
    if (appearOffline && presence) {
      try {
        // The same save the Settings > General status picker makes, so the change is persisted for
        // this account and applied live to the signed-in session straight away.
        await invoke('agent_set_presence_settings', {
          username: account.username,
          settings: { ...presence, personaState: 'Offline' },
        })
      } catch (error) {
        console.error('Error in (agent_set_presence_settings):', error)
        // A status problem shouldn't stop the farm the user asked for.
        toast.danger(t('dashboard.cardFarming.presenceNotice.offlineFailed'))
      }
    }
    if (dontShowAgain) await rememberDismissal()
    logFrontendInfo(LOG_SOURCE, 'presence notice answered', { appearOffline, dontShowAgain })
    setIsApplying(false)
    setIsOpen(false)
    await start()
  }

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={open => !isApplying && setIsOpen(open)}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>
                {t('dashboard.cardFarming.presenceNotice.title')}
              </AlertDialog.Heading>
              <AlertDialog.CloseTrigger />
            </AlertDialog.Header>
            <AlertDialog.Body className='flex flex-col gap-4'>
              <p>{t('dashboard.cardFarming.presenceNotice.description')}</p>
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
              <Button isDisabled={isApplying} variant='secondary' onPress={() => finish(false)}>
                {t('dashboard.cardFarming.presenceNotice.stayOnline')}
              </Button>
              <Button isPending={isApplying} onPress={() => finish(true)}>
                {t('dashboard.cardFarming.presenceNotice.appearOffline')}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
