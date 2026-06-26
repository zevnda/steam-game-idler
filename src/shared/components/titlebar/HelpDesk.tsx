import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'
import { cn } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CustomTooltip } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import { hasCasualAccess, isPortableCheck } from '@/shared/utils'

declare global {
  interface Window {
    $chatway: {
      openChatwayWidget: () => void
      closeChatwayWidget: () => void
      updateChatwayCustomData: (key: string, value: string) => void
    }
  }
}

export const HelpDesk = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const isSubscribed = useUserStore(state => state.isSubscribed)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)

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
    if (!isLoaded) return

    const widget = document.querySelector('.chatway--container')
    if (!widget) return

    const observer = new MutationObserver(() => {
      const isWidgetOpen = widget.classList.contains('widget--open')
      setIsOpen(isWidgetOpen)
    })

    observer.observe(widget, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [isLoaded])

  // Watch for unread messages
  useEffect(() => {
    if (!isLoaded) return

    const trigger = document.getElementById('chatway_widget_trigger')
    if (!trigger) return

    const checkUnread = () => {
      const unread = Number(trigger.getAttribute('data-unread-message') || '0')
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

  useEffect(() => {
    const setUserData = async () => {
      const version = await getVersion()
      const isPortable = await isPortableCheck()

      if (userSummary && typeof window !== 'undefined' && window.$chatway) {
        const licenseKey = localStorage.getItem('licenseKey') ?? 'N/A (legacy subscriber)'
        window.$chatway.updateChatwayCustomData(
          'name',
          `${userSummary?.personaName} (${userSummary?.steamId}, v${version}, ${subscriptionTier ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : 'Free'}, ${isPortable ? 'Portable' : 'Installer'}, ${licenseKey})`,
        )
      }
    }
    setUserData()
  }, [userSummary, userSettings, isSubscribed, subscriptionTier])

  const handleToggle = async () => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatway) return

    const version = await getVersion()
    const isPortable = await isPortableCheck()

    const widget = document.querySelector('.chatway--container')

    if (widget && widget.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
    } else {
      if (userSummary) {
        const licenseKey = localStorage.getItem('licenseKey') ?? 'N/A (legacy subscriber)'
        window.$chatway.updateChatwayCustomData(
          'name',
          `${userSummary?.personaName} (${userSummary?.steamId}, v${version}, ${subscriptionTier ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : 'Free'}, ${isPortable ? 'Portable' : 'Installer'}, ${licenseKey})`,
        )
      }
      window.$chatway.openChatwayWidget()
    }
    setHasUnread(false)
  }

  const handleClose = () => {
    if (!isLoaded || typeof window === 'undefined' || !window.$chatway) return
    const widget = document.querySelector('.chatway--container')
    if (widget && widget.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
      setIsOpen(false)
    }
  }

  if (!hasCasualAccess(subscriptionTier)) return null

  return (
    <div className='relative'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className='fixed inset-0 bg-black opacity-50 z-998'
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <div className='flex justify-center items-center'>
        <CustomTooltip content={t('common.helpDesk')}>
          <div
            className={cn(
              'flex justify-center items-center hover:bg-header-hover/10 h-12 w-12 px-2 ',
              'duration-150 cursor-pointer transition-colors',
              isOpen && 'text-primary',
            )}
            onClick={handleToggle}
          >
            <RiCustomerService2Line fontSize={18} className='text-content' />
            {hasUnread && (
              <span className='absolute top-2 right-3 h-2 w-2 rounded-full bg-danger z-10' />
            )}
          </div>
        </CustomTooltip>
      </div>
    </div>
  )
}
