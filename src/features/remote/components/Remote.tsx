import { useState } from 'react'
import { FiCheck, FiCopy } from 'react-icons/fi'
import { TbDeviceMobile } from 'react-icons/tb'
import { Button, cn, InputOtp } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRemote } from '@/features/remote'

export const Remote = () => {
  const [copied, setCopied] = useState(false)
  const { code, showDropdown, openDropdown, closeDropdown, dropdownRef } = useRemote()

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
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
          'flex items-center justify-center hover:bg-yellow-500/10 h-9 w-12',
          'cursor-pointer active:scale-95 relative duration-150',
        )}
        onClick={openDropdown}
      >
        <TbDeviceMobile fontSize={20} className='text-yellow-500' />
      </div>

      <AnimatePresence>
        {showDropdown && code && (
          <>
            <motion.div
              className='fixed inset-0 bg-black opacity-50 z-998'
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeDropdown}
            />
            <motion.div
              ref={dropdownRef}
              className={cn(
                'absolute right-0 mx-auto mt-3 w-96 p-0 m-0 rounded-xl',
                'outline-none z-999 shadow-2xl bg-popover border border-border flex flex-col items-center',
              )}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className='flex items-center justify-between h-10 rounded-t-xl px-6 border-b border-border w-full'>
                <p className='text-content font-semibold'>Remote Code</p>
              </div>
              <div className='flex flex-col items-center justify-center py-8 w-full'>
                <div className='flex items-center gap-2'>
                  <InputOtp
                    color={copied ? 'success' : 'default'}
                    size='sm'
                    isReadOnly
                    defaultValue={code || '------'}
                    length={6}
                  />
                  <Button
                    size='sm'
                    isIconOnly
                    startContent={copied ? <FiCheck fontSize={18} /> : <FiCopy fontSize={18} />}
                    className={cn('rounded-md', copied ? ' bg-green-500/50' : 'text-content')}
                    onPress={handleCopy}
                    type='button'
                  />
                </div>
                <p className='text-xs text-altwhite mt-2'>Use this code to connect your device</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
