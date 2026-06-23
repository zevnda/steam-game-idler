import type { PriceData } from './types'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FaArrowDown, FaCheck, FaDiscord } from 'react-icons/fa6'
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
} from 'react-icons/tb'
import {
  FloatingImage,
  SHOOTING_STARS,
  ShootingStar,
  STARFIELD_BACKGROUND,
} from './BackgroundEffects'
import { getFaqItems, getFeatureCards } from './data'
import { FAQItem } from './FAQItem'
import { FeatureCard } from './FeatureCard'
import { SectionHeading } from './SectionHeading'
import { TierCard } from './TierCard'
import { Modal, ModalBody, ModalContent } from '@heroui/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'
import { useStateStore, useUserStore } from '@/shared/stores'

export const GoProModal = () => {
  const { t } = useTranslation()
  const proModalOpen = useStateStore(state => state.proModalOpen)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const proModalRequiredTier = useStateStore(state => state.proModalRequiredTier)
  const proTier = useUserStore(state => state.proTier)

  const tierRef = useRef<HTMLDivElement>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const [priceData, setPriceData] = useState<PriceData>({
    tierOne: { url: '', price: '0' },
    tierTwo: { url: '', price: '0' },
  })

  const CARDS = getFeatureCards(t)
  const FAQ_ITEMS = getFaqItems(t)

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
          {/* Starfield + Hero + Features + Tier cards wrapper */}
          <div className='relative'>
            {/* Static starfield dots*/}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{
                backgroundImage: STARFIELD_BACKGROUND,
                backgroundRepeat: 'no-repeat',
                maskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)',
              }}
            />

            {/* Shooting stars */}
            <div className='absolute inset-0 pointer-events-none overflow-hidden'>
              {SHOOTING_STARS.map(star => (
                <ShootingStar key={`${star.top}-${star.left}`} {...star} />
              ))}
            </div>

            {/* Hero + Features wrapper */}
            <div className='relative'>
              <div
                className='absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none'
                style={{ width: 1440, height: 800 }}
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
                  style={{ top: '40rem', left: '2rem' }}
                />
              </div>

              {/* Hero */}
              <div className='relative z-10 min-h-fit flex flex-col items-center justify-center'>
                {/* Nebula glow center */}
                <div
                  className='absolute inset-0 pointer-events-none'
                  style={{
                    background: [
                      'radial-gradient(ellipse 58% 48% at 36% 40%, rgba(124, 58, 237, 0.26) 0%, rgba(124, 58, 237, 0.10) 55%, transparent 75%)',
                      'radial-gradient(ellipse 53% 43% at 68% 58%, rgba(217, 70, 239, 0.19) 0%, rgba(217, 70, 239, 0.07) 55%, transparent 75%)',
                      'radial-gradient(ellipse 48% 43% at 52% 30%, rgba(56, 189, 248, 0.19) 0%, rgba(56, 189, 248, 0.07) 58%, transparent 77%)',
                    ].join(', '),
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                  }}
                />

                {/* Content */}
                <div className='relative z-10 flex flex-col items-center text-center px-8 pt-28 pb-28'>
                  {/* Product label */}
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className='text-xl font-black uppercase tracking-[0.2em] text-content mb-3'
                  >
                    Steam Game Idler{' '}
                    <span
                      className='text-transparent bg-clip-text'
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, #b700ff 0%, #6f00ff 45%, #3583e2 100%)',
                      }}
                    >
                      PRO
                    </span>
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
                    className='text-content max-w-120 leading-relaxed mb-8'
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
                    className='text-[10px] text-white/45 mt-4'
                  >
                    {t('proMode.hero.startingAt', { price: priceData.tierOne.price })}
                  </motion.p>
                </div>
              </div>

              {/* Features bento */}
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

            {/* Tier cards */}
            <div ref={tierRef} className='px-65 pb-8'>
              <SectionHeading label={t('proMode.section.chooseTier')} />

              <div className='relative grid grid-cols-[repeat(2,26rem)] gap-6 w-fit mx-auto'>
                <Image
                  src={`${CDN_BASE_URL}/pro-modal/samurai.webp`}
                  alt=''
                  width={250}
                  height={250}
                  className='absolute z-10 pointer-events-none select-none object-contain opacity-90 drop-shadow-2xl'
                  style={{ top: '46%', right: '-10rem', transform: 'translateY(-50%)' }}
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

              <div className='flex justify-center w-full'>
                <p className='text-center text-white/45 text-[10px] w-84 mt-4'>
                  {t('proMode.modal.footer')}
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
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
