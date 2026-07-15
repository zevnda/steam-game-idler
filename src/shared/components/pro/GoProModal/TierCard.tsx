import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BsStripe } from 'react-icons/bs'
import { FaArrowRight, FaPaypal } from 'react-icons/fa6'
import { TbSparkles } from 'react-icons/tb'
import { Button, toast } from '@heroui/react'
import { openExternalLink } from '@/shared/utils/links'

interface TierCardProps {
  name: string
  price: string
  url: string
  tier: 'casual' | 'gamer'
  features: { label: string; icon: React.ElementType }[]
  isOwned?: boolean
  isMostPopular?: boolean
  isCasual?: boolean
  // Set when a gated feature's upsell opened the modal requiring exactly this tier - outlines the
  // card and adds a colored glow so the user immediately sees which plan they need, matching
  // `main`'s `proModalRequiredTier` highlight.
  isRequired?: boolean
}

// Ported from `main`. Real payment flow, unchanged: Stripe opens `url` directly, PayPal POSTs to
// the same live external endpoint `main` uses to create a subscription then opens the returned
// checkout URL - this must not actually be completed during testing. `main`'s `logEvent`/
// `showDangerToast` map to this codebase's plain `console.error`/`toast.danger`.
export function TierCard({
  name,
  price,
  url,
  tier,
  features: tf,
  isOwned,
  isMostPopular,
  isCasual,
  isRequired,
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
        toast.danger(t('toast.paypalCheckout.error'))
      }
    } catch (error) {
      console.error('Error in (handlePaypalSelect - TierCard):', error)
      toast.danger(t('toast.paypalCheckout.error'))
    } finally {
      setIsPaypalLoading(false)
    }
  }

  return (
    <div
      className='relative flex flex-col overflow-hidden rounded-4xl text-white'
      style={{
        background: isCasual ? '#161b2b' : 'linear-gradient(145deg, #630064 0%, #2f0474 100%)',
        ...(isRequired && {
          outline: `2px solid ${accent}`,
          boxShadow: `0 0 20px 8px ${isCasual ? 'rgba(59, 131, 246, 0.26)' : 'rgba(146, 51, 234, 0.35)'}`,
        }),
      }}
    >
      {!isCasual && (
        <div
          className='pointer-events-none absolute -right-8 -top-8'
          style={{ color: '#9333ea', opacity: 0.06 }}
        >
          <TbSparkles size={160} />
        </div>
      )}

      {isMostPopular && (
        <div className='absolute right-3.5 top-3.5 z-10'>
          <span
            className='rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest'
            style={{ background: `linear-gradient(90deg, ${accent}, ${accentTo})` }}
          >
            {t('proMode.tier.mostPopular')}
          </span>
        </div>
      )}

      <div className='flex flex-1 flex-col p-6'>
        <span className='mb-2 text-xl font-black uppercase' style={{ color: accent }}>
          {name}
        </span>

        <div className='mb-5 flex items-end gap-1.5'>
          <span className='text-[44px] font-black leading-none'>${price}</span>
          <span className='mb-1.5 text-sm text-muted'>{t('proMode.tier.perMonth')}</span>
        </div>

        {!isCasual && <p className='mb-2'>{t('proMode.tier.everythingInCasualPlus')}</p>}

        <ul className='mb-6 flex-1 space-y-2.5'>
          {tf.map(f => (
            <li key={f.label} className='flex items-center gap-2.5'>
              <div className='flex items-center justify-center'>
                <f.icon size={20} />
              </div>
              <span className='text-foreground'>{f.label}</span>
            </li>
          ))}
        </ul>

        {isOwned ? (
          <div className='flex h-12 w-full items-center justify-center rounded-full bg-field py-3 text-center font-black uppercase'>
            {t('proMode.tier.currentPlan')}
          </div>
        ) : (
          <div className='flex gap-2.5'>
            <Button
              className='relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full py-3 font-black uppercase duration-150 hover:scale-[1.02] transition-transform text-white'
              size='lg'
              style={{ background: 'linear-gradient(110deg, #635bff, #7a73ff)' }}
              onPress={() => url && openExternalLink(url)}
            >
              <span className='relative z-10 flex items-center gap-2'>
                <BsStripe className='h-3.5 w-3.5' />
                {t('proMode.tier.continueWithStripe')}
                <FaArrowRight className='h-3 w-3' />
              </span>
            </Button>
            <Button
              className='relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full py-3 font-black uppercase duration-150 hover:scale-[1.02] transition-transform text-white'
              isPending={isPaypalLoading}
              size='lg'
              style={{ background: 'linear-gradient(110deg, #003087, #0070ba)' }}
              onPress={handlePaypalSelect}
            >
              <span className='relative z-10 flex items-center gap-2'>
                <FaPaypal className='h-3.5 w-3.5' />
                {t(isPaypalLoading ? 'proMode.tier.processing' : 'proMode.tier.continueWithPaypal')}
                {!isPaypalLoading && <FaArrowRight className='h-3 w-3' />}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
