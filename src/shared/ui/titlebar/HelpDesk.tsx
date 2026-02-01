import { Button, cn } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Trans } from 'react-i18next'
import { RiCustomerService2Line } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { useHelpDesk } from './hooks/useHelpDesk'

export const HelpDesk = () => {
  const { isOpen, showGuide, hasUnread, handleToggle, handleClose, setShowGuide } = useHelpDesk()

  return (
    <>
      <div className='relative'>
        {/* Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className='fixed inset-0 bg-black opacity-50 z-998'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
          )}
        </AnimatePresence>

        <div className='flex justify-center items-center'>
          {/* Pulsing highlight for focus guide */}
          {showGuide && (
            <span className='absolute z-1001 -top-2 left-1/2 -translate-x-1/2 pointer-events-none'>
              <span className='block h-12 w-12 rounded-full bg-dynamic/20 animate-ping ring-4 ring-dynamic/50' />
            </span>
          )}

          {/* Helpdesk icon */}
          <div
            className={cn(
              'flex justify-center items-center',
              'hover:bg-header-hover/10 h-9 w-12 px-2 duration-150 cursor-pointer',
              'hover:text-white transition-colors',
              isOpen && 'text-primary',
              showGuide && 'z-1002 relative pointer-events-none',
            )}
            onClick={handleToggle}
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleToggle()
              }
            }}
          >
            <RiCustomerService2Line fontSize={18} className='text-content' />

            {hasUnread && (
              <span className='absolute top-2 right-3 h-2 w-2 rounded-full bg-danger z-10' />
            )}
          </div>
        </div>
      </div>

      {/* Focused Guide Overlay */}
      {showGuide && (
        <>
          <div
            aria-label='Close helpdesk guide'
            className='fixed inset-0 bg-black/60 z-1000 pointer-events-auto'
            onClick={() => setShowGuide(false)}
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowGuide(false)
              }
            }}
          />

          {/* Floating card with arrow */}
          <div className='fixed top-13 right-36 z-1002 flex flex-col items-end'>
            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className='relative w-120 bg-sidebar/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-border text-content'
            >
              <p className='leading-relaxed text-sm mr-6'>
                <Trans
                  i18nKey='titlebar.help_desk.first_time_message'
                  components={{
                    title: <span className='font-semibold text-lg' />,
                    body: <span className='block mt-2' />,
                    iconWrapper: <span className='inline-flex align-middle text-dynamic' />,
                    icon: <RiCustomerService2Line size={20} className='mx-1 inline-' />,
                  }}
                />
              </p>

              <Button
                isIconOnly
                radius='full'
                className='absolute -top-2 right-1 bg-transparent hover:bg-item-hover text-black font-semibold mt-3'
                startContent={<TbX size={18} color='white' />}
                onPress={() => setShowGuide(false)}
              />
            </motion.div>
          </div>
        </>
      )}
    </>
  )
}
