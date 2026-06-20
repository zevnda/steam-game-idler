import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BsStripe } from 'react-icons/bs'
import {
  FaArrowDown,
  FaArrowRight,
  FaCheck,
  FaChevronDown,
  FaDiscord,
  FaPaypal,
} from 'react-icons/fa6'
import {
  TbAd,
  TbCards,
  TbClock,
  TbCurrencyDollar,
  TbGift,
  TbHeadset,
  TbKey,
  TbPalette,
  TbRefresh,
  TbSparkles,
} from 'react-icons/tb'
import { Button, Modal, ModalBody, ModalContent } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { showDangerToast } from '@/shared/components'
import { CDN_BASE_URL } from '@/shared/constants'
import { useStateStore, useUserStore } from '@/shared/stores'
import { logEvent, openExternalLink } from '@/shared/utils'

interface PriceData {
  tierOne: { url: string; price: string }
  tierTwo: { url: string; price: string }
}

// ─── Feature card data ──────────────────────────────────────────────────────

interface CardDef {
  title: string
  description: string
  tier: 'casual' | 'gamer'
  colSpan: 1 | 2
  bg: string
  imgBg?: string
  learnMoreUrl?: string
  darkText?: boolean
}

// ─── Shooting stars ──────────────────────────────────────────────────────────

const SHOOTING_STARS = [
  {
    top: '8%',
    left: '6%',
    width: 140,
    angle: 30,
    delay: 0.0,
    duration: 0.85,
    repeatDelay: 7.0,
    travel: 220,
  },
  {
    top: '20%',
    left: '55%',
    width: 90,
    angle: 26,
    delay: 2.5,
    duration: 1.0,
    repeatDelay: 9.0,
    travel: 170,
  },
  {
    top: '42%',
    left: '2%',
    width: 115,
    angle: 34,
    delay: 5.5,
    duration: 0.9,
    repeatDelay: 8.5,
    travel: 195,
  },
  {
    top: '62%',
    left: '65%',
    width: 75,
    angle: 28,
    delay: 1.2,
    duration: 1.1,
    repeatDelay: 11.0,
    travel: 145,
  },
  {
    top: '78%',
    left: '32%',
    width: 100,
    angle: 22,
    delay: 4.2,
    duration: 0.95,
    repeatDelay: 10.0,
    travel: 185,
  },
  {
    top: '14%',
    left: '76%',
    width: 82,
    angle: 32,
    delay: 7.0,
    duration: 0.8,
    repeatDelay: 12.0,
    travel: 155,
  },
]

function ShootingStar({
  top,
  left,
  width,
  angle,
  delay,
  duration,
  repeatDelay,
  travel,
}: (typeof SHOOTING_STARS)[0]) {
  const rad = (angle * Math.PI) / 180
  const dx = travel * Math.cos(rad)
  const dy = travel * Math.sin(rad)

  return (
    <motion.div
      className='absolute pointer-events-none'
      style={{
        top,
        left,
        height: 1.5,
        width,
        borderRadius: 9999,
        background:
          'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.88) 85%, white 100%)',
        rotate: angle,
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.75))',
      }}
      animate={{ x: [0, dx], y: [0, dy], opacity: [0, 1, 0] }}
      transition={{ duration, repeat: Infinity, repeatDelay, delay, ease: 'easeOut' as const }}
    />
  )
}

// ─── Floating decorative images ──────────────────────────────────────────────

