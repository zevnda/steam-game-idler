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
      className={cn('bg-modalbody text-content', className)}
      classNames={{
        closeButton: 'text-altwhite hover:bg-titlehover duration-200 active:bg-titlehover/50',
      }}
    >
      <ModalContent>
        {/* {(onClose: () => void) => ( */}
        <>
          <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
            {title}
          </ModalHeader>
          <ModalBody className='my-4 text-sm max-h-80 overflow-auto'>{body}</ModalBody>
          <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>{buttons}</ModalFooter>
        </>
        {/* )} */}
      </ModalContent>
    </Modal>
  )
}
