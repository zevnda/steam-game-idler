import { Fragment, useContext } from 'react';
import { Tab, Tabs } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import Loader from '@/src/components/ui/Loader';
import TabButtons from '@/src/components/achievements/TabButtons';
import AchievementsList from '@/src/components/achievements/AchievementsList';
import StatisticsList from '@/src/components/achievements/StatisticsList';
import PageHeader from '@/src/components/achievements/PageHeader';
import useAchievements from '@/src/hooks/achievements/useAchievements';

export default function Achievements() {
    const { setCurrentTab } = useContext(AppContext);
    const {
        isLoading,
        setIsSorted,
        initialStatValues,
        setInitialStatValues,
        newStatValues,
        setNewStatValues,
        userGameAchievementsMap,
        percentageMap
    } = useAchievements();

    if (isLoading) return (
        <div className='overflow-y-auto overflow-x-hidden border-t border-border'>
            <Loader />
        </div>
    );

    return (
        <Fragment>
            <div className='min-h-calc max-h-calc w-full bg-base overflow-y-auto overflow-x-hidden border-t border-border'>
                <div className='p-4'>
                    <PageHeader />

                    <div className='relative flex flex-wrap gap-4 mt-2'>
                        <div className='absolute flex justify-end w-full gap-2'>
                            <TabButtons
                                initialStatValues={initialStatValues}
                                newStatValues={newStatValues}
                                setNewStatValues={setNewStatValues}
                                setIsSorted={setIsSorted}
                                userGameAchievementsMap={userGameAchievementsMap}
                                percentageMap={percentageMap}
                            />
                        </div>

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
                                    tabContent: 'text-sm',
                                    cursor: 'bg-base w-full rounded',
                                    panel: 'bg-titlebar rounded-lg rounded-tl-none border border-border',
                                }}
                                onSelectionChange={(e) => setCurrentTab(e)}
                            >
                                <Tab key='achievements' title='Achievements'>
                                    <AchievementsList
                                        userGameAchievementsMap={userGameAchievementsMap}
                                        percentageMap={percentageMap}
                                    />
                                </Tab>
                                <Tab key='statistics' title='Statistics'>
                                    <StatisticsList
                                        setInitialStatValues={setInitialStatValues}
                                        newStatValues={newStatValues}
                                        setNewStatValues={setNewStatValues}
                                    />
                                </Tab>
                            </Tabs>

                            <p className='text-xs text-gray-400 mt-1'>
                                Please note that changes are instant but may take up to 5 minutes to be reflected on this page. Check your game&apos;s achievements page on Steam for real-time changes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}