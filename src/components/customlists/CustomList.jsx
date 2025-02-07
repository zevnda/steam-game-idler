import { Fragment, useState } from 'react';

import { Button } from '@heroui/react';
import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAutomate } from '@/src/hooks/automation/useAutomateButtons';
import useCustomList from '@/src/hooks/customlists/useCustomList';
import GameCard from '@/src/components/ui/GameCard';
import GameSettings from '@/src/components/gameslist/GameSettings';
import EditListModal from '@/src/components/customlists/EditListModal';

import { MdEdit } from 'react-icons/md';
import { TbCardsFilled } from 'react-icons/tb';
import { FaAward } from 'react-icons/fa';
import ManualAdd from './ManualAdd';

const listTypes = {
    favoritesList: {
        title: 'Favorites',
        description: 'Your favorite games',
        icon: <MdEdit fontSize={20} />,
        startButton: null,
        manualAdd: true,
    },
    cardFarmingList: {
        title: 'Card Farming',
        description: 'Add games to this list to farm their trading cards',
        icon: <TbCardsFilled fontSize={20} />,
        startButton: 'startCardFarming',
    },
    autoIdleList: {
        title: 'Auto Idle',
        description: 'Add games to this list to automatically idle them on launch',
        icon: <MdEdit fontSize={20} />,
        startButton: null,
    },
    achievementUnlockerList: {
        title: 'Achievement Unlocker',
        description: 'Add games to this list to unlock their achievements',
        icon: <FaAward fontSize={18} />,
        startButton: 'startAchievementUnlocker',
    },
};

export default function CustomList({ type }) {
    const {
        list,
        setList,
        visibleGames,
        filteredGamesList,
        containerRef,
        setSearchTerm,
        showInList,
        setShowInList,
        handleAddGame,
        handleRemoveGame,
        updateListOrder
    } = useCustomList(type);
    const { startCardFarming, startAchievementUnlocker } = useAutomate();
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

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

    const listType = listTypes[type];

    if (!listType) {
        return <p>Invalid list type</p>;
    };

    return (
        <Fragment>
            <div className='w-calc min-h-calc max-h-calc overflow-y-auto overflow-x-hidden' ref={containerRef}>
                <div className={`fixed flex justify-between items-center w-[calc(100svw-66px)] py-2 pl-4 bg-base bg-opacity-90 backdrop-blur-md z-10 ${list.slice(0, visibleGames).length >= 21 ? 'pr-4' : 'pr-2'}`}>
                    <div className='flex flex-col'>
                        <p className='text-lg font-semibold'>
                            {listType.title}
                        </p>
                        <p className='text-xs text-gray-400'>
                            {listType.description}
                        </p>
                    </div>

                    <div className='flex space-x-2'>
                        {listType.startButton && (
                            <Button
                                size='sm'
                                color='primary'
                                className='rounded-full font-semibold'
                                startContent={listType.icon}
                                onPress={listType.startButton === 'startCardFarming' ? startCardFarming : startAchievementUnlocker}
                            >
                                Start {listType.title}
                            </Button>
                        )}
                        {listType.manualAdd && (
                            <ManualAdd setList={setList} />
                        )}
                        <Button
                            size='sm'
                            color='primary'
                            className='rounded-full font-semibold'
                            startContent={<MdEdit fontSize={20} />}
                            onPress={() => setEditModalOpen(true)}
                        >
                            Edit List
                        </Button>
                    </div>
                </div>

                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={list.map(item => item.appid)}>
                        <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 mt-[52px]'>
                            {list && list.slice(0, visibleGames).map((item) => (
                                <SortableGameCard
                                    key={item.appid}
                                    item={item}
                                    sortedGamesList={list}
                                    visibleGames={visibleGames}
                                    setSettingsModalOpen={setSettingsModalOpen}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            <GameSettings isOpen={isSettingsModalOpen} onOpenChange={setSettingsModalOpen} />

            <EditListModal
                isOpen={isEditModalOpen}
                onOpenChange={setEditModalOpen}
                onClose={() => {
                    setSearchTerm('');
                    setShowInList(false);
                }}
                filteredGamesList={filteredGamesList}
                list={list}
                setSearchTerm={setSearchTerm}
                showInList={showInList}
                setShowInList={setShowInList}
                handleAddGame={handleAddGame}
                handleRemoveGame={handleRemoveGame}
                setList={setList}
                type={type}
            />
        </Fragment>
    );
}

function SortableGameCard({ item, sortedGamesList, visibleGames, setSettingsModalOpen }) {
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
                setSettingsModalOpen={setSettingsModalOpen}
            />
        </div>
    );
}