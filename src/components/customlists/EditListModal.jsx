import { Fragment, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';
import Image from 'next/image';
import { TbCheck } from 'react-icons/tb';

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
            <div className='flex items-center gap-3 max-w-[350px]'>
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

export default function EditListModal({ isOpen, onOpenChange, onClose, filteredGamesList, list, setSearchTerm, showInList, setShowInList, handleAddGame, handleRemoveGame, setList, type }) {
    const itemData = { filteredGamesList, list, handleAddGame, handleRemoveGame };

    return (
        <Fragment>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} hideCloseButton className='bg-modalbody min-h-[75%] max-h-[75%] text-content'>
                <ModalContent>
                    {(onClose) => (
                        <Fragment>
                            <ModalHeader className='flex gap-2 bg-modalheader border-b border-border p-3'>
                                <Input
                                    autoFocus
                                    isClearable
                                    size='sm'
                                    placeholder='Search for a game..'
                                    classNames={{
                                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['!text-content'],
                                    }}
                                    isDisabled={showInList}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClear={() => setSearchTerm('')}
                                />
                                <Button
                                    size='sm'
                                    color='default'
                                    className={`rounded-full text-content ${showInList ? 'bg-green-400/40' : 'bg-dynamic'}`}
                                    isDisabled={list.length === 0}
                                    startContent={<TbCheck fontSize={34} className={showInList ? 'text-green-500' : 'text-altwhite'} />}
                                    onPress={() => setShowInList(!showInList)}
                                >
                                    In List
                                </Button>
                            </ModalHeader>
                            <ModalBody className='relative p-0 gap-0 overflow-y-auto'>
                                <List
                                    height={window.innerHeight - 225}
                                    itemCount={showInList ? list.length : filteredGamesList.length}
                                    itemSize={37}
                                    width={'100%'}
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
                                    onPress={() => {
                                        localStorage.removeItem(`${type}Cache`);
                                        setShowInList(false);
                                        setList([]);
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    size='sm'
                                    className='rounded-lg font-semibold bg-dynamic text-content'
                                    onPress={onClose}
                                >
                                    Done
                                </Button>
                            </ModalFooter>
                        </Fragment>
                    )}
                </ModalContent>
            </Modal>
        </Fragment>
    );
}