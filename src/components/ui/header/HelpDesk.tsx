import type { ReactElement } from 'react'

import { cn } from '@heroui/react'
import { useEffect, useState } from 'react'
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
    if (!crispLoaded || typeof window === 'undefined' || !window.$crisp) return

    // Set username and avatar in Crisp
    window.$crisp.push(['set', 'user:nickname', [userSummary?.personaName || 'Unknown User']])
    if (userSummary?.avatar) {
      window.$crisp.push(['set', 'user:avatar', [userSummary.avatar]])
    }

    // Handler for chat opened/closed events
    const handleChatOpened = (): void => setShowHelpDesk(true)
    const handleChatClosed = (): void => setShowHelpDesk(false)

    window.$crisp.push(['on', 'chat:opened', handleChatOpened])
    window.$crisp.push(['on', 'chat:closed', handleChatClosed])

    return () => {
      window.$crisp.push(['off', 'chat:opened', handleChatOpened])
      window.$crisp.push(['off', 'chat:closed', handleChatClosed])
    }
  }, [crispLoaded, userSummary])

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
