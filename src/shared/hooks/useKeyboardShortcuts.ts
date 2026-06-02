import type { ActivePageType } from '@/shared/types'
import { useCallback, useEffect } from 'react'
import { useSessionStore, useUiStore } from '@/shared/stores'
import { SIDEBAR_PAGES } from '@/shared/utils'

export function useKeyboardShortcuts() {
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      return

    const {
      activePage,
      previousActivePage,
      setActivePage,
      setPreviousActivePage,
      setCurrentSettingsTab,
      setShowSearchModal,
      sidebarCollapsed,
      setSidebarCollapsed,
      setTransitionDuration,
      setSelectedGame,
      setAchievementOrderGame,
    } = useUiStore.getState()

    const { isCardFarming, isAchievementUnlocker } = useSessionStore.getState()

    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      if (activePage === 'idling' || activePage === 'freeGames') return
      e.preventDefault()
      setShowSearchModal(true)
      return
    }

    if (!e.ctrlKey && !e.metaKey) return

    const effectivePage = activePage === 'settings' ? previousActivePage : activePage

    if (e.key === ']') {
      e.preventDefault()
      const idx = SIDEBAR_PAGES.indexOf(effectivePage as ActivePageType)
      setActivePage(SIDEBAR_PAGES[idx === -1 ? 0 : (idx + 1) % SIDEBAR_PAGES.length])
    } else if (e.key === '[') {
      e.preventDefault()
      const idx = SIDEBAR_PAGES.indexOf(effectivePage as ActivePageType)
      setActivePage(
        SIDEBAR_PAGES[idx === -1 ? 0 : (idx - 1 + SIDEBAR_PAGES.length) % SIDEBAR_PAGES.length],
      )
    } else if (e.key === ',') {
      e.preventDefault()
      if (isCardFarming || isAchievementUnlocker) return
      if (activePage === 'settings') {
        setActivePage(previousActivePage)
        setCurrentSettingsTab('general')
        setPreviousActivePage('games')
      } else {
        setSelectedGame(null)
        setAchievementOrderGame(null)
        setPreviousActivePage(activePage)
        setActivePage('settings')
      }
    } else if ((e.key === 'w' || e.key === 'W') && !e.shiftKey) {
      e.preventDefault()
      setTransitionDuration('300ms')
      setSidebarCollapsed(!sidebarCollapsed)
      localStorage.setItem('sidebarCollapsed', String(!sidebarCollapsed))
      setTimeout(() => setTransitionDuration('0ms'), 100)
    } else if ((e.key === 'h' || e.key === 'H') && e.shiftKey) {
      e.preventDefault()
      if (
        typeof window !== 'undefined' &&
        (
          window as Window & {
            $chatway?: { openChatwayWidget: () => void; closeChatwayWidget: () => void }
          }
        ).$chatway
      ) {
        const widget = document.querySelector('.chatway--container')
        if (widget?.classList.contains('widget--open')) {
          ;(
            window as Window & {
              $chatway?: { openChatwayWidget: () => void; closeChatwayWidget: () => void }
            }
          ).$chatway.closeChatwayWidget()
        } else {
          ;(
            window as Window & {
              $chatway?: { openChatwayWidget: () => void; closeChatwayWidget: () => void }
            }
          ).$chatway.openChatwayWidget()
        }
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])
}
