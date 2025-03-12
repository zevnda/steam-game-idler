import { Fragment, useContext } from 'react';

import { Input } from '@heroui/react';

import { StateContext } from '@/components/contexts/StateContext';
import { SearchContext } from '@/components/contexts/SearchContext';
import { NavigationContext } from '@/components/contexts/NavigationContext';
import { UserContext } from '@/components/contexts/UserContext';
import useHeader from '@/hooks/ui/useHeader';

import { RiSearchLine } from 'react-icons/ri';

export default function SearchBar() {
    const { showAchievements } = useContext(StateContext);
    const { gameQueryValue, setGameQueryValue, achievementQueryValue, setAchievementQueryValue } = useContext(SearchContext);
    const { activePage, currentTab } = useContext(NavigationContext);
    const { achievementsUnavailable } = useContext(UserContext);

    const { handleGameQueryChange, handleAchievementQueryChange, handleKeyDown } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <Fragment>
            <div className='flex items-center flex-grow py-4 h-full' data-tauri-drag-region>
                {activePage === 'games' && !showAchievements && (
                    <Input
                        size='sm'
                        isClearable
                        isDisabled={activePage !== 'games' || showAchievements}
                        placeholder='Search for a game'
                        startContent={<RiSearchLine />}
                        className='w-[300px]'
                        classNames={{
                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                            input: ['!text-content']
                        }}
                        value={gameQueryValue}
                        onChange={handleGameQueryChange}
                        onKeyDown={handleKeyDown}
                        onClear={() => setGameQueryValue('')}
                    />
                )}
                {showAchievements && (
                    <Input
                        size='sm'
                        isClearable
                        isDisabled={achievementsUnavailable || currentTab === 'statistics'}
                        placeholder='Search for an achievement'
                        startContent={<RiSearchLine />}
                        className='max-w-[300px]'
                        classNames={{
                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                            input: ['!text-content']
                        }}
                        value={achievementQueryValue}
                        onChange={handleAchievementQueryChange}
                        onClear={() => setAchievementQueryValue('')}
                    />
                )}
            </div>
        </Fragment>
    );
}