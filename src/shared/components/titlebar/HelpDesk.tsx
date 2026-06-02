import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CustomTooltip } from '@/shared/components/CustomTooltip'
import { useUserStore } from '@/shared/stores'
import { isPortableCheck } from '@/shared/utils'

declare global {
  interface Window {
    $chatway: {
      openChatwayWidget: () => void
      closeChatwayWidget: () => void
      updateChatwayCustomData: (key: string, value: string) => void
    }
  }
}

export function HelpDesk() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const isPro = useUserStore(s => s.isPro)
  const proTier = useUserStore(s => s.proTier)

  useEffect(() => {
    const isFirst = localStorage.getItem('isFirstTimeUser')
    if (isFirst === null) {
      setTimeout(() => {
        setShowGuide(true)
        localStorage.setItem('isFirstTimeUser', 'false')
      }, 1500)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const widget = document.querySelector('.chatway--container.has-loaded')
      if (widget) {
        setIsLoaded(true)
        clearInterval(id)
      }
    }, 300)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const widget = document.querySelector('.chatway--container')
    if (!widget) return
    const obs = new MutationObserver(() => setIsOpen(widget.classList.contains('widget--open')))
    obs.observe(widget, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    const trigger = document.getElementById('chatway_widget_trigger')
    if (!trigger) return
    const check = () => setHasUnread(Number(trigger.getAttribute('data-unread-message') || '0') > 0)
    check()
    const obs = new MutationObserver(check)
    obs.observe(trigger, { attributes: true, attributeFilter: ['data-unread-message', 'class'] })
    return () => obs.disconnect()
  }, [isLoaded])

  useEffect(() => {
    const update = async () => {
      const version = await getVersion()
      const isPortable = await isPortableCheck()
      if (userSummary && window.$chatway) {
        window.$chatway.updateChatwayCustomData(
          'name',
          `${userSummary?.personaName} (${userSummary?.steamId}, v${version}, ${proTier ? proTier.charAt(0).toUpperCase() + proTier.slice(1) : 'Free'}, ${isPortable ? 'Portable' : 'Installer'})`,
        )
      }
    }
    update()
  }, [userSummary, userSettings, isPro, proTier])

  const handleToggle = async () => {
    if (!isLoaded || !window.$chatway) return
    const version = await getVersion()
    const isPortable = await isPortableCheck()
    const widget = document.querySelector('.chatway--container')
    if (widget?.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
    } else {
      if (userSummary) {
        window.$chatway.updateChatwayCustomData(
          'name',
          `${userSummary?.personaName} (${userSummary?.steamId}, v${version}, ${proTier ? proTier.charAt(0).toUpperCase() + proTier.slice(1) : 'Free'}, ${isPortable ? 'Portable' : 'Installer'})`,
        )
      }
      window.$chatway.openChatwayWidget()
    }
    setHasUnread(false)
  }

  const handleClose = () => {
    if (!isLoaded || !window.$chatway) return
    const widget = document.querySelector('.chatway--container')
    if (widget?.classList.contains('widget--open')) {
      window.$chatway.closeChatwayWidget()
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
          {showGuide && (
            <span className='absolute z-1001 -top-2 left-1/2 -translate-x-1/2 pointer-events-none'>
              <span className='block h-12 w-12 rounded-full bg-dynamic/20 animate-ping ring-4 ring-dynamic/50' />
            </span>
          )}
          <CustomTooltip content={t('common.helpDesk')}>
            <div
              className={cn(
                'flex justify-center items-center hover:bg-header-hover/10 h-12 w-12 px-2 duration-150 cursor-pointer transition-colors',
                isOpen && 'text-primary',
                showGuide && 'z-1002 relative pointer-events-none',
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
      {showGuide && (
        <>
          <div
            className='fixed inset-0 bg-black/60 z-1000 pointer-events-auto'
            onClick={() => setShowGuide(false)}
          />
          <div className='fixed top-16 right-36 z-1002 flex flex-col items-end'>
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className='relative w-135 bg-sidebar/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-border text-content'
            >
              <p className='leading-relaxed text-sm mr-6'>
                It looks like it&apos;s your first time here. If you need help with anything, just
                click the{' '}
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
