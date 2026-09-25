import type { ReactNode } from 'react'
import { Modal } from '@heroui/react'

interface AccountStatusModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// Shared shell for the popups that surface on their own when something happens to an agent-mode
// account's session - ReauthModal (session lost, action needed) and PlayingElsewhereModal (paused,
// nothing to do). Kept as two separate popups on purpose, only the shell is shared: "you need to
// act" vs. "this sorts itself out" is exactly what the user needs to tell apart at a glance, so
// their content/actions deliberately stay distinct.
export const AccountStatusModal = ({
  isOpen,
  onClose,
  title,
  children,
}: AccountStatusModalProps) => (
  <Modal isOpen={isOpen} onOpenChange={open => !open && onClose()}>
    <Modal.Backdrop>
      <Modal.Container size='md'>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
            <Modal.CloseTrigger />
          </Modal.Header>
          <Modal.Body>{children}</Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
)
