import type { ModalProps } from '@heroui/react'
import { cn, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

interface CustomModalProps {
  isOpen?: boolean
  onOpenChange?: () => void
  className?: string
  classNames?: ModalProps['classNames']
  title?: React.ReactNode | string
  body: React.ReactNode | string
  buttons?: React.ReactNode
  hideCloseButton?: boolean
}

export function CustomModal({
  isOpen,
  onOpenChange,
  className,
  classNames,
  title,
  body,
  buttons,
  hideCloseButton = false,
}: CustomModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton={hideCloseButton}
      className={cn(
        'text-content bg-surface border border-border/20 rounded-3xl shadow-2xl',
        className,
      )}
      classNames={{
        closeButton: 'mr-2 mt-2 text-altwhite hover:text-content',
        body: 'p-0',
        ...classNames,
      }}
    >
      <ModalContent>
        <>
          <ModalHeader
            className='flex flex-col gap-1 px-6 pt-5 pb-4 border-b border-border/20'
            data-tauri-drag-region
          >
            {title}
          </ModalHeader>
          <ModalBody className='my-0 px-6 py-5 text-sm max-h-80 overflow-auto'>{body}</ModalBody>
          <ModalFooter className='border-t border-border/20 px-6 py-4'>{buttons}</ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}
