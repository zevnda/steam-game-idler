import { getVersion } from '@tauri-apps/api/app'
import { useCallback, useEffect, useState } from 'react'
// import { getRuntimeConfig } from '../../../config'
import { useUserStore } from '../../../stores'

export function useHelpDesk() {
  // const { isPortable } = getRuntimeConfig()
  const isPortable = false // Placeholder until getRuntimeConfig is available
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const userSummary = useUserStore(state => state.userSummary)
  const isPro = useUserStore(state => state.isPro)

  // If it's the user's first time using SGI, show an overlay
  useEffect(() => {
    const isFirstTimeUser = localStorage.getItem('isFirstTimeUser')
    if (isFirstTimeUser === null) {
      setTimeout(() => {
        setShowGuide(true)
        localStorage.setItem('isFirstTimeUser', 'false')
      }, 1500)
    }
  }, [])

  // Check if widget is loaded
  useEffect(() => {
    const interval = setInterval(() => {
      const widget = document.querySelector('.chatway--container.has-loaded')
      if (widget) {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }, 300)
    return () => clearInterval(interval)
  }, [])

  // Watch for widget open/close
  useEffect(() => {
    if (!isLoaded) return undefined
    const widget = document.querySelector('.chatway--container')
    if (!widget) return undefined
    const observer = new MutationObserver(() => {
      if (!widget.classList.contains('widget--open')) {
        setIsOpen(false)
      }
    })
    observer.observe(widget, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [isLoaded])

  // Watch for unread messages
  useEffect(() => {
    if (!isLoaded) return undefined
    const trigger = document.getElementById('chatway_widget_trigger')
    if (!trigger) return undefined
    const checkUnread = () => {
      const unread = Number(trigger.getAttribute('data-unread-message') ?? '0')
      setHasUnread(unread > 0)
    }
    checkUnread()
    const observer = new MutationObserver(() => {
      checkUnread()
    })
    observer.observe(trigger, {
      attributes: true,
      attributeFilter: ['data-unread-message', 'class'],
    })
    return () => observer.disconnect()
  }, [isLoaded])

  // Set user data for chatway
  useEffect(() => {
    const setUserData = async () => {
      const version = await getVersion()
      if (userSummary && typeof window !== 'undefined' && window.$chatway) {
        window.$chatway.updateChatwayCustomData(
          'name',
          `${userSummary?.personaName} (${userSummary?.steamId}, v${version}, ${isPro ? 'PRO' : 'Free'}, ${isPortable ? 'Portable' : 'Installer'})`,
        )
      }
    }
    setUserData()
  }, [userSummary, isPro, isPortable])

  const handleToggle = useCallback(async () => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatway) return
    const version = await getVersion()
    const widget = document.querySelector('.chatway--container')
    if (widget?.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
    } else {
      if (userSummary) {
        window.$chatway.updateChatwayCustomData(
          'name',
          `${userSummary?.personaName} (${userSummary?.steamId}, v${version}, ${isPro ? 'PRO' : 'Free'}, ${isPortable ? 'Portable' : 'Installer'})`,
        )
      }
      window.$chatway.openChatwayWidget()
    }
    setIsOpen(prev => !prev)
    setHasUnread(false)
  }, [isLoaded, userSummary, isPro, isPortable])

  const handleClose = useCallback(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatway) return
    const widget = document.querySelector('.chatway--container')
    if (widget?.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
      setIsOpen(false)
    }
  }, [isLoaded])

  return {
    isOpen,
    showGuide,
    hasUnread,
    handleToggle,
    handleClose,
    setShowGuide,
  }
}