function FloatingImage({
  src,
  size,
  duration,
  delay,
  style,
}: {
  src: string
  size: number
  duration: number
  delay: number
  style: React.CSSProperties
}) {
  return (
    <motion.div
      className='absolute z-0 pointer-events-none select-none'
      style={style}
      animate={{ y: [0, -22, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' as const, delay }}
    >
      <Image
        src={src}
        alt=''
        width={size}
        height={size}
        className='object-contain opacity-90 drop-shadow-2xl'
      />
    </motion.div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeatureCard({ card, index }: { card: CardDef; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.45, ease: 'easeOut' as const }}
      style={{
        gridColumn: card.colSpan === 2 ? 'span 2' : 'span 1',
        background: card.bg,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className='relative rounded-4xl overflow-hidden cursor-default group min-h-87.5'
    >
      {card.imgBg && <Image src={card.imgBg} alt='' fill className='object-cover opacity-80' />}

      <div
        className={`relative z-10 p-4 flex flex-col h-full ${card.darkText ? 'text-black' : ''}`}
      >
        <p className='text-xl font-black mb-1.5'>{card.title}</p>
        <p className='text-sm font-semibold leading-relaxed flex-1'>{card.description}</p>
      </div>
    </motion.div>
  )
}

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

function TierCard({
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
  const accent = isCasual ? '#3b82f6' : '#9b4ee4'
  const accentTo = isCasual ? '#38bdf8' : '#c026d3'

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

function FAQItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className='rounded-3xl overflow-hidden cursor-pointer py-2 bg-[#161616] hover:bg-[#181818] duration-150'
      onClick={onToggle}
    >
      <div className='flex items-center justify-between px-4 py-3.5 gap-3'>
        <span className='text-lg font-semibold'>{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className='shrink-0'
        >
          <FaChevronDown size={16} className='text-altwhite' />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' as const }}
            className='overflow-hidden'
          >
            <p className='text-altwhite px-4 pb-4 leading-relaxed'>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <div className='flex items-center gap-3 mb-10 mt-15'>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07))' }}
      />
      <span className='text-white/25 font-black uppercase tracking-[0.22em]'>{label}</span>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.07))' }}
      />
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export const GoProModal = () => {
  const { t } = useTranslation()
  const proModalOpen = useStateStore(state => state.proModalOpen)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const proModalRequiredTier = useStateStore(state => state.proModalRequiredTier)
  const proTier = useUserStore(state => state.proTier)

  const tierRef = useRef<HTMLDivElement>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [lockedWidth, setLockedWidth] = useState<number | null>(null)

  const [priceData, setPriceData] = useState<PriceData>({
    tierOne: { url: '', price: '0' },
    tierTwo: { url: '', price: '0' },
  })

  const CARDS: CardDef[] = [
    {
      title: t('proMode.cards.adFree.title'),
      description: t('proMode.cards.adFree.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro1.webp`,
    },
    {
      title: t('proMode.cards.themes.title'),
      description: t('proMode.cards.themes.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro2.webp`,
      darkText: true,
    },
    {
      title: t('proMode.cards.discordRole.title'),
      description: t('proMode.cards.discordRole.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro3.webp`,
    },
    {
      title: t('proMode.cards.liveSupport.title'),
      description: t('proMode.cards.liveSupport.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro4.webp`,
    },
    {
      title: t('proMode.cards.credentials.title'),
      description: t('proMode.cards.credentials.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro5.webp`,
    },
    {
      title: t('proMode.cards.autoFarmCards.title'),
      description: t('proMode.cards.autoFarmCards.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro6.webp`,
    },
    {
      title: t('proMode.cards.gamesList.title'),
      description: t('proMode.cards.gamesList.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro7.webp`,
    },
    {
      title: t('proMode.cards.freeGames.title'),
      description: t('proMode.cards.freeGames.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro8.webp`,
      darkText: true,
    },
    {
      title: t('proMode.cards.sellDupes.title'),
      description: t('proMode.cards.sellDupes.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro9.webp`,
    },
  ]

  const FAQ_ITEMS = [
    {
      q: t('proMode.faq.subscriptionNotActivated.q'),
      a: t('proMode.faq.subscriptionNotActivated.a'),
    },
    { q: t('proMode.faq.transferDevice.q'), a: t('proMode.faq.transferDevice.a') },
    { q: t('proMode.faq.cancel.q'), a: t('proMode.faq.cancel.a') },
    { q: t('proMode.faq.switchTier.q'), a: t('proMode.faq.switchTier.a') },
    { q: t('proMode.faq.invoices.q'), a: t('proMode.faq.invoices.a') },
    { q: t('proMode.faq.refund.q'), a: t('proMode.faq.refund.a') },
    { q: t('proMode.faq.chargeback.q'), a: t('proMode.faq.chargeback.a') },
  ]

  useEffect(() => {
    const getPaymentLinks = async () => {
      try {
        const res = await fetch('https://apibase.vercel.app/api/pro-data')
        const data = await res.json()
        if (data) setPriceData(data)
      } catch (error) {
        console.error('Error fetching price data:', error)
      }
    }
    getPaymentLinks()
  }, [])

  useEffect(() => {
    if (!proModalOpen || !proModalRequiredTier) return
    const timer = setTimeout(() => {
      tierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
    return () => clearTimeout(timer)
  }, [proModalOpen, proModalRequiredTier])

  useEffect(() => {
    if (proModalOpen) setLockedWidth(window.innerWidth)
  }, [proModalOpen])

  const handleOpenChange = (open: boolean) => {
    setProModalOpen(open)
    if (!open) setProModalRequiredTier(null)
  }

  const scrollToTiers = () => {
    tierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Modal
      isOpen={proModalOpen}
      onOpenChange={handleOpenChange}
      size='full'
      scrollBehavior='inside'
      className='text-content overflow-hidden'
      classNames={{
        closeButton:
          'absolute w-8 h-8 left-0 top-0 ml-5 mt-5 z-50 bg-inputhover hover:bg-inputhover/80 text-white/40 duration-150 cursor-pointer',
      }}
      style={{
        background: 'linear-gradient(to bottom, rgb(15, 15, 15) 0%, #0c0c0c 100%)',
      }}
    >
      <ModalContent>
        <ModalBody className='p-0 overflow-auto overflow-x-hidden select-none'>
          {/* ── Hero + Features wrapper (hosts floating decorative images) ── */}
          <div className='relative'>
            <div
              className='absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none'
              style={{ width: lockedWidth ?? '100%' }}
            >
              <FloatingImage
                src={`${CDN_BASE_URL}/pro-modal/dragon.webp`}
                size={600}
                duration={5}
                delay={0}
                style={{ top: '5rem', right: '-10rem' }}
              />
              <FloatingImage
                src={`${CDN_BASE_URL}/pro-modal/pyramidhead.webp`}
                size={300}
                duration={6}
                delay={1.1}
                style={{ top: 'calc(40% - 200px)', left: '2rem' }}
              />
            </div>

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <div className='relative z-10 min-h-fit flex flex-col items-center justify-center overflow-hidden'>
              {/* Stars — two layers for depth */}
              <div
                className='absolute inset-0 pointer-events-none'
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)',
                  backgroundSize: '28px 28px',
                  opacity: 0.18,
                }}
              />

              {/* Shooting stars */}
              {SHOOTING_STARS.map(star => (
                <ShootingStar key={`${star.top}-${star.left}`} {...star} />
              ))}

              {/* Purple glow center */}
              <div
                className='absolute inset-0 pointer-events-none'
                style={{
                  background:
                    'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0, 81, 255, 0.18) 0%, transparent 70%)',
                }}
              />

              {/* Content */}
              <div className='relative z-10 flex flex-col items-center text-center px-8 pt-28 pb-28'>
                {/* Product label */}
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className='text-xl font-black uppercase tracking-[0.2em] text-altwhite mb-3'
                >
                  Steam Game Idler{' '}
                  <motion.span
                    className='text-transparent bg-clip-text'
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, #c084fc 0%, #818cf8 45%, #60a5fa 100%)',
                    }}
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }}
                  >
                    PRO
                  </motion.span>
                </motion.p>

                {/* Main headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.0 }}
                  className='text-6xl font-bold leading-none tracking-tight mb-5 uppercase'
                >
                  {t('proMode.hero.headline')}
                </motion.h1>

                {/* Subtext */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.0 }}
                  className='text-altwhite max-w-120 leading-relaxed mb-8'
                >
                  <Trans
                    i18nKey='proMode.hero.subtext'
                    components={{
                      1: <span className='font-black' />,
                      3: <span className='font-black' />,
                      5: <span className='font-black' />,
                    }}
                  />
                </motion.p>

                {/* CTA — white pill */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.15 }}
                  className='flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-black font-black uppercase cursor-pointer duration-150 hover:scale-[1.02]'
                  onClick={scrollToTiers}
                >
                  {t('proMode.hero.viewTiers')}
                  <FaArrowDown className='w-3 h-3' />
                </motion.button>

                {/* Fine print */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className='text-[10px] text-white/25 mt-4'
                >
                  {t('proMode.hero.startingAt', { price: priceData.tierOne.price })}
                </motion.p>
              </div>
            </div>

            {/* ── Features bento ──────────────────────────────────────────── */}
            <div className='relative z-10 px-65 pb-8'>
              <SectionHeading label={t('proMode.section.allFeatures')} />

              {/* Cards */}
              <div className='grid grid-cols-[repeat(3,18.75rem)] justify-center gap-6 mb-3'>
                {CARDS.map((c, i) => (
                  <FeatureCard key={c.title} card={c} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Tier cards ────────────────────────────────────────────────── */}
          <div ref={tierRef} className='px-65 pb-8'>
            <SectionHeading label={t('proMode.section.chooseTier')} />

            <div className='relative grid grid-cols-[repeat(2,26rem)] justify-center gap-6'>
              <Image
                src={`${CDN_BASE_URL}/pro-modal/samurai.webp`}
                alt=''
                width={250}
                height={250}
                className='absolute z-10 pointer-events-none select-none object-contain opacity-90 drop-shadow-2xl'
                style={{ top: '46%', right: '-9rem', transform: 'translateY(-50%)' }}
              />
              <TierCard
                name={t('proMode.tier.casual.name')}
                price={priceData.tierOne.price}
                url={priceData.tierOne.url}
                tier='casual'
                features={[
                  { label: t('proMode.tier.casual.adFree'), icon: TbAd },
                  { label: t('proMode.tier.casual.themes'), icon: TbPalette },
                  { label: t('proMode.tier.casual.discordRole'), icon: FaDiscord },
                  { label: t('proMode.tier.casual.liveSupport'), icon: TbHeadset },
                  { label: t('proMode.tier.casual.cancelAnytime'), icon: FaCheck },
                ]}
                isOwned={proTier === 'casual' || proTier === 'gamer'}
                isRequired={proModalRequiredTier === 'casual'}
                isCasual
              />
              <TierCard
                name={t('proMode.tier.gamer.name')}
                price={priceData.tierTwo.price}
                url={priceData.tierTwo.url}
                tier='gamer'
                features={[
                  { label: t('proMode.tier.gamer.credentials'), icon: TbKey },
                  { label: t('proMode.tier.gamer.gamesList'), icon: TbRefresh },
                  { label: t('proMode.tier.gamer.freeGames'), icon: TbGift },
                  { label: t('proMode.tier.gamer.autoFarmCards'), icon: TbCards },
                  { label: t('proMode.tier.gamer.sellDupes'), icon: TbCurrencyDollar },
                  { label: t('proMode.tier.gamer.importTimings'), icon: TbClock },
                  { label: t('proMode.tier.gamer.cancelAnytime'), icon: FaCheck },
                ]}
                isOwned={proTier === 'gamer'}
                isRequired={proModalRequiredTier === 'gamer'}
                isMostPopular={!proModalRequiredTier}
              />
            </div>

            <p className='text-center text-white/25 text-[10px] mt-4'>
              {t('proMode.modal.footer')}
            </p>
          </div>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <div className='px-65 pb-8'>
            <SectionHeading label={t('proMode.section.faq')} />

            <div className='space-y-4 w-214 mx-auto'>
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  isOpen={openFaqIndex === i}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
