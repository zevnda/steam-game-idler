import React, { useContext } from 'react';
import Loader from '../../ui/components/Loader';
import TabButtons from './TabButtons';
import AchievementsList from './AchievementsList';
import { Tab, Tabs } from '@nextui-org/react';
import StatisticsList from './StatisticsList';
import PageHeader from './PageHeader';
import useAchievements from '../hooks/useAchievements';
import { AppContext } from '../../layout/components/AppContext';

export default function Achievements() {
    const { setCurrentTab } = useContext(AppContext);
    const {
        isLoading,
        setIsSorted,
        btnLoading,
        setBtnLoading,
        initialStatValues,
        setInitialStatValues,
        newStatValues,
        setNewStatValues,
        userGameAchievementsMap,
        percentageMap
    } = useAchievements();

    if (isLoading) return <Loader />;

    return (
        <React.Fragment>
            <div className='min-h-calc max-h-calc w-full overflow-y-auto overflow-x-hidden'>
                <div className='p-4'>
                    <PageHeader />

                    <div className='relative flex flex-wrap gap-4 mt-2'>
                        <div className='absolute flex justify-end w-full gap-2'>
                            <TabButtons
                                initialStatValues={initialStatValues}
                                newStatValues={newStatValues}
                                setNewStatValues={setNewStatValues}
                                btnLoading={btnLoading}
                                setBtnLoading={setBtnLoading}
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
                                    base: 'bg-titlebar rounded-t p-0 border-t border-l border-r border-border',
                                    tabList: 'gap-0 w-full bg-transparent',
                                    tab: 'px-6 py-3 rounded-none bg-transparent px-4',
                                    tabContent: 'text-sm',
                                    cursor: 'bg-base w-full rounded',
                                    panel: 'bg-titlebar rounded rounded-tl-none border border-border',
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
        </React.Fragment>
    );
}