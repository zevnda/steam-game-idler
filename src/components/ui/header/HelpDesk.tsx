import type { ReactElement } from 'react'

import { Button, cn } from '@heroui/react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'

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
  const [showGuide, setShowGuide] = useState(false)
  const { userSummary } = useUserContext()

  // If it's the user's first time using SGI, show an overlay
  // that directs them to the help desk
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
    <>
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
          {/* Pulsing highlight for focus guide */}
          {showGuide && (
            <span className='absolute z-1001 -top-2 left-1/2 -translate-x-1/2 pointer-events-none'>
              <span className='block h-12 w-12 rounded-full bg-primary/30 animate-pulse ring-4 ring-primary/40' />
            </span>
          )}
          <CustomTooltip content={t('common.helpDesk')}>
            <div
              className={cn(
                'flex justify-center items-center',
                'hover:bg-header-hover/10 h-9 w-12 px-2 duration-150 cursor-pointer',
                'hover:text-white transition-colors',
                isOpen && 'text-primary',
                showGuide && 'z-1002 relative',
              )}
              onClick={handleToggle}
            >
              <RiCustomerService2Line fontSize={18} className='text-content' />
            </div>
          </CustomTooltip>
        </div>
      </div>

      {/* Focus Guide Overlay */}
      {showGuide && (
        <>
          {/* Dim background */}
          <div className='fixed inset-0 bg-black/60 z-1000 pointer-events-auto' onClick={() => setShowGuide(false)} />
          {/* Floating card with arrow */}
          <div className='fixed top-13 right-36 z-1002 flex flex-col items-end'>
            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className='relative w-[540px] bg-sidebar/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-border text-content'
            >
              <p className='leading-relaxed text-sm mr-6'>
                It looks like it&apos;s your first time here. If you need help with anything, just click the{' '}
                <span className='inline-flex align-middle text-dynamic'>
                  <RiCustomerService2Line size={20} className='mx-1 inline-' />
                </span>{' '}
                in the top-right corner to chat with us.
              </p>

              <Button
                isIconOnly
                radius='full'
                className='absolute -top-2 right-1 bg-transparent hover:bg-item-hover text-black font-semibold mt-3'
                startContent={<TbX size={18} color='white' />}
                onPress={() => setShowGuide(false)}
              />
            </motion.div>
          </div>
        </>
      )}
    </>
  )
}
