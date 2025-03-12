import { Fragment } from 'react';

import { Select, SelectItem } from '@heroui/react';

import { usePageHeader } from '@/hooks/gameslist/usePageHeader';

import { TbRefresh, TbSortDescending2 } from 'react-icons/tb';

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
            <div className={`fixed w-[calc(100vw-68px)] z-[50] bg-opacity-90 backdrop-blur-md bg-base pl-4 pt-2 rounded-tl-xl ${filteredGames?.length > 25 ? 'pr-4' : 'pr-2'}`}>
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
                                    <TbRefresh className='text-gray-400' fontSize={16} />
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
                            startContent={<TbSortDescending2 fontSize={26} />}
                            items={sortOptions}
                            className='w-[240px]'
                            defaultSelectedKeys={[sortStyle]}
                            onSelectionChange={(e) => { handleSorting(e); }}
                            classNames={{
                                listbox: ['p-0'],
                                value: ['text-sm !text-content'],
                                trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                                popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
                                listboxWrapper: ['min-h-[168px]']
                            }}
                        >
                            {(item) => <SelectItem>{item.label}</SelectItem>}
                        </Select>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}