import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCheck } from 'react-icons/fa6'
import { cn, Modal, ModalBody, ModalContent, Tab, Tabs } from '@heroui/react'
import { Manrope } from 'next/font/google'
import Image from 'next/image'
import { ExtLink } from '@/shared/components'
import { useStateStore } from '@/shared/stores'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

interface PriceData {
  tierOne: {
    url: string
    price: string
  }
  tierTwo: {
    url: string
    price: string
  }
}

const casualFeatures = [
  'proMode.modal.removeAds',
  'proMode.modal.themes',
  'proMode.modal.uniqueChatRole',
  'proMode.modal.cancelAnytime',
] as const

const gamerFeatures = [
  'proMode.modal.everythingInCasual',
  'proMode.modal.credentials',
  'proMode.modal.autoGamesList',
  'proMode.modal.autoRedeem',
  'proMode.modal.listDupes',
  'proMode.modal.cancelAnytime',
] as const

export const GoProModal = () => {
  const { t } = useTranslation()
  const proModalOpen = useStateStore(state => state.proModalOpen)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const proModalRequiredTier = useStateStore(state => state.proModalRequiredTier)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const [selectedKey, setSelectedKey] = useState<string>('tierOne')
  const [priceData, setPriceData] = useState<PriceData>({
    tierOne: { url: '', price: '0' },
    tierTwo: { url: '', price: '0' },
  })

  // Pre-select the required tier tab when opened from a locked feature
  useEffect(() => {
    if (proModalRequiredTier === 'gamer') {
      setSelectedKey('tierTwo')
    } else {
      setSelectedKey('tierOne')
    }
  }, [proModalRequiredTier, proModalOpen])

  useEffect(() => {
    const getPaymentLinks = async () => {
      try {
        const response = await fetch('https://apibase.vercel.app/api/pro-data')
        const data = await response.json()
        if (data) {
          setPriceData({
            tierOne: data.tierOne,
            tierTwo: data.tierTwo,
          })
        }
      } catch (error) {
        console.error('Error fetching price data:', error)
      }
    }
    getPaymentLinks()
  }, [])

  const handleOpenChange = (open: boolean) => {
    setProModalOpen(open)
    if (!open) setProModalRequiredTier(null)
  }

  const activeFeatures = selectedKey === 'tierTwo' ? gamerFeatures : casualFeatures

  return (
    <Modal
      isOpen={proModalOpen}
      onOpenChange={handleOpenChange}
      className='text-content bg-transparent border-1 border-border rounded-4xl'
      classNames={{
        closeButton: 'mr-1.5 mt-1.5',
      }}
      style={{
        backgroundImage: 'linear-gradient(to bottom, #1d1d1dff 0%, #000000ff 100%)',
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className='flex flex-col justify-center items-center h-full py-10'>
            <p className='text-3xl font-black uppercase mb-6'>{t('proMode.modal.select')}</p>

            <Tabs
              aria-label='Settings tabs'
              selectedKey={selectedKey}
              onSelectionChange={key => setSelectedKey(String(key))}
              radius='full'
              classNames={{
                tabList: 'gap-0',
                tab: 'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
                tabContent: 'text-sm font-bold',
                panel: 'w-full px-12',
              }}
            >
              {/* Tier One — Casual */}
              <Tab key='tierOne' title={t('proMode.modal.tierOne')}>
                <div className='flex flex-col justify-center items-center'>
                  <p className={`${manrope.className} text-4xl font-black mt-3 mb-6`}>
                    ${priceData?.tierOne?.price}
                    <span className='text-sm ml-1 lowercase font-medium'>
                      / {t('proMode.modal.monthly')}
                    </span>
                  </p>

                  <ExtLink href={priceData?.tierOne?.url} className='w-full'>
                    <div
                      className={cn(
                        'flex justify-center items-center w-full rounded-full font-medium',
                        'text-white text-md bg-[#5750DF] py-2.5 hover:bg-[#5750DF]/90 hover:scale-[1.02] duration-150',
                      )}
                    >
                      {t('proMode.modal.getStarted')}
                    </div>
                  </ExtLink>
                </div>
              </Tab>

              {/* Tier Two — Gamer */}
              <Tab key='tierTwo' title={t('proMode.modal.tierTwo')}>
                <div className='flex flex-col justify-center items-center'>
                  <p className={`${manrope.className} text-4xl font-black mt-3 mb-6`}>
                    ${priceData?.tierTwo?.price}
                    <span className='text-sm ml-1 lowercase font-medium'>
                      / {t('proMode.modal.monthly')}
                    </span>
                  </p>

                  <ExtLink href={priceData?.tierTwo?.url} className='w-full'>
                    <div
                      className={cn(
                        'flex justify-center items-center w-full rounded-full font-medium',
                        'text-white text-md bg-[#5750DF] py-2.5 hover:bg-[#5750DF]/90 hover:scale-[1.02] duration-150',
                      )}
                    >
                      {t('proMode.modal.getStarted')}
                    </div>
                  </ExtLink>
                </div>
              </Tab>
            </Tabs>

            <ExtLink
              href='https://steamgameidler.com/docs/pro'
              className='text-dynamic hover:text-dynamic-hover duration-150 text-xs'
            >
              <p>{t('proMode.modal.learnMore')}</p>
            </ExtLink>

            <div className='mt-4 w-full max-w-xs text-sm'>
              <p className='font-semibold mb-3'>{t('proMode.modal.benefits')}</p>
              <ul className='space-y-1'>
                {activeFeatures.map(key => (
                  <li key={key} className='flex items-center gap-2'>
                    <FaCheck className='text-green-500 shrink-0' />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Image
              src='/powered-by-stripe.svg'
              alt='Powered by Stripe'
              className='mt-6 select-none'
              width={130}
              height={50}
            />
            <p className='text-[10px] text-altwhite mt-2 select-none'>
              {t('proMode.modal.footer')}
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
