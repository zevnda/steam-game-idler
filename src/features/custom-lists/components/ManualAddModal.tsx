import type { Game } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { TbPlus } from 'react-icons/tb'
import { Button, cn, Input, NumberInput, useDisclosure } from '@heroui/react'
import { useManualAdd } from '@/features/custom-lists/hooks/useManualAdd'
import { CustomModal } from '@/shared/components/CustomModal'
import { OpenDocs } from '@/shared/components/OpenDocs'

interface ManualAddModalProps {
  listTitle: string
  listName: string
  setList: React.Dispatch<React.SetStateAction<Game[]>>
}

export function ManualAddModal({ listTitle, listName, setList }: ManualAddModalProps) {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const {
    isLoading,
    appNameValue,
    appIdValue,
    setAppNameValue,
    setAppIdValue,
    handleNameChange,
    handleIdChange,
    handleAdd,
  } = useManualAdd(listName, setList)

  return (
    <>
      <Button
        className='bg-btn-secondary text-btn-text font-bold'
        radius='full'
        startContent={<TbPlus size={18} />}
        onPress={onOpen}
      >
        {t('common.add')}
      </Button>
      <CustomModal
        isOpen={isOpen}
        onOpenChange={() => {
          setAppNameValue('')
          setAppIdValue(0)
          onOpenChange()
        }}
        title={
          <div className='flex items-center gap-2'>
            <p>{t('customLists.manualAdd.title')}</p>
            <OpenDocs path='/features/custom-lists#manual-add' />
          </div>
        }
        body={
          <div className='flex flex-col gap-3'>
            <Input
              label={t('customLists.manualAdd.gameName')}
              labelPlacement='outside'
              placeholder={t('customLists.manualAdd.gameName')}
              value={appNameValue}
              onChange={handleNameChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && appNameValue && appIdValue) handleAdd(onOpenChange)
              }}
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
            />
            <NumberInput
              label={t('customLists.manualAdd.gameId')}
              labelPlacement='outside'
              placeholder='0'
              value={appIdValue}
              onValueChange={v => handleIdChange(v)}
              hideStepper
              onKeyDown={e => {
                if (e.key === 'Enter' && appNameValue && appIdValue) handleAdd(onOpenChange)
              }}
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
            />
          </div>
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
              isDisabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              isLoading={isLoading}
              isDisabled={!appNameValue || !appIdValue}
              onPress={() => handleAdd(onOpenChange)}
            >
              {t('common.add')}
            </Button>
          </>
        }
      />
    </>
  )
}
