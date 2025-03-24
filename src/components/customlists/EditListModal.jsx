import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';
import Image from 'next/image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCheck } from 'react-icons/tb';
import { FixedSizeList as List } from 'react-window';

const Row = memo(({ index, style, data }) => {
    const { filteredGamesList, list, handleAddGame, handleRemoveGame } = data;
    const item = filteredGamesList[index];

    const handleImageError = (event) => {
        event.target.src = '/fallback.jpg';
    };

    return (
        <div
            style={style}
            className={`flex justify-between items-center gap-2 hover:bg-containerhover cursor-pointer px-3 py-1 duration-150 select-none ${list.some(game => game.appid === item.appid) && 'opacity-50 dark:opacity-30'}`}
            onClick={() => list.some(game => game.appid === item.appid) ? handleRemoveGame(item) : handleAddGame(item)}
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
                <p className='text-sm truncate mr-8'>
                    {item.name}
                </p>
            </div>
            <div className='flex justify-center items-center'>
                {list.some(game => game.appid === item.appid) && (
                    <TbCheck fontSize={20} className='text-success' />
                )}
            </div>
        </div>
    );
});

Row.displayName = 'Row';

export default function EditListModal({ isOpen, onOpenChange, onClose, filteredGamesList, list, setSearchTerm, showInList, setShowInList, handleAddGame, handleAddAllGames, handleRemoveGame, handleClearList, type }) {
    const { t } = useTranslation();
    const itemData = { filteredGamesList, list, handleAddGame, handleRemoveGame };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} hideCloseButton className='bg-modalbody min-h-[75%] max-h-[75%] text-content min-w-[40%]' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className='flex gap-2 bg-modalheader border-b border-border p-3'>
                            <Input
                                autoFocus
                                isClearable
                                size='sm'
                                placeholder={t('search.games')}
                                classNames={{
                                    inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                    input: ['!text-content placeholder:text-altwhite/50'],
                                }}
                                isDisabled={showInList}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClear={() => setSearchTerm('')}
                            />
                            <div className='flex items-center gap-2'>
                                <Button
                                    size='sm'
                                    className={`rounded-full font-semibold ${showInList ? 'bg-green-400/40 text-green-600' : 'bg-gray-500/40 text-button'}`}
                                    isDisabled={list.length === 0}
                                    startContent={<TbCheck fontSize={18} className={showInList ? 'text-green-600' : 'text-button'} />}
                                    onPress={() => setShowInList(!showInList)}
                                >
                                    {t('customLists.inList')}
                                </Button>
                                {type === 'achievementUnlockerList' && (
                                    <Button
                                        size='sm'
                                        className='rounded-full font-semibold bg-dynamic text-button'
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
                                itemData={showInList ? { ...itemData, filteredGamesList: list } : itemData}
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
                            <Button
                                size='sm'
                                className='rounded-lg font-semibold bg-dynamic text-button'
                                onPress={onClose}
                            >
                                {t('common.done')}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}