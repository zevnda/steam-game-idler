import { Fragment } from 'react';
import Image from 'next/image';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input } from '@heroui/react';
import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import useCustomList from '@/src/hooks/customlists/useCustomList';
import GameCard from '@/src/components/customlists/GameCard';

import { MdCheck, MdEdit } from 'react-icons/md';

export default function FavoritesList() {
    const { list: favoritesList, setList, visibleGames, filteredGamesList, containerRef, setSearchTerm, handleAddGame, handleRemoveGame, updateListOrder } = useCustomList('favoritesList');
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setList((items) => {
                const oldIndex = items.findIndex(item => item.appid === active.id);
                const newIndex = items.findIndex(item => item.appid === over.id);
                const newList = arrayMove(items, oldIndex, newIndex);
                updateListOrder(newList);
                return newList;
            });
        }
    };

    return (
        <Fragment>
            <div className='w-calc min-h-calc max-h-calc overflow-y-auto overflow-x-hidden' ref={containerRef}>
                <div className={`fixed flex justify-between items-center w-[calc(100svw-66px)] py-2 pl-4 bg-base bg-opacity-90 backdrop-blur-md z-10 ${favoritesList.slice(0, visibleGames).length >= 21 ? 'pr-4' : 'pr-2'}`}>
                    <div className='flex flex-col'>
                        <p className='text-lg font-semibold'>
                            Favorites
                        </p>
                        <p className='text-xs text-gray-400'>
                            Your favorite games
                        </p>
                    </div>

                    <div className='flex space-x-2'>
                        <Button
                            size='sm'
                            color='primary'
                            className='rounded-full font-semibold'
                            startContent={<MdEdit fontSize={20} />}
                            onPress={onOpen}
                        >
                            Edit List
                        </Button>
                    </div>
                </div>

                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={favoritesList.map(item => item.appid)}>
                        <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 mt-[52px]'>
                            {favoritesList && favoritesList.slice(0, visibleGames).map((item) => (
                                <SortableGameCard
                                    key={item.appid}
                                    item={item}
                                    sortedGamesList={favoritesList}
                                    visibleGames={visibleGames}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={() => setSearchTerm('')} hideCloseButton className='bg-container min-h-[75%] max-h-[75%]'>
                <ModalContent>
                    {(onClose) => (
                        <Fragment>
                            <ModalHeader className='flex bg-modalheader border-b border-border p-3' data-tauri-drag-region>
                                <Input
                                    clearable
                                    placeholder='Search for a game..'
                                    classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar'] }}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </ModalHeader>
                            <ModalBody className='relative p-0 gap-0'>
                                <div className='overflow-y-auto h-[343px]'>
                                    {filteredGamesList && filteredGamesList.map((item) => (
                                        <div
                                            key={item.appid}
                                            className={`flex justify-between items-center gap-2 hover:bg-containerhover cursor-pointer px-3 py-1 duration-150 select-none ${favoritesList.some(game => game.appid === item.appid) && 'opacity-30'}`}
                                            onClick={() => favoritesList.some(game => game.appid === item.appid) ? handleRemoveGame(item) : handleAddGame(item)}
                                        >
                                            <div className='flex items-center gap-2 max-w-[350px]'>
                                                <Image
                                                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                                                    className='aspect-[62/29]'
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
                                                {favoritesList.some(game => game.appid === item.appid) && (
                                                    <MdCheck fontSize={20} className='text-green-500' />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer p-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='rounded-md font-semibold'
                                    onPress={() => {
                                        localStorage.removeItem('favoritesListCache');
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

function SortableGameCard({ item, sortedGamesList, visibleGames }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.appid });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div className='cursor-grab' ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <GameCard
                item={item}
                sortedGamesList={sortedGamesList}
                visibleGames={visibleGames}
            />
        </div>
    );
}