import React from 'react';
import Loader from '../../ui/components/Loader';
import TabButtons from './TabButtons';
import AchievementsList from './AchievementsList';
import { Tab, Tabs } from '@nextui-org/react';
import StatisticsList from './StatisticsList';
import PageHeader from './PageHeader';
import useAchievements from '../hooks/useAchievements';

export default function Achievements({ steamId, appId, appName, setShowAchievements }) {
    const {
        isLoading,
        isSorted,
        setIsSorted,
        inputValue,
        setInputValue,
        achievementList,
        setAchievementList,
        statisticsList,
        achievementsUnavailable,
        statisticsUnavailable,
        btnLoading,
        setBtnLoading,
        currentTab,
        setCurrentTab,
        initialStatValues,
        setInitialStatValues,
        newStatValues,
        setNewStatValues,
        userGameAchievementsMap,
        userGameStatsMap,
        percentageMap
    } = useAchievements(steamId, appId);

    if (isLoading) return <Loader />;

    return (
        <React.Fragment>
            <div className='min-h-calc max-h-calc w-full overflow-y-auto overflow-x-hidden'>
                <div className='p-4'>
                    <PageHeader
                        setShowAchievements={setShowAchievements}
                        achievementList={achievementList}
                        setAchievementList={setAchievementList}
                        achievementsUnavailable={achievementsUnavailable}
                        setIsSorted={setIsSorted}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        percentageMap={percentageMap}
                        userGameAchievementsMap={userGameAchievementsMap}
                        currentTab={currentTab}
                    />

                    <div className='flex flex-wrap gap-4 mt-2'>
                        <TabButtons
                            appId={appId}
                            appName={appName}
                            achievementsUnavailable={achievementsUnavailable}
                            statisticsUnavailable={statisticsUnavailable}
                            btnLoading={btnLoading}
                            achievementList={achievementList}
                            inputValue={inputValue}
                            setBtnLoading={setBtnLoading}
                            currentTab={currentTab}
                            initialStatValues={initialStatValues}
                            newStatValues={newStatValues}
                        />

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
                                    tabContent: 'text-xs',
                                    cursor: 'bg-base w-full rounded',
                                    panel: 'bg-titlebar rounded rounded-tl-none border border-border',
                                }}
                                onSelectionChange={(e) => setCurrentTab(e)}
                            >
                                <Tab key='achievements' title='Achievements'>
                                    <AchievementsList
                                        appId={appId}
                                        appName={appName}
                                        achievementsUnavailable={achievementsUnavailable}
                                        achievementList={achievementList}
                                        userGameAchievementsMap={userGameAchievementsMap}
                                        percentageMap={percentageMap}
                                    />
                                </Tab>
                                <Tab key='statistics' title='Statistics'>
                                    <StatisticsList
                                        statisticsUnavailable={statisticsUnavailable}
                                        statisticsList={statisticsList}
                                        userGameStatsMap={userGameStatsMap}
                                        setInitialStatValues={setInitialStatValues}
                                        newStatValues={newStatValues}
                                        setNewStatValues={setNewStatValues}
                                    />
                                </Tab>
                            </Tabs>

                            <p className='text-[10px] text-gray-400 mt-1'>
                                Please note that changes are instant but may take up to 5 minutes to be reflected on this page. Check your game&apos;s achievements page on Steam for real-time changes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}