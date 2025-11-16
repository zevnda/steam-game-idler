import type { Game } from '@/types'
import type { Dispatch, KeyboardEvent, ReactElement, SetStateAction } from 'react'

import { Button, cn, Input, NumberInput, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbPlus } from 'react-icons/tb'

import CustomModal from '@/components/ui/CustomModal'
import useManualAdd from '@/hooks/customlists/useManualAdd'

interface ManualAddProps {
  listName: string
  setList: Dispatch<SetStateAction<Game[]>>
}

export default function ManualAdd({ listName, setList }: ManualAddProps): ReactElement {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const manualAdd = useManualAdd(listName, setList)

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>, onClose: () => void): void => {
    if (e.key === 'Enter') {
      manualAdd.handleAdd(onClose)
    }
  }

  const handleClose = (): void => {
    manualAdd.setAppNameValue('')
    manualAdd.setAppIdValue(0)
  }

  return (
    <>
      <Button
        isIconOnly
        className='bg-btn-secondary text-btn-text font-bold'
        radius='full'
        startContent={<TbPlus fontSize={18} />}
        onPress={onOpen}
      />

      <CustomModal
        isOpen={isOpen}
        onOpenChange={() => {
          onOpenChange()
          handleClose()
        }}
        title={t('customLists.manualAdd.title')}
        body={
          <>
            <Input
              autoFocus
              placeholder={t('customLists.manualAdd.gameName')}
              value={manualAdd.appNameValue || ''}
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'group-data-[focus-within=true]:!bg-inputhover',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                ),
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              onChange={manualAdd.handleNameChange}
              onKeyDown={e => handleKeyPress(e, onOpenChange)}
            />

            <NumberInput
              hideStepper
              label={t('customLists.manualAdd.gameId')}
              value={Number(manualAdd.appIdValue)}
              formatOptions={{ useGrouping: false }}
              aria-label='manual add'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'group-data-[focus-within=true]:!bg-inputhover',
                  'group-data-[focus-visible=true]:ring-transparent',
                  'group-data-[focus-visible=true]:ring-offset-transparent',
                ),
                input: ['text-sm !text-content placeholder:text-altwhite/50'],
              }}
              onChange={e => manualAdd.handleIdChange(e)}
              onKeyDown={e => handleKeyPress(e, onOpenChange)}
            />
          </>
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
              isLoading={manualAdd.isLoading}
              isDisabled={!manualAdd.appNameValue || !manualAdd.appIdValue}
              onPress={() => manualAdd.handleAdd(onOpenChange)}
            >
              {t('common.add')}
            </Button>
          </>
        }
      />
    </>
  )
}
