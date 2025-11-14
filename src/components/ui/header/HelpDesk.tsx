import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'

import { useUserContext } from '@/components/contexts/UserContext'
import CustomTooltip from '@/components/ui/CustomTooltip'

interface CrispAPI {
  push: (args: unknown[]) => void
}

declare global {
  interface Window {
    $crisp: CrispAPI
  }
}

export default function HelpDesk(): ReactElement | null {
  const { t } = useTranslation()
  const { userSummary } = useUserContext()
  const [showHelpDesk, setShowHelpDesk] = useState(false)
  const [crispLoaded, setCrispLoaded] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState<boolean>(false)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    // Poll for window.$crisp until it exists
    if (typeof window === 'undefined') return

    let interval: NodeJS.Timeout

    if (!window.$crisp) {
      interval = setInterval(() => {
        if (window.$crisp) {
          setCrispLoaded(true)
          clearInterval(interval)
        }
      }, 200)
    } else {
      setCrispLoaded(true)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hideCrispButton = (): void => {
      const btn = document.querySelector('div[role="button"][aria-label="Open chat"]') as HTMLElement | null
      if (btn) btn.setAttribute('style', 'display: none !important;')
    }

    observerRef.current = new MutationObserver(() => {
      hideCrispButton()
    })

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    })

    hideCrispButton()

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!crispLoaded || typeof window === 'undefined' || !window.$crisp) return

    // Set username and avatar in Crisp
    window.$crisp.push(['set', 'user:nickname', [userSummary?.personaName || 'Unknown User']])
    if (userSummary?.avatar) {
      window.$crisp.push(['set', 'user:avatar', [userSummary.avatar]])
    }
    if (userSummary?.steamId) {
      window.$crisp.push(['set', 'session:data', [[['steam_id', userSummary?.steamId]]]])
    }

    // Handler for chat opened/closed events
    const handleChatOpened = (): void => {
      setShowHelpDesk(true)
      setUnreadMessages(false)
    }
    const handleChatClosed = (): void => setShowHelpDesk(false)

    window.$crisp.push(['on', 'chat:opened', handleChatOpened])
    window.$crisp.push(['on', 'chat:closed', handleChatClosed])

    return () => {
      window.$crisp.push(['off', 'chat:opened', handleChatOpened])
      window.$crisp.push(['off', 'chat:closed', handleChatClosed])
    }
  }, [crispLoaded, userSummary])

  // Handle incoming messages to set unread state
  useEffect(() => {
    if (!crispLoaded || typeof window === 'undefined' || !window.$crisp) return

    const handleMessageReceived = (): void => setUnreadMessages(true)

    window.$crisp.push(['on', 'message:received', handleMessageReceived])
  }, [crispLoaded])

  const toggleHelpDesk = (): void => {
    if (typeof window !== 'undefined' && window.$crisp) {
      if (showHelpDesk) {
        setShowHelpDesk(false)
        window.$crisp.push(['do', 'chat:close'])
      } else {
        setShowHelpDesk(true)
        window.$crisp.push(['do', 'chat:open'])
      }
    }
  }

  if (!crispLoaded) return null

  return (
    <div className='relative'>
      <div className='flex justify-center items-center'>
        <CustomTooltip content={t('common.helpDesk')}>
          <div
            className={cn(
              'flex justify-center items-center',
              'hover:bg-header-hover/10 h-9 w-12 px-2 duration-150 cursor-pointer',
              'hover:text-white transition-colors',
            )}
            onClick={toggleHelpDesk}
          >
            <RiCustomerService2Line fontSize={18} className='text-content' />
            {unreadMessages && (
              <span className='absolute flex justify-center items-center w-2 h-2 top-2 right-3 bg-danger rounded-full shadow' />
            )}
          </div>
        </CustomTooltip>
        <AnimatePresence>
          {showHelpDesk && (
            <motion.div
              className='fixed inset-0 bg-black opacity-50 z-998'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleHelpDesk}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
