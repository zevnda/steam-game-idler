import { useState } from 'react'
import { TbAlertTriangle, TbX } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUserStore } from '@/shared/stores'
import { openExternalLink } from '@/shared/utils'

const BILLING_URL = 'https://billing.stripe.com/p/login/8x23cwf8CeNE6PLaAecbC00'

export function Banner() {
  const proDetails = useUserStore(s => s.proDetails)
  const [dismissed, setDismissed] = useState(false)

  const show = proDetails?.status === 'past_due' && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className='fixed bottom-0 left-0 right-0 z-50 bg-linear-to-r from-red-950 via-red-900 to-zinc-950'
        >
          <div className='flex items-center justify-between gap-4 px-6 py-3'>
            <div className='flex items-center gap-3'>
              <TbAlertTriangle fontSize={20} className='text-red-400 shrink-0' />
              <p className='text-sm text-content'>
                Your PRO subscription is past due. Please update your payment method to avoid losing
                access.
              </p>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <Button
                size='sm'
                radius='full'
                variant='solid'
                className='bg-white text-black font-semibold'
                onPress={() => openExternalLink(BILLING_URL)}
              >
                Manage Subscription
              </Button>
              <button
                onClick={() => setDismissed(true)}
                className='flex items-center justify-center hover:bg-white/10 rounded-full p-1 duration-150 cursor-pointer'
              >
                <TbX fontSize={18} className='text-content' />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
