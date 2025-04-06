import type { Game } from '@/types'
import type { CSSProperties, Dispatch, ReactElement, SetStateAction, SyntheticEvent } from 'react'

import { Button, cn, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { memo } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbCheck } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'

interface RowData {
  filteredGamesList: Game[]
  list: Game[]
  handleAddGame: (game: Game) => void
  handleRemoveGame: (game: Game) => void
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement => {
  const { filteredGamesList, list, handleAddGame, handleRemoveGame } = data
  const item = filteredGamesList[index]

  const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>): void => {
    ;(event.target as HTMLImageElement).src = '/fallback.jpg'
  }

  return (
    <div
      style={style}
      className={cn(
        'flex justify-between items-center gap-2',
        'hover:bg-modalbody-hover cursor-pointer px-3 py-1',
        'duration-150 select-none',
        list.some(game => game.appid === item.appid) && 'opacity-50',
      )}
      onClick={() => (list.some(game => game.appid === item.appid) ? handleRemoveGame(item) : handleAddGame(item))}
    >
      <div className='flex items-center gap-3 max-w-[90%]'>
        <Image
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
          className='aspect-[62/29] rounded-sm'
          width={62}
          height={29}
          alt={`${item.name} image`}
          priority={true}
          onError={handleImageError}
        />
        <p className='text-sm truncate mr-8'>{item.name}</p>
      </div>
      <div className='flex justify-center items-center'>
        {list.some(game => game.appid === item.appid) && <TbCheck fontSize={20} className='text-success' />}
      </div>
    </div>
  )
})

Row.displayName = 'Row'

interface EditListModalProps {
  type?: string
  list: Game[]
  isOpen: boolean
  filteredGamesList: Game[]
  showInList: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  setSearchTerm: (term: string) => void
  setShowInList: (show: boolean) => void
  handleAddGame: (game: Game) => void
  handleAddAllGames: (games: Game[]) => void
  handleRemoveGame: (game: Game) => void
  handleClearList: () => void
}

export default function EditListModal({
  type,
  list,
  isOpen,
  filteredGamesList,
  showInList,
  onOpenChange,
  onClose,
  setSearchTerm,
  setShowInList,
  handleAddGame,
  handleAddAllGames,
  handleRemoveGame,
  handleClearList,
}: EditListModalProps): ReactElement {
  const { t } = useTranslation()
  const itemData = {
    filteredGamesList,
    list,
    handleAddGame,
    handleRemoveGame,
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={onClose}
      hideCloseButton
      className='bg-modalbody min-h-[75%] max-h-[75%] text-content min-w-[40%]'
      classNames={{
        closeButton: ['text-altwhite hover:bg-titlehover duration-200'],
      }}
    >
      <ModalContent>
        {(onClose: () => void) => (
          <>
            <ModalHeader className='flex gap-2 bg-modalheader border-b border-border p-3'>
              <Input
                autoFocus
                isClearable
                size='sm'
                placeholder={t('search.games')}
                classNames={{
                  inputWrapper: cn(
                    'bg-input border border-border hover:!bg-inputhover rounded-lg',
                    'group-data-[focus-within=true]:!bg-inputhover',
                    'group-data-[focus-visible=true]:ring-transparent',
                    'group-data-[focus-visible=true]:ring-offset-transparent',
                  ),
                  input: ['!text-content placeholder:text-altwhite/50'],
                }}
                isDisabled={showInList}
                onChange={e => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  className={`rounded-full font-semibold ${showInList ? 'bg-green-400/40 text-green-600' : 'bg-gray-500/40 text-button-text'}`}
                  isDisabled={list.length === 0}
                  startContent={
                    <TbCheck fontSize={18} className={showInList ? 'text-green-600' : 'text-button-text'} />
                  }
                  onPress={() => setShowInList(!showInList)}
                >
                  {t('customLists.inList')}
                </Button>
                {type === 'achievementUnlockerList' && (
                  <Button
                    size='sm'
                    className='rounded-full font-semibold bg-dynamic text-button-text'
                    isDisabled={filteredGamesList.length === 0 || list.length === filteredGamesList.length}
                    onPress={() => handleAddAllGames(filteredGamesList)}
                  >
                    {t('customLists.addAll')}
                  </Button>
                )}
              </div>
            </ModalHeader>
            <ModalBody className='relative p-0 gap-0 overflow-y-auto'>
              <List
                height={window.innerHeight - 225}
                itemCount={showInList ? list.length : filteredGamesList.length}
                itemSize={37}
                width='100%'
                itemData={
                  showInList
                    ? {
                        ...itemData,
                        filteredGamesList: list,
                      }
                    : itemData
                }
              >
                {Row}
              </List>
            </ModalBody>
            <ModalFooter className='border-t border-border bg-modalfooter p-3'>
              <Button
                size='sm'
                color='danger'
                variant='light'
                className='rounded-lg font-semibold'
                onPress={handleClearList}
              >
                {t('common.clear')}
              </Button>
              <Button size='sm' className='rounded-lg font-semibold bg-dynamic text-button-text' onPress={onClose}>
                {t('common.done')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
