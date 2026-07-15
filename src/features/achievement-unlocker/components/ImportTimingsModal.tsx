import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal, Typography } from '@heroui/react'

interface ImportTimingsModalProps {
  isOpen: boolean
  isImporting: boolean
  onOpenChange: (open: boolean) => void
  onImport: (steamInput: string) => Promise<boolean>
}

// Gamer-tier gated by its one caller (AchievementOrderOverlay's button that opens this) - this
// modal itself has no tier awareness, same "gate at the one call site" convention every other
// Pro-tier gate in this codebase already follows.
export const ImportTimingsModal = ({
  isOpen,
  isImporting,
  onOpenChange,
  onImport,
}: ImportTimingsModalProps) => {
  const { t } = useTranslation()
  const [steamInput, setSteamInput] = useState('')

  const handleClose = () => {
    setSteamInput('')
    onOpenChange(false)
  }

  const handleImport = async () => {
    if (!steamInput.trim()) return
    const ok = await onImport(steamInput.trim())
    if (ok) handleClose()
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && handleClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t('dashboard.achievementUnlocker.importTimings.title')}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <div className='flex flex-col gap-3'>
                <Typography color='muted' type='body-sm'>
                  {t('dashboard.achievementUnlocker.importTimings.description')}
                </Typography>
                <Input
                  autoFocus
                  placeholder={t('dashboard.achievementUnlocker.importTimings.inputPlaceholder')}
                  value={steamInput}
                  onChange={event => setSteamInput(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && handleImport()}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button isDisabled={isImporting} variant='secondary' onPress={handleClose}>
                {t('common.actions.cancel')}
              </Button>
              <Button
                isDisabled={!steamInput.trim()}
                isPending={isImporting}
                onPress={handleImport}
              >
                {t('dashboard.achievementUnlocker.importTimings.importButton')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
