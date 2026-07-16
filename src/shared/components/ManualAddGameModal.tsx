import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal, Typography } from '@heroui/react'

interface ManualAddGameModalProps {
  isOpen: boolean
  existingAppIds: number[]
  onOpenChange: (open: boolean) => void
  onAdd: (game: { appId: number; name: string }) => void | Promise<void>
}

// Shared across Favorites/CardFarming/AchievementUnlocker/AutoIdle's header "add manually" button
// - restores the pre-v6.0 custom-lists escape hatch for content the owned-games import doesn't
// surface (e.g. Steam movies/videos, which the curated real-games whitelist drops). Deliberately
// no Steam lookup here - raw user-typed name + App ID, same as the old ManualAddModal, since the
// whole point is supporting content Steam's own APIs may not cleanly resolve either.
export const ManualAddGameModal = ({
  isOpen,
  existingAppIds,
  onOpenChange,
  onAdd,
}: ManualAddGameModalProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [appIdInput, setAppIdInput] = useState('')
  const [duplicateError, setDuplicateError] = useState(false)

  const handleClose = () => {
    setName('')
    setAppIdInput('')
    setDuplicateError(false)
    onOpenChange(false)
  }

  const parsedAppId = Number(appIdInput)
  const isValidAppId = appIdInput.trim() !== '' && Number.isInteger(parsedAppId) && parsedAppId > 0
  const canSubmit = name.trim() !== '' && isValidAppId

  const handleAdd = async () => {
    if (!canSubmit) return
    if (existingAppIds.includes(parsedAppId)) {
      setDuplicateError(true)
      return
    }
    await onAdd({ appId: parsedAppId, name: name.trim() })
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && handleClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{t('common.manualAdd.title')}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <div className='flex flex-col gap-3'>
                <Typography color='muted' type='body-sm'>
                  {t('common.manualAdd.description')}
                </Typography>
                <div className='flex flex-col gap-1.5'>
                  <Typography type='body-sm' weight='semibold'>
                    {t('common.manualAdd.nameLabel')}
                  </Typography>
                  <Input
                    autoFocus
                    placeholder={t('common.manualAdd.namePlaceholder')}
                    value={name}
                    onChange={event => setName(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Typography type='body-sm' weight='semibold'>
                    {t('common.manualAdd.appIdLabel')}
                  </Typography>
                  <Input
                    placeholder={t('common.manualAdd.appIdPlaceholder')}
                    type='number'
                    value={appIdInput}
                    onChange={event => {
                      setAppIdInput(event.target.value)
                      setDuplicateError(false)
                    }}
                    onKeyDown={event => event.key === 'Enter' && handleAdd()}
                  />
                  {duplicateError && (
                    <Typography className='text-danger' type='body-xs'>
                      {t('common.manualAdd.duplicateError')}
                    </Typography>
                  )}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button size='sm' variant='secondary' onPress={handleClose}>
                {t('common.actions.cancel')}
              </Button>
              <Button size='sm' isDisabled={!canSubmit} onPress={handleAdd}>
                {t('common.actions.add')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
