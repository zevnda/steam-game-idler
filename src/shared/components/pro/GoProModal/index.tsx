import type { PriceData } from './types'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FaArrowDown, FaCheck, FaDiscord } from 'react-icons/fa6'
import {
  TbAd,
  TbAward,
  TbCards,
  TbClock,
  TbCurrencyDollar,
  TbGift,
  TbHeadset,
  TbKey,
  TbPalette,
  TbPhoto,
  TbRefresh,
  TbTypography,
  TbUserCircle,
  TbUsers,
} from 'react-icons/tb'
import {
  FloatingImage,
  SHOOTING_STARS,
  ShootingStar,
  STARFIELD_BACKGROUND,
} from './BackgroundEffects'
import { ComparisonTable } from './ComparisonTable'
import { getComparisonRows, getFaqItems, getFeatureCards } from './data'
import { FAQItem } from './FAQItem'
import { FeatureCard } from './FeatureCard'
import { SectionHeading } from './SectionHeading'
import { TierCard } from './TierCard'
import { Modal } from '@heroui/react'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasCasualAccess, hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Mounted once at root (`_app.tsx`), opened by the titlebar GoPro button (GoPro.tsx). Full
// purchase-flow content ported from `main`'s 9-file `GoProModal/`, bridged onto HeroUI v3's
// compound Modal API with no framer-motion and nested i18n keys. Structural deviations from
// `main`, both deliberate:
//
// - No `Modal.Header`/`Modal.Heading` bar - `main` renders this as a fully immersive, edge-to-edge
//   starfield with only a floating dismiss button (no visible title chrome), so a standard header
//   bar would actually break visual parity here rather than preserve it. `Modal.CloseTrigger` is
//   rendered directly inside `Modal.Dialog`, repositioned to float top-left like `main`'s.
// - `requiredTier` (see proModalStore.ts) drives the same auto-scroll+highlight behavior as
//   `main`'s `proModalRequiredTier`: once a gated feature's upsell opens this modal with a tier,
//   `tierRef`'s section scrolls into view after a short delay and that tier's `TierCard` gets
//   `isRequired`. The Gamer card's `isMostPopular` is only shown when no specific tier was
//   required, matching `main`.
export const GoProModal = () => {
  const { t } = useTranslation()
  const isOpen = useProModalStore(state => state.isOpen)
  const requiredTier = useProModalStore(state => state.requiredTier)
  const close = useProModalStore(state => state.close)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  // WebKitGTK's compositor makes this modal's ambient motion meaningfully more expensive than
  // Windows' WebView2 - see the `.force-reduced-motion` comment in globals.css.
  const isLinux = usePlatformStore(state => state.currentOs) === 'linux'

  const tierRef = useRef<HTMLDivElement>(null)
  const hasFetchedPriceData = useRef(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [priceData, setPriceData] = useState<PriceData>({
    tierOne: { url: '', price: '0' },
    tierTwo: { url: '', price: '0' },
  })

  const cards = getFeatureCards(t)
  const faqItems = getFaqItems(t)
  const comparisonRows = getComparisonRows(t)

  // `main` fetches this unconditionally as soon as GoProModal mounts (i.e. at every app launch,
  // since it's mounted once at root) - deferred here until the modal is actually opened for the
  // first time instead, since most sessions never open it. `hasFetchedPriceData` (rather than a
  // dependency-array gate) keeps it a one-shot fetch across the component's lifetime, matching
  // `main`'s single-fetch intent once it does run.
  useEffect(() => {
    if (!isOpen || hasFetchedPriceData.current) return
    hasFetchedPriceData.current = true

    let cancelled = false
    async function getPaymentLinks() {
      try {
        const res = await fetch('https://apibase.vercel.app/api/pro-data')
        const data = await res.json()
        if (data && !cancelled) setPriceData(data)
      } catch (error) {
        console.error('Error in (getPaymentLinks - GoProModal):', error)
      }
    }
    getPaymentLinks()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Auto-scrolls to the tier section once a gated feature's upsell opens this modal with a
  // specific tier required - the short delay lets the modal's own open transition/layout settle
  // first, matching `main`'s identical timing.
  useEffect(() => {
    if (!isOpen || !requiredTier) return
    const timer = setTimeout(() => {
      tierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
    return () => clearTimeout(timer)
  }, [isOpen, requiredTier])

  const scrollToTiers = () => {
    tierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && close()}>
      <Modal.Backdrop>
        <Modal.Container size='full'>
          <Modal.Dialog
            className='overflow-hidden p-0 text-foreground'
            style={{ background: 'linear-gradient(to bottom, rgb(15, 15, 15) 0%, #0c0c0c 100%)' }}
          >
            {/* No visible `Modal.Header` - `main`'s look is a fully immersive, edge-to-edge
                starfield with no header chrome (see this file's top doc comment). `Modal.Heading`
                still renders (visually hidden) so the dialog keeps a real accessible name for
                screen readers/automation instead of none at all. */}
            <Modal.Heading className='sr-only'>{t('titlebar.goPro')}</Modal.Heading>
            <Modal.CloseTrigger className='absolute left-5 top-5 z-50 h-8 w-8 bg-field text-muted duration-150 hover:bg-field-hover rounded-full' />

            <Modal.Body className='select-none overflow-x-hidden overflow-y-auto p-0'>
              <div className={`relative ${isLinux ? 'force-reduced-motion' : ''}`}>
                <div
                  className='pointer-events-none absolute inset-0'
                  style={{
                    backgroundImage: STARFIELD_BACKGROUND,
                    backgroundRepeat: 'no-repeat',
                    maskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)',
                  }}
                />

                <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                  {SHOOTING_STARS.map(star => (
                    <ShootingStar key={`${star.top}-${star.left}`} {...star} />
                  ))}
                </div>

                <div className='relative'>
                  <div
                    className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2'
                    style={{ width: 1440, height: 800 }}
                  >
                    <FloatingImage
                      delay={0}
                      duration={5}
                      size={600}
                      src={`${CDN_BASE_URL}/pro-modal/dragon.webp`}
                      style={{ top: '5rem', right: '-10rem' }}
                    />
                    <FloatingImage
                      delay={1.1}
                      duration={6}
                      size={300}
                      src={`${CDN_BASE_URL}/pro-modal/pyramidhead.webp`}
                      style={{ top: '40rem', left: '2rem' }}
                    />
                  </div>

                  <div className='relative z-10 flex min-h-fit flex-col items-center justify-center'>
                    <div
                      className='pointer-events-none absolute inset-0'
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

                    <div className='relative z-10 flex flex-col items-center px-8 pb-28 pt-28 text-center'>
                      <p className='pro-fade-in-up mb-3 text-xl font-black uppercase tracking-[0.2em] text-foreground'>
                        Steam Game Idler{' '}
                        <span
                          className='bg-clip-text text-transparent'
                          style={{
                            backgroundImage:
                              'linear-gradient(135deg, #b700ff 0%, #6f00ff 45%, #3583e2 100%)',
                          }}
                        >
                          PRO
                        </span>
                      </p>

                      <h1 className='pro-fade-in-up mb-5 text-6xl font-bold text-white uppercase leading-none tracking-tight'>
                        {t('proMode.hero.headline')}
                      </h1>

                      <p className='pro-fade-in-up mb-8 max-w-120 leading-relaxed text-foreground'>
                        <Trans
                          i18nKey='proMode.hero.subtext'
                          components={{
                            1: <span className='font-black' />,
                            3: <span className='font-black' />,
                            5: <span className='font-black' />,
                          }}
                        />
                      </p>

                      <button
                        className='pro-fade-in flex cursor-pointer items-center gap-2.5 rounded-full bg-white px-7 py-3 font-black uppercase text-black duration-150 hover:scale-[1.02]'
                        style={{ animationDelay: '150ms' }}
                        type='button'
                        onClick={scrollToTiers}
                      >
                        {t('proMode.hero.viewTiers')}
                        <FaArrowDown className='h-3 w-3' />
                      </button>

                      <p
                        className='pro-fade-in mt-4 text-[10px] text-white/45'
                        style={{ animationDelay: '450ms' }}
                      >
                        {t('proMode.hero.startingAt', { price: priceData.tierOne.price })}
                      </p>
                    </div>
                  </div>

                  <div className='relative z-10 px-65 pb-8'>
                    <SectionHeading label={t('proMode.section.allFeatures')} />

                    <div className='mb-3 grid grid-cols-[repeat(3,18.75rem)] justify-center gap-6'>
                      {cards.map((card, i) => (
                        <FeatureCard card={card} index={i} key={card.title} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className='px-65 pb-8' ref={tierRef}>
                  <SectionHeading label={t('proMode.section.chooseTier')} />

                  <div className='relative mx-auto grid w-fit grid-cols-[repeat(2,26rem)] gap-6'>
                    <Image
                      alt=''
                      className='pointer-events-none absolute z-10 select-none object-contain opacity-90 drop-shadow-2xl'
                      height={250}
                      src={`${CDN_BASE_URL}/pro-modal/samurai.webp`}
                      style={{ top: '46%', right: '-10rem', transform: 'translateY(-50%)' }}
                      width={250}
                    />
                    <TierCard
                      isCasual
                      isOwned={hasCasualAccess(subscriptionTier)}
                      isRequired={requiredTier === 'casual'}
                      name={t('proMode.tier.casual.name')}
                      price={priceData.tierOne.price}
                      tier='casual'
                      url={priceData.tierOne.url}
                      features={[
                        { label: t('proMode.tier.casual.multiAccount'), icon: TbUsers },
                        { label: t('proMode.tier.casual.multipleUnlockerGames'), icon: TbAward },
                        { label: t('proMode.cards.gamesList.title'), icon: TbRefresh },
                        { label: t('proMode.cards.adFree.title'), icon: TbAd },
                        { label: t('proMode.cards.themes.title'), icon: TbPalette },
                        { label: t('proMode.cards.customBackground.title'), icon: TbPhoto },
                        { label: t('proMode.cards.customFont.title'), icon: TbTypography },
                        { label: t('proMode.tier.casual.discordRole'), icon: FaDiscord },
                        { label: t('proMode.cards.liveSupport.title'), icon: TbHeadset },
                        { label: t('proMode.tier.cancelAnytime'), icon: FaCheck },
                      ]}
                    />
                    <TierCard
                      isMostPopular={!requiredTier}
                      isOwned={hasGamerAccess(subscriptionTier)}
                      isRequired={requiredTier === 'gamer'}
                      name={t('proMode.tier.gamer.name')}
                      price={priceData.tierTwo.price}
                      tier='gamer'
                      url={priceData.tierTwo.url}
                      features={[
                        { label: t('proMode.tier.gamer.multiAccount'), icon: TbUsers },
                        { label: t('proMode.tier.gamer.multipleUnlockerGames'), icon: TbAward },
                        { label: t('proMode.cards.credentials.title'), icon: TbKey },
                        { label: t('proMode.tier.gamer.freeGames'), icon: TbGift },
                        { label: t('proMode.cards.autoFarmCards.title'), icon: TbCards },
                        { label: t('proMode.tier.gamer.sellDupes'), icon: TbCurrencyDollar },
                        { label: t('proMode.tier.gamer.importTimings'), icon: TbClock },
                        { label: t('proMode.cards.customPresence.title'), icon: TbUserCircle },
                        { label: t('proMode.tier.cancelAnytime'), icon: FaCheck },
                      ]}
                    />
                  </div>

                  <div className='flex w-full justify-center'>
                    <p className='mt-4 w-94 text-center text-[10px] text-white/45'>
                      {t('proMode.modal.footer')}
                    </p>
                  </div>
                </div>
              </div>

              <div className='px-65 pb-8'>
                <SectionHeading label={t('proMode.section.comparePlans')} />
                <ComparisonTable priceData={priceData} rows={comparisonRows} />
              </div>

              <div className='px-65 pb-8'>
                <SectionHeading label={t('proMode.section.faq')} />

                <div className='mx-auto w-214 space-y-4'>
                  {faqItems.map((item, i) => (
                    <FAQItem
                      a={item.a}
                      isOpen={openFaqIndex === i}
                      key={item.q}
                      q={item.q}
                      onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    />
                  ))}
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
