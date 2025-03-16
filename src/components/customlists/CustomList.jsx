
import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { TbAward, TbCards, TbEdit } from 'react-icons/tb';

import EditListModal from '@/components/customlists/EditListModal';
import ManualAdd from '@/components/customlists/ManualAdd';
import GameSettings from '@/components/gameslist/GameSettings';
import GameCard from '@/components/ui/GameCard';
import { useAutomate } from '@/hooks/automation/useAutomateButtons';
import useCustomList from '@/hooks/customlists/useCustomList';

const listTypes = {
    favoritesList: {
        title: 'Favorites',
        description: 'Your favorite games',
        icon: <TbEdit fontSize={20} />,
        startButton: null,
    },
    cardFarmingList: {
        title: 'Card Farming',
        description: 'Add games to this list to farm their trading cards',
        icon: <TbCards fontSize={20} />,
        startButton: 'startCardFarming',
    },
    autoIdleList: {
        title: 'Auto Idle',
        description: 'Add games to this list to automatically idle them on launch',
        icon: <TbEdit fontSize={20} />,
        startButton: null,
    },
    achievementUnlockerList: {
        title: 'Achievement Unlocker',
        description: 'Add games to this list to unlock their achievements',
        icon: <TbAward fontSize={20} />,
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
        handleUpdateListOrder,
        handleClearList
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
                handleUpdateListOrder(newList);
                return newList;
            });
        }
    };

    const listType = listTypes[type];

    if (!listType) {
        return <p>Invalid list type</p>;
    };

    return (
        <>
            <div className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border' ref={containerRef}>
                <div className={`fixed flex justify-between items-center w-[calc(100svw-68px)] py-2 pl-4 bg-base bg-opacity-90 backdrop-blur-md z-10 rounded-tl-xl ${list.slice(0, visibleGames).length >= 21 ? 'pr-4' : 'pr-2'}`}>
                    <div className='flex flex-col'>
                        <p className='text-lg font-semibold'>
                            {listType.title}
                        </p>
                        <p className='text-xs text-altwhite'>
                            {listType.description}
                        </p>
                    </div>

                    <div className='flex space-x-2'>
                        {listType.startButton && (
                            <Button
                                size='sm'
                                className='rounded-full font-semibold bg-dynamic text-button'
                                startContent={listType.icon}
                                onPress={listType.startButton === 'startCardFarming' ? startCardFarming : startAchievementUnlocker}
                            >
                                Start {listType.title}
                            </Button>
                        )}

                        <ManualAdd listName={type} setList={setList} />

                        <Button
                            size='sm'
                            className='rounded-full font-semibold bg-dynamic text-button'
                            startContent={<TbEdit fontSize={20} />}
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
                handleClearList={handleClearList}
                setList={setList}
                type={type}
            />
        </>
    );
}

function SortableGameCard({ item, setSettingsModalOpen }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.appid });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div className='cursor-grab' ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <GameCard
                item={item}
                setSettingsModalOpen={setSettingsModalOpen}
            />
        </div>
    );
}