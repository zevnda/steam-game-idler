import { useState } from 'react'
import { FiCheck, FiCopy } from 'react-icons/fi'
import { TbDeviceDesktop } from 'react-icons/tb'
import { Button, cn, InputOtp } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { handlePusherConnect, useRemote } from '@/features/remote'
import { ExtLink, ProBadge } from '@/shared/components'
import { useRemoteStore, useUserStore } from '@/shared/stores'

export const Remote = () => {
  const [copied, setCopied] = useState(false)
  const { remoteCode, pusherClient, setPusherClient, setPusherChannel } = useRemoteStore()
  const { isPro } = useUserStore()
  const { showDropdown, setShowDropdown, openDropdown, dropdownRef } = useRemote()

  const handleCopy = async () => {
    if (!remoteCode) return
    try {
      await navigator.clipboard.writeText(remoteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className='relative'>
      <div
        className={cn(
          'flex items-center justify-center hover:bg-dynamic/10 h-9 w-12',
          'cursor-pointer active:scale-95 relative duration-150',
        )}
        onClick={openDropdown}
      >
        <TbDeviceDesktop fontSize={20} className='text-dynamic' />
      </div>

      <AnimatePresence>
        {showDropdown && remoteCode && (
          <>
            <motion.div
              className='fixed inset-0 bg-black opacity-50 z-998'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              ref={dropdownRef}
              className={cn(
                'absolute right-0 mx-auto mt-3 p-0 m-0 w-96 rounded-xl',
                'outline-none z-999 shadow-2xl bg-popover border border-border flex flex-col items-center',
              )}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className='flex flex-col w-full p-4'>
                <p className='font-bold text-xl mb-2'>
                  Remote Control{' '}
                  {isPro !== null && isPro === true && <ProBadge className='scale-60 -ml-1.5' />}
                </p>

                {!pusherClient && (
                  <div className='grid grid-cols-[auto,1fr] items-center gap-4 mb-4'>
                    <div className='flex flex-col items-start gap-2 w-full'>
                      <p className='text-sm text-altwhite'>
                        Easily control Steam Game Idler from anywhere using your phone or other
                        device
                      </p>
                    </div>
                    <video
                      className='rounded-xl min-w-60 border border-border'
                      src='/remote.mp4'
                      autoPlay
                      loop
                      muted
                    />
                  </div>
                )}

                {pusherClient && (
                  <div className='grid grid-cols-[auto,1fr] items-center gap-4 mb-4'>
                    <div className='flex flex-col items-center justify-center gap-2 w-full'>
                      <p className='text-sm text-altwhite'>
                        Open{' '}
                        <ExtLink
                          href='https://remote.steamgameidler.com/'
                          className='text-dynamic hover:text-dynamic-hover duration-150'
                        >
                          remote.steamgameidler.com
                        </ExtLink>{' '}
                        on your phone or other device and enter the code below to connect
                      </p>
                      <div className='flex items-center gap-2'>
                        <InputOtp
                          color={copied ? 'success' : 'default'}
                          size='sm'
                          isReadOnly
                          defaultValue={remoteCode || '------'}
                          length={6}
                        />
                        <Button
                          size='sm'
                          isIconOnly
                          startContent={
                            copied ? <FiCheck fontSize={18} /> : <FiCopy fontSize={18} />
                          }
                          className={cn('rounded-md', copied ? ' bg-green-500/50' : 'text-content')}
                          onPress={handleCopy}
                          type='button'
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  size='sm'
                  radius='full'
                  fullWidth
                  className={cn(
                    !pusherClient
                      ? 'bg-btn-secondary text-btn-text font-bold'
                      : 'bg-danger text-white font-bold',
                  )}
                  onPress={() => {
                    handlePusherConnect(
                      !!pusherClient,
                      remoteCode,
                      setPusherClient,
                      setPusherChannel,
                    )
                  }}
                >
                  {pusherClient ? 'Disable Remote Control' : 'Enable Remote Control'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
