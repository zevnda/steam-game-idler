import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'

import { useUserContext } from '@/components/contexts/UserContext'
import CustomTooltip from '@/components/ui/CustomTooltip'

declare const $chatway: {
  updateChatwayCustomData: (key: string, value: string) => void
  openChatwayWidget: () => void
  closeChatwayWidget: () => void
}

export default function HelpDesk(): ReactElement | null {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { userSummary } = useUserContext()

  // Check if widget is loaded
  useEffect(() => {
    const interval = setInterval(() => {
      const widget = document.querySelector('.chatway--container.has-loaded')
      if (widget) {
        setIsLoaded(true)

        $chatway.updateChatwayCustomData('name', `${userSummary?.personaName} (${userSummary?.steamId})` || 'Guest')
        $chatway.updateChatwayCustomData('profile', `https://steamcommunity.com/profiles/${userSummary?.steamId}`)

        clearInterval(interval)
      }
    }, 300)
    return () => clearInterval(interval)
  }, [userSummary])

  useEffect(() => {
    if (!isLoaded) return

    const widget = document.querySelector('.chatway--container')
    if (!widget) return

    const observer = new MutationObserver(() => {
      if (!widget.classList.contains('widget--open')) {
        setIsOpen(false)
      }
    })

    observer.observe(widget, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [isLoaded])

  const handleToggle = () => {
    if (!isLoaded) return

    const widget = document.querySelector('.chatway--container')

    if (widget && widget.classList.contains('widget--open')) {
      $chatway.closeChatwayWidget()
    } else {
      $chatway.openChatwayWidget()
    }
    setIsOpen(prev => !prev)
  }

  const handleClose = () => {
    if (!isLoaded) return
    const widget = document.querySelector('.chatway--container')
    if (widget && widget.classList.contains('widget--open')) {
      $chatway.closeChatwayWidget()
      setIsOpen(false)
    }
  }

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
              'flex justify-center items-center',
              'hover:bg-header-hover/10 h-9 w-12 px-2 duration-150 cursor-pointer',
              'hover:text-white transition-colors',
              isOpen && 'text-primary',
            )}
            onClick={handleToggle}
          >
            <RiCustomerService2Line fontSize={18} className='text-content' />
          </div>
        </CustomTooltip>
      </div>
    </div>
  )
}
