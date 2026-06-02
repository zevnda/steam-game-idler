import type { Game, InvokeKillProcess } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { startIdle } from './coreIdleService'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'

export async function handleIdle(item: Game) {
  try {
    const success = await startIdle(item.appid, item.name, true)
    if (success) {
      toast.success(i18next.t('toast.startIdle.success', { appName: item.name, appId: item.appid }))
    } else {
      toast.danger(i18next.t('toast.startIdle.error', { appName: item.name, appId: item.appid }))
    }
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in handleIdle:', error)
    await logEvent(`Error in (handleIdle): ${error}`)
  }
}

export async function handleStopIdle(
  item: Game,
  idleGamesList: Game[],
  setIdleGamesList: (value: Game[]) => void,
) {
  const game = idleGamesList.find(g => g.appid === item.appid)
  try {
    const res = await invoke<InvokeKillProcess>('kill_process_by_pid', { pid: game?.pid })
    if (res.success) {
      setIdleGamesList(idleGamesList.filter(g => g.pid !== item.pid))
      toast.success(i18next.t('toast.stopIdle.success', { appName: item.name, appId: item.appid }))
    } else {
      toast.danger(i18next.t('toast.stopIdle.error', { appName: item.name, appId: item.appid }))
    }
  } catch (error) {
    toast.danger(i18next.t('common.error'))
    console.error('Error in handleStopIdle:', error)
    await logEvent(`Error in (handleStopIdle): ${error}`)
  }
}
