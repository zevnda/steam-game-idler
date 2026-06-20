import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BsStripe } from 'react-icons/bs'
import { FaArrowRight, FaPaypal } from 'react-icons/fa6'
import { TbSparkles } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { motion } from 'framer-motion'
import { showDangerToast } from '@/shared/components'
import { logEvent, openExternalLink } from '@/shared/utils'

interface TierCardProps {
  name: string
  price: string
  url: string
  tier: 'casual' | 'gamer'
  features: { label: string; icon: React.ElementType }[]
  isOwned?: boolean
  isMostPopular?: boolean
  isRequired?: boolean
  isCasual?: boolean
}

export function TierCard({
  name,
  price,
  url,
  tier,
  features: tf,
  isOwned,
  isMostPopular,
  isRequired,
  isCasual,
}: TierCardProps) {
  const { t } = useTranslation()
  const [isPaypalLoading, setIsPaypalLoading] = useState(false)
  const accent = isCasual ? '#3b82f6' : '#8a60ff'
  const accentTo = isCasual ? '#38bdf8' : '#ab26d3'

  const handlePaypalSelect = async () => {
    setIsPaypalLoading(true)
    try {
      const res = await fetch('https://apibase.vercel.app/api/paypal-create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data?.url) {
        openExternalLink(data.url)
      } else {
        showDangerToast(t('toast.paypalCheckout.error'))
      }
    } catch (error) {
      console.error('Error creating PayPal subscription:', error)
      logEvent(`[Error] in (handlePaypalSelect - GoProModal): ${error}`)
      showDangerToast(t('toast.paypalCheckout.error'))
    } finally {
      setIsPaypalLoading(false)
    }
  }

  return (
    <motion.div
      className='relative rounded-4xl overflow-hidden flex flex-col'
      style={{
        background: isCasual ? '#161b2b' : 'linear-gradient(145deg, #630064 0%, #2f0474 100%)',
        ...(isRequired && {
          outline: `2px solid ${accent}`,
          boxShadow: `0 0 20px 8px ${isCasual ? 'rgba(59, 131, 246, 0.26)' : 'rgba(146, 51, 234, 0.35)'}`,
        }),
      }}
    >
      {/* Gamer card: decorative sparkle backdrop */}
      {!isCasual && (
        <div
          className='absolute -top-8 -right-8 pointer-events-none'
          style={{ color: '#9333ea', opacity: 0.06 }}
        >
          <TbSparkles size={160} />
        </div>
      )}

      {/* Badge */}
      {isMostPopular && (
        <div className='absolute top-3.5 right-3.5 z-10'>
          <span
            className='px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-widest'
            style={{ background: `linear-gradient(90deg, ${accent}, ${accentTo})` }}
          >
            {t('proMode.tier.mostPopular')}
          </span>
        </div>
      )}

      <div className='p-6 flex flex-col flex-1'>
        {/* Tier label */}
        <span className='text-xl font-black uppercase mb-2' style={{ color: accent }}>
          {name}
        </span>

        {/* Price */}
        <div className='flex items-end gap-1.5 mb-5'>
          <span className='text-[44px] font-black leading-none'>${price}</span>
          <span className='text-altwhite text-sm mb-1.5'>{t('proMode.tier.perMonth')}</span>
        </div>

        {/* Feature list */}
        {!isCasual && <p className='mb-2'>{t('proMode.tier.everythingInCasualPlus')}</p>}

        <ul className='space-y-2.5 flex-1 mb-6'>
          {tf.map(f => (
            <li key={f.label} className='flex items-center gap-2.5'>
              <div className='flex items-center justify-center'>
                <f.icon size={20} />
              </div>
              <span className='text-content'>{f.label}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isOwned ? (
          <div className='flex items-center justify-center w-full py-3 h-12 rounded-full text-center bg-input font-black uppercase'>
            {t('proMode.tier.currentPlan')}
          </div>
        ) : (
          <div className='flex gap-2.5'>
            <Button
              size='lg'
              className='relative w-full py-3 rounded-full font-black uppercase flex items-center justify-center gap-2 cursor-pointer overflow-hidden duration-150 hover:scale-[1.02]'
              style={{
                background: 'linear-gradient(110deg, #635bff, #7a73ff)',
              }}
              onPress={() => url && openExternalLink(url)}
            >
              <span className='relative z-10 flex items-center gap-2'>
                <BsStripe className='w-3.5 h-3.5' />
                {t('proMode.tier.continueWithStripe')}
                <FaArrowRight className='w-3 h-3' />
              </span>
            </Button>
            <Button
              size='lg'
              className='relative w-full py-3 rounded-full font-black uppercase flex items-center justify-center gap-2 cursor-pointer overflow-hidden duration-150 hover:scale-[1.02]'
              style={{
                background: 'linear-gradient(110deg, #003087, #0070ba)',
              }}
              isLoading={isPaypalLoading}
              onPress={handlePaypalSelect}
            >
              {!isPaypalLoading && (
                <span className='relative z-10 flex items-center gap-2'>
                  <FaPaypal className='w-3.5 h-3.5' />
                  {t('proMode.tier.continueWithPaypal')}
                  <FaArrowRight className='w-3 h-3' />
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
