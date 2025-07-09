import type { ReactElement, ReactNode } from 'react'

import { cn, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'

interface CustomModalProps {
  isOpen?: boolean
  onOpen?: () => void
  onOpenChange?: () => void
  className?: string
  title: ReactNode | string
  body: ReactNode | string
  buttons: ReactNode
  hideCloseButton?: boolean
}

export default function CustomModal({
  isOpen,
  onOpen,
  onOpenChange,
  className,
  title,
  body,
  buttons,
  hideCloseButton = false,
}: CustomModalProps): ReactElement {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton={hideCloseButton}
      className={cn('text-content', className)}
      classNames={{
        closeButton: 'text-altwhite hover:bg-item-hover/40 duration-200 active:bg-item-hover/50',
        base: 'bg-base/85 backdrop-blur-sm',
        body: 'p-0',
      }}
    >
      <ModalContent>
        {/* {(onClose: () => void) => ( */}
        <>
          <ModalHeader className='flex flex-col gap-1 border-b border-border/40' data-tauri-drag-region>
            {title}
          </ModalHeader>
          <ModalBody className='my-0 p-6 text-sm max-h-80 overflow-auto'>{body}</ModalBody>
          <ModalFooter className='border-t border-border/40 px-4 py-3'>{buttons}</ModalFooter>
        </>
        {/* )} */}
      </ModalContent>
    </Modal>
  )
}
