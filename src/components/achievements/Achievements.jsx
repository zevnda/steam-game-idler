import { Tab, Tabs } from '@heroui/react';
import { useState, useContext } from 'react';

import AchievementsList from '@/components/achievements/AchievementsList';
import PageHeader from '@/components/achievements/PageHeader';
import StatisticsList from '@/components/achievements/StatisticsList';
import { NavigationContext } from '@/components/contexts/NavigationContext';
import Loader from '@/components/ui/Loader';
import useAchievements from '@/hooks/achievements/useAchievements';

export default function Achievements() {
    const { setCurrentTab } = useContext(NavigationContext);
    const [isLoading, setIsLoading] = useState(true);
    const [achievements, setAchievements] = useState([]);
    const [statistics, setStatistics] = useState([]);
    const [protectedAchievements, setProtectedAchievements] = useState(false);
    const [protectedStatistics, setProtectedStatistics] = useState(false);
    useAchievements(setIsLoading, setAchievements, setStatistics, setProtectedAchievements, setProtectedStatistics);

    if (isLoading) return (
        <div className='overflow-y-auto overflow-x-hidden bg-base border-t border-border w-screen'>
            <Loader />
        </div>
    );

    return (
        <div className='min-h-calc max-h-calc w-full bg-base overflow-y-auto overflow-x-hidden border-t border-border'>
            <div className='p-4'>
                <PageHeader
                    protectedAchievements={protectedAchievements}
                    protectedStatistics={protectedStatistics}
                />

                <div className='relative flex flex-wrap gap-4 mt-2'>
                    <div className='flex flex-col w-full'>
                        <Tabs
                            size='sm'
                            aria-label='Settings tabs'
                            color='default'
                            variant='solid'
                            className='max-w-[300px]'
                            classNames={{
                                base: 'bg-titlebar rounded-t-lg p-0 border-t border-l border-r border-border',
                                tabList: 'gap-0 w-full bg-transparent',
                                tab: 'rounded-none bg-transparent data-[hover-unselected=true]:bg-gray-500 data-[hover-unselected=true]:bg-opacity-5 data-[hover-unselected=true]:opacity-100',
                                tabContent: 'text-sm group-data-[selected=true]:text-content text-altwhite',
                                cursor: 'bg-base w-full rounded',
                                panel: 'bg-titlebar rounded-lg rounded-tl-none border border-border',
                            }}
                            onSelectionChange={(e) => setCurrentTab(e)}
                        >
                            <Tab key='achievements' title='Achievements'>
                                <AchievementsList
                                    achievements={achievements}
                                    setAchievements={setAchievements}
                                    protectedAchievements={protectedAchievements}
                                />
                            </Tab>
                            <Tab key='statistics' title='Statistics'>
                                <StatisticsList
                                    statistics={statistics}
                                    setStatistics={setStatistics}
                                    setAchievements={setAchievements}
                                />
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}