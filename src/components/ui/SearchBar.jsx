import { Fragment, useContext } from 'react';

import { Input } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import useHeader from '@/src/hooks/ui/useHeader';

import { RiSearchLine } from 'react-icons/ri';

export default function SearchBar() {
    const {
        activePage,
        showAchievements,
        gameQueryValue,
        setGameQueryValue,
        achievementQueryValue,
        setAchievementQueryValue,
        achievementsUnavailable,
        currentTab
    } = useContext(AppContext);

    const { handleGameQueryChange, handleAchievementQueryChange, handleKeyDown } = useHeader(setGameQueryValue, setAchievementQueryValue);

    return (
        <Fragment>
            <div className='flex items-center flex-grow p-4 h-full' data-tauri-drag-region>
                {activePage === 'games' && !showAchievements && (
                    <Input
                        size='sm'
                        isClearable
                        isDisabled={activePage !== 'games' || showAchievements}
                        placeholder='Search for a game'
                        startContent={<RiSearchLine />}
                        className='max-w-[400px]'
                        classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar'] }}
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
                        className='max-w-[400px]'
                        classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar'] }}
                        value={achievementQueryValue}
                        onChange={handleAchievementQueryChange}
                        onClear={() => setAchievementQueryValue('')}
                    />
                )}
            </div>
        </Fragment>
    );
}