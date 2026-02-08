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

export const CustomModal = ({
  isOpen,
  onOpenChange,
  className,
  classNames,
  title,
  body,
  buttons,
  hideCloseButton = false,
}: CustomModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton={hideCloseButton}
      className={cn('text-content bg-gradient-alt border border-border rounded-4xl', className)}
      classNames={{
        closeButton: 'mr-1.5 mt-1.5',
        body: 'p-0',
        ...classNames,
      }}
    >
      <ModalContent>
        <>
          <ModalHeader
            className='flex flex-col gap-1 border-b border-border/40'
            data-tauri-drag-region
          >
            {title}
          </ModalHeader>
          <ModalBody className='my-0 p-6 text-sm max-h-80 overflow-auto'>{body}</ModalBody>
          <ModalFooter className='border-t border-border/40 px-4 py-3'>{buttons}</ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}
