import type { ReactElement } from 'react'

import { cn, Modal, ModalBody, ModalContent, Tab, Tabs } from '@heroui/react'
import { useStateStore } from '@/stores/stateStore'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FaCheck } from 'react-icons/fa6'

import ExtLink from '@/components/ui/ExtLink'
import ProBadge from '@/components/ui/ProBadge'

export default function GoProModal(): ReactElement {
  const { t } = useTranslation()
  const { proModalOpen, setProModalOpen } = useStateStore()

  return (
    <Modal
      isOpen={proModalOpen}
      onOpenChange={open => setProModalOpen(open)}
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
            <p className='font-bold px-1.5 py-1 rounded-lg mb-4 text-sm'>
              Steam Game Idler
              <ProBadge className='scale-90' />
            </p>
            <p className='text-3xl font-black uppercase mb-6'>{t('proMode.modal.select')}</p>

            <Tabs
              aria-label='Settings tabs'
              defaultSelectedKey='monthly'
              radius='full'
              classNames={{
                tabList: 'gap-0',
                tab: 'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
                tabContent: 'text-sm font-bold',
                panel: 'w-full px-12',
              }}
            >
              <Tab key='monthly' title={t('proMode.modal.monthly')}>
                <div className='flex flex-col justify-center items-center'>
                  <p className='text-3xl font-bold mt-3 mb-6'>
                    $1.00
                    <span className='text-sm'>/mo</span>
                  </p>

                  <ExtLink href='https://buy.stripe.com/bJedRa2lQ7lc1vr9wacbC04' className='w-full'>
                    <div
                      className={cn(
                        'flex justify-center items-center w-full rounded-full font-medium',
                        'text-white text-md bg-[#5750DF] py-2.5 hover:bg-[#5750DF]/90 hover:scale-[1.02] duration-150',
                      )}
                    >
                      {t('proMode.modal.getStarted')}
                    </div>
                  </ExtLink>

                  <p className='text-xs text-altwhite mt-2'>{t('proMode.modal.cancelAnytime')}</p>
                </div>
              </Tab>

              <Tab
                key='yearly'
                title={
                  <div className='flex items-center gap-2'>
                    {t('proMode.modal.yearly')}
                    <div className='px-1 py-0.5 bg-[#5750DF] text-white rounded-sm text-xs font-normal uppercase'>
                      <p>{t('proMode.modal.trial')}</p>
                    </div>
                  </div>
                }
              >
                <div className='flex flex-col justify-center items-center'>
                  <p className='flex items-end text-3xl font-bold mt-3 mb-6'>
                    $0.75
                    <span className='text-sm'>/mo</span>
                    <div className='px-1 py-0.5 bg-[#5750DF] text-white rounded-sm text-xs font-normal ml-2 mb-2 uppercase'>
                      <p>{t('proMode.modal.bestValue')}</p>
                    </div>
                  </p>

                  <ExtLink href='https://buy.stripe.com/00w4gA5y26h81vrcImcbC06' className='w-full'>
                    <div
                      className={cn(
                        'flex justify-center items-center w-full rounded-full font-medium',
                        'text-white text-md bg-[#5750DF] py-2.5 hover:bg-[#5750DF]/90 hover:scale-[1.02] duration-150',
                      )}
                    >
                      {t('proMode.modal.startFreeTrial')}
                    </div>
                  </ExtLink>

                  <p className='text-xs text-altwhite mt-2'>{t('proMode.modal.cancelAnytime')}</p>
                </div>
              </Tab>
            </Tabs>

            <div className='mt-10 w-full max-w-xs text-sm'>
              <p className='font-semibold mb-3'>{t('proMode.modal.benefits')}</p>
              <ul className='space-y-1'>
                <li className='flex items-center gap-2'>
                  <FaCheck className='text-green-500' />
                  <span>{t('proMode.modal.removeAds')}</span>
                </li>
                <li className='flex items-center gap-2'>
                  <FaCheck className='text-green-500' />
                  <span>{t('proMode.modal.themes')}</span>
                </li>
                <li className='flex items-center gap-2'>
                  <FaCheck className='text-green-500' />
                  <span>{t('proMode.modal.uniqueChatRole')}</span>
                </li>
                <li className='flex items-center gap-2'>
                  <FaCheck className='text-green-500' />
                  <span>{t('proMode.modal.moreBenefits')}</span>
                </li>
              </ul>
            </div>

            <Image src='/powered-by-stripe.svg' alt='Powered by Stripe' className='mt-6' width={130} height={50} />
            <p className='text-[10px] text-altwhite mt-2'>{t('proMode.modal.footer')}</p>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
