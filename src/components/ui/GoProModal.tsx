import type { ReactElement } from 'react'

import { cn, Modal, ModalBody, ModalContent, Tab, Tabs } from '@heroui/react'
import Image from 'next/image'
import { FaCheck } from 'react-icons/fa6'

import { useStateContext } from '@/components/contexts/StateContext'
import ExtLink from '@/components/ui/ExtLink'
import ProBadge from '@/components/ui/ProBadge'

export default function GoProModal(): ReactElement {
  const { proModalOpen, setProModalOpen } = useStateContext()

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
            <p className='font-bold border border-border px-1.5 py-1 rounded-lg mb-4 text-sm'>
              Steam Game Idler
              <ProBadge />
            </p>
            <p className='text-3xl font-black uppercase mb-6'>Select A Plan</p>

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
              <Tab key='monthly' title='Monthly'>
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
                      Get Started
                    </div>
                  </ExtLink>

                  <p className='text-xs text-altwhite mt-2'>Cancel anytime</p>
                </div>

                <div className='mt-10 w-full max-w-xs text-sm'>
                  <p className='font-semibold mb-3'>Features</p>
                  <ul className='space-y-1'>
                    <li className='flex items-center gap-2'>
                      <FaCheck className='text-green-500' />
                      <span>Remove in app ads</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <FaCheck className='text-green-500' />
                      <span>Unique chat role and color</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <FaCheck className='text-green-500' />
                      <span>More benefits coming in the future</span>
                    </li>
                  </ul>
                </div>
              </Tab>

              <Tab
                key='yearly'
                title={
                  <div className='flex items-center gap-2'>
                    Yearly
                    <div className='px-1 py-0.5 bg-[#5750DF] text-white rounded-sm text-xs font-normal uppercase'>
                      <p>7-Day Trial</p>
                    </div>
                  </div>
                }
              >
                <div className='flex flex-col justify-center items-center'>
                  <p className='flex items-end text-3xl font-bold mt-3 mb-6'>
                    $0.75
                    <span className='text-sm'>/mo</span>
                    <div className='px-1 py-0.5 bg-[#5750DF] text-white rounded-sm text-xs font-normal ml-2 mb-2 uppercase'>
                      <p>Best value</p>
                    </div>
                  </p>

                  <ExtLink href='https://buy.stripe.com/00w4gA5y26h81vrcImcbC06' className='w-full'>
                    <div
                      className={cn(
                        'flex justify-center items-center w-full rounded-full font-medium',
                        'text-white text-md bg-[#5750DF] py-2.5 hover:bg-[#5750DF]/90 hover:scale-[1.02] duration-150',
                      )}
                    >
                      Start Free Trial
                    </div>
                  </ExtLink>

                  <p className='text-xs text-altwhite mt-2'>Cancel anytime</p>
                </div>

                <div className='mt-10 w-full max-w-xs text-sm'>
                  <p className='font-semibold mb-3'>Features</p>
                  <ul className='space-y-1'>
                    <li className='flex items-center gap-2'>
                      <FaCheck className='text-green-500' />
                      <span>Remove in app ads</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <FaCheck className='text-green-500' />
                      <span>Unique chat role and color</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <FaCheck className='text-green-500' />
                      <span>More benefits coming in the future</span>
                    </li>
                  </ul>
                </div>
              </Tab>
            </Tabs>

            <Image src='/powered-by-stripe.svg' alt='Powered by Stripe' className='mt-6' width={130} height={50} />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
