import type { SortStyleValue } from '@/shared/types'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/components'
import { logEvent } from '@/shared/utils'

export const handleSortingChange = (
  currentKey: string | undefined,
  setSortStyle: React.Dispatch<React.SetStateAction<SortStyleValue>>,
) => {
  try {
    if (!currentKey) return
    // Save the selected sort style to localStorage and update state
    localStorage.setItem('sortStyle', currentKey)
    setSortStyle(currentKey)
  } catch (error) {
    showDangerToast(i18next.t('common.error'))
    console.error('Error in (handleSorting):', error)
    logEvent(`[Error] in (handleSorting): ${error}`)
  }
}
