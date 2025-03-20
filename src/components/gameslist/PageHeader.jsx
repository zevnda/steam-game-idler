import { Select, SelectItem } from '@heroui/react';
import { useContext } from 'react';
import { TbRefresh, TbSortDescending2 } from 'react-icons/tb';

import { UserContext } from '@/components/contexts/UserContext';
import { usePageHeader } from '@/hooks/gameslist/usePageHeader';

export default function PageHeader({ sortStyle, setSortStyle, filteredGames, visibleGames, setRefreshKey }) {
    const { userSummary } = useContext(UserContext);
    const { handleSorting, handleRefetch } = usePageHeader({ setSortStyle, setRefreshKey });

    const sortOptions = [
        { key: 'a-z', label: 'Title Ascending' },
        { key: 'z-a', label: 'Title Descending' },
        { key: '1-0', label: 'Playtime High-Low' },
        { key: '0-1', label: 'Playtime Low-High' },
        { key: 'recent', label: 'Recently Played' },
    ];

    return (
        <div className={`fixed w-[calc(100vw-68px)] z-[50] bg-opacity-90 backdrop-blur-md bg-base pl-4 pt-2 rounded-tl-xl ${filteredGames?.length >= 21 ? 'pr-4' : 'pr-2'}`}>
            <div className='flex justify-between items-center pb-3'>
                <div className='flex items-center gap-1'>
                    <div className='flex flex-col justify-center'>
                        <p className='text-lg font-semibold'>
                            Your Games
                        </p>
                        <div className='flex gap-1'>
                            <p className='text-xs text-altwhite'>
                                Showing {visibleGames.length} of {filteredGames.length} games
                            </p>
                            <div className='flex justify-center items-center cursor-pointer' onClick={() => handleRefetch(userSummary.steamId)}>
                                <TbRefresh className='text-altwhite' fontSize={16} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-end items-center gap-2'>
                    <Select
                        size='sm'
                        aria-label='sort'
                        disallowEmptySelection
                        radius='none'
                        startContent={<TbSortDescending2 fontSize={26} />}
                        items={sortOptions}
                        className='w-[240px]'
                        classNames={{
                            listbox: ['p-0'],
                            value: ['text-sm !text-content'],
                            trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                            popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
                            listboxWrapper: ['min-h-[168px]']
                        }}
                        defaultSelectedKeys={[sortStyle]}
                        onSelectionChange={(e) => { handleSorting(e); }}
                    >
                        {(item) => <SelectItem classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>{item.label}</SelectItem>}
                    </Select>
                </div>
            </div>
        </div>
    );
}