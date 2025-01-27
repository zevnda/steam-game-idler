import { Fragment, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';
import Image from 'next/image';
import { MdCheck } from 'react-icons/md';

const Row = memo(({ index, style, data }) => {
    const { filteredGamesList, list, handleAddGame, handleRemoveGame } = data;
    const item = filteredGamesList[index];

    return (
        <div
            style={style}
            className={`flex justify-between items-center gap-2 hover:bg-containerhover cursor-pointer px-3 py-1 duration-150 select-none ${list.some(game => game.appid === item.appid) && 'opacity-30'}`}
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
                />
                <p className='text-sm truncate mr-8'>
                    {item.name}
                </p>
            </div>
            <div className='flex justify-center items-center'>
                {list.some(game => game.appid === item.appid) && (
                    <MdCheck fontSize={20} className='text-green-500' />
                )}
            </div>
        </div>
    );
});

Row.displayName = 'Row';

export default function EditListModal({ isOpen, onOpenChange, onClose, filteredGamesList, list, setSearchTerm, handleAddGame, handleRemoveGame, setList, type }) {
    const itemData = { filteredGamesList, list, handleAddGame, handleRemoveGame };

    return (
        <Fragment>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} hideCloseButton className='bg-container min-h-[75%] max-h-[75%]'>
                <ModalContent>
                    {(onClose) => (
                        <Fragment>
                            <ModalHeader className='flex bg-modalheader border-b border-border p-3' data-tauri-drag-region>
                                <Input
                                    size='sm'
                                    clearable
                                    placeholder='Search for a game..'
                                    classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar'] }}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </ModalHeader>
                            <ModalBody className='relative p-0 gap-0 overflow-y-auto'>
                                <List
                                    height={window.innerHeight - 225}
                                    itemCount={filteredGamesList.length}
                                    itemSize={37}
                                    width={'100%'}
                                    itemData={itemData}
                                >
                                    {Row}
                                </List>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer p-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='rounded-md font-semibold'
                                    onPress={() => {
                                        localStorage.removeItem(`${type}Cache`);
                                        setList([]);
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='rounded-md font-semibold'
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