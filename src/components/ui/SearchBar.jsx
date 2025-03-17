import { Input } from '@heroui/react';
import { useContext } from 'react';
import { RiSearchLine } from 'react-icons/ri';

import { NavigationContext } from '@/components/contexts/NavigationContext';
import { SearchContext } from '@/components/contexts/SearchContext';
import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import useHeader from '@/hooks/ui/useHeader';


export default function SearchBar() {
    const { showAchievements } = useContext(StateContext);
    const {
        setIsQuery,
        gameQueryValue,
        setGameQueryValue,
        achievementQueryValue,
        setAchievementQueryValue,
        statisticQueryValue,
        setStatisticQueryValue
    } = useContext(SearchContext);
    const { activePage, currentTab } = useContext(NavigationContext);
    const { achievementsUnavailable, statisticsUnavailable } = useContext(UserContext);
    useHeader();

    const handleGameQueryChange = (e) => {
        setGameQueryValue(e.target.value);
    };

    const handleAchievementQueryChange = (e) => {
        setAchievementQueryValue(e.target.value);
    };

    const handleStatisticQueryChange = (e) => {
        setStatisticQueryValue(e.target.value);
    };

    const handleKeyDown = () => {
        setIsQuery(true);
    };

    return (
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
                        input: ['!text-content placeholder:text-altwhite/50'],
                    }}
                    value={gameQueryValue}
                    onChange={handleGameQueryChange}
                    onKeyDown={handleKeyDown}
                    onClear={() => setGameQueryValue('')}
                />
            )}
            {(showAchievements && currentTab === 'achievements') && (
                <Input
                    size='sm'
                    isClearable
                    isDisabled={achievementsUnavailable}
                    placeholder='Search for an achievement'
                    startContent={<RiSearchLine />}
                    className='max-w-[300px]'
                    classNames={{
                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                        input: ['!text-content placeholder:text-altwhite/50']
                    }}
                    value={achievementQueryValue}
                    onChange={handleAchievementQueryChange}
                    onClear={() => setAchievementQueryValue('')}
                />
            )}
            {(showAchievements && currentTab === 'statistics') && (
                <Input
                    size='sm'
                    isClearable
                    isDisabled={statisticsUnavailable}
                    placeholder='Search for a statistic'
                    startContent={<RiSearchLine />}
                    className='max-w-[300px]'
                    classNames={{
                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                        input: ['!text-content placeholder:text-altwhite/50']
                    }}
                    value={statisticQueryValue}
                    onChange={handleStatisticQueryChange}
                    onClear={() => setStatisticQueryValue('')}
                />
            )}
        </div>
    );
}