import { Fragment } from 'react';

import { Select, SelectItem } from '@heroui/react';

import { usePageHeader } from '@/src/hooks/gameslist/usePageHeader';

import { MdSort } from 'react-icons/md';
import { IoRefresh } from 'react-icons/io5';

export default function PageHeader({ sortStyle, setSortStyle, filteredGames, visibleGames, setRefreshKey }) {
    const { handleSorting, handleRefetch } = usePageHeader({ setSortStyle, setRefreshKey });

    const sortOptions = [
        { key: 'a-z', label: 'Title Ascending' },
        { key: 'z-a', label: 'Title Descending' },
        { key: '1-0', label: 'Playtime High-Low' },
        { key: '0-1', label: 'Playtime Low-High' },
        { key: 'recent', label: 'Recently Played' },
    ];

    return (
        <Fragment>
            <div className={`fixed w-[calc(100vw-66px)] z-[50] bg-opacity-90 backdrop-blur-md bg-base pl-4 pt-2 rounded-tl-lg ${filteredGames?.length > 25 ? 'pr-4' : 'pr-2'}`}>
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
                                listboxWrapper: ['min-h-[168px]']
                            }}
                        >
                            {(item) => <SelectItem classNames={{ title: ['text-sm'], base: ['rounded'] }}>{item.label}</SelectItem>}
                        </Select>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}