import React from 'react';
import { Button, Select, SelectItem } from '@nextui-org/react';
import { MdSort } from 'react-icons/md';
import { IoRefresh } from 'react-icons/io5';
import ManualAdd from './ManualAdd';
import { usePageHeader } from '../hooks/usePageHeader';
import AutomateButtons from './AutomateButtons';

export default function PageHeader({ sortStyle, setSortStyle, filteredGames, visibleGames, setFavorites, setCardFarming, setAchievementUnlocker, setAutoIdle, setRefreshKey }) {
    const { handleSorting, handleRefetch, removeAllFromList } = usePageHeader({ setSortStyle, setRefreshKey });

    const sortOptions = [
        { key: 'a-z', label: 'Title Ascending' },
        { key: 'z-a', label: 'Title Descending' },
        { key: '1-0', label: 'Playtime High-Low' },
        { key: '0-1', label: 'Playtime Low-High' },
        { key: 'recent', label: 'Recently Played' },
        { key: 'favorites', label: 'Favorited Games' },
        { key: 'cardFarming', label: 'Card Farming Games' },
        { key: 'achievementUnlocker', label: 'Achievement Unlocker Games' },
        { key: 'autoIdle', label: 'Auto Idle Games' },
    ];

    return (
        <React.Fragment>
            <div className='flex justify-between items-center pb-3'>
                <div className='flex items-center gap-1'>
                    <div className='flex flex-col justify-center'>
                        <p className='text-lg font-semibold'>
                            Your Games
                        </p>
                        <div className='flex gap-1'>
                            <p className='text-xs text-gray-400'>
                                Showing {visibleGames.length} of {filteredGames.length} games
                            </p>
                            <div className='flex justify-center items-center cursor-pointer' onClick={handleRefetch}>
                                <IoRefresh className='text-gray-400' fontSize={16} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-end items-center gap-2'>
                    <ManualAdd setFavorites={setFavorites} />

                    <AutomateButtons />

                    {(sortStyle === 'favorites' || sortStyle === 'cardFarming' || sortStyle === 'achievementUnlocker' || sortStyle === 'autoIdle') && (
                        <Button
                            size='sm'
                            color='danger'
                            className='rounded-full font-semibold'
                            isDisabled={visibleGames.length <= 0}
                            onPress={() =>
                                removeAllFromList(sortStyle, setSortStyle, setFavorites, setCardFarming, setAchievementUnlocker, setAutoIdle)
                            }
                        >
                            Remove all
                        </Button>
                    )}

                    <Select
                        aria-label='sort'
                        disallowEmptySelection
                        radius='none'
                        size='sm'
                        startContent={<MdSort fontSize={26} />}
                        items={sortOptions}
                        className='w-[240px]'
                        defaultSelectedKeys={[sortStyle]}
                        onSelectionChange={(e) => { handleSorting(e); }}
                        classNames={{
                            listbox: ['p-0'],
                            value: ['text-sm'],
                            trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-inputborder data-[open=true]:!bg-titlebar duration-100 rounded'],
                            popoverContent: ['bg-base border border-border rounded justify-start'],
                            listboxWrapper: ['min-h-[268px]']
                        }}
                    >
                        {(item) => <SelectItem classNames={{ title: ['text-sm'], base: ['rounded'] }}>{item.label}</SelectItem>}
                    </Select>
                </div>
            </div>
        </React.Fragment>
    );
}