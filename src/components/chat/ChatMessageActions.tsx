import type { ReactElement } from 'react'

import { Button, cn, useDisclosure } from '@heroui/react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FaPencilAlt, FaReply, FaThumbtack, FaTrashAlt, FaUserAltSlash } from 'react-icons/fa'

import CustomModal from '@/components/ui/CustomModal'

interface ChatMessageActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  onPin?: () => void
  onUnpin?: () => void
  isPinned?: boolean
  isAdmin?: boolean
  onReply?: () => void
  onBan?: () => void
}

export default function ChatMessageActions({
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  isPinned,
  isAdmin,
  onReply,
  onBan,
}: ChatMessageActionsProps): ReactElement {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [action, setAction] = useState('')

  const handleShowModal = (onOpen: () => void, action: string): void => {
    setAction(action)
    onOpen()
  }

  return (
    <div className='absolute right-4 -top-2 flex opacity-0 group-hover:opacity-100 z-10 bg-[#181818] rounded-sm border border-[#1e1e1e]'>
      {isAdmin && (
        <Button
          isIconOnly
          radius='none'
          className={cn(
            'bg-transparent h-6 w-5 flex items-center justify-center',
            'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
          )}
          startContent={<FaThumbtack size={12} className={isPinned ? 'text-yellow-400' : 'text-altwhite'} />}
          onPress={isPinned ? onUnpin : onPin}
          aria-label={isPinned ? 'Unpin message' : 'Pin message'}
        />
      )}
      <Button
        isIconOnly
        radius='none'
        className={cn(
          'bg-transparent h-6 w-5 flex items-center justify-center',
          'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
        )}
        startContent={<FaReply size={12} className='text-altwhite' />}
        onPress={onReply}
        aria-label='Reply to message'
      />
      {onEdit && (
        <Button
          isIconOnly
          radius='none'
          className={cn(
            'bg-transparent h-6 w-5 flex items-center justify-center',
            'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
          )}
          startContent={<FaPencilAlt size={12} className='text-altwhite' />}
          onPress={onEdit}
        />
      )}
      {onDelete && (
        <Button
          isIconOnly
          radius='none'
          className={cn(
            'bg-transparent h-6 w-5 flex items-center justify-center',
            'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
          )}
          startContent={<FaTrashAlt size={12} className='text-[#f23f43]' />}
          onPress={e => {
            if (e.shiftKey) {
              onDelete()
            } else {
              handleShowModal(onOpen, 'delete')
            }
          }}
        />
      )}
      {isAdmin && onBan && (
        <Button
          isIconOnly
          radius='none'
          className={cn(
            'bg-transparent h-6 w-5 flex items-center justify-center',
            'focus:outline-none duration-75 hover:scale-[1.2] transition-all',
          )}
          startContent={<FaUserAltSlash size={14} className='text-[#f23f43]' />}
          onPress={() => handleShowModal(onOpen, 'ban')}
        />
      )}

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={
          <p className='text-sm'>
            <Trans
              i18nKey='chat.messageAction.modal'
              values={{
                action: action === 'delete' ? t('chat.messageAction.delete') : t('chat.messageAction.ban'),
              }}
            >
              Are you sure you want to <strong>{action}</strong>?
            </Trans>
          </p>
        }
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                if (action === 'delete') {
                  if (onDelete) {
                    onDelete()
                    onOpenChange()
                  }
                } else {
                  if (onBan) {
                    onBan()
                    onOpenChange()
                  }
                }
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </div>
  )
}
