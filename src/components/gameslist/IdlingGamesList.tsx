import { Button } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPlayerStopFilled } from 'react-icons/tb';

import { useIdleContext } from '@/components/contexts/IdleContext';
import { useStateContext } from '@/components/contexts/StateContext';
import GameCard from '@/components/ui/GameCard';
import type { InvokeKillProcess } from '@/types/invoke';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showSuccessToast } from '@/utils/toasts';

export default function IdlingGamesList(): ReactElement {
    const { t } = useTranslation();
    const { idleGamesList, setIdleGamesList } = useIdleContext();
    const { setIsCardFarming, setIsAchievementUnlocker } = useStateContext();

    const handleStopIdleAll = async (): Promise<void> => {
        try {
            const response = await invoke<InvokeKillProcess>('kill_all_steamutil_processes');
            if (response.success) {
                showSuccessToast(t('toast.stopIdleAll.success', { count: response?.killed_count }));
                setIdleGamesList([]);
                setIsCardFarming(false);
                setIsAchievementUnlocker(false);
            } else {
                showDangerToast(t('toast.stopIdleAll.error'));
            }
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in handleStopIdleAll:', error);
            logEvent(`Error in (handleStopIdleAll): ${error}`);
        }
    };

    return (
        <div className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border select-none'>
            <div className={`fixed w-[calc(100vw-68px)] z-[50] bg-opacity-90 backdrop-blur-md bg-base pl-4 pt-2 rounded-tl-xl ${idleGamesList?.length >= 21 ? 'pr-4' : 'pr-2'}`}>
                <div className='flex justify-between items-center pb-3'>
                    <div className='flex items-center justify-between w-full gap-1'>
                        <div className='flex flex-col justify-center'>
                            <p className='text-lg font-semibold'>
                                {t('idlingGames.title')}
                            </p>
                            <div className='flex gap-1'>
                                <p className='text-xs text-altwhite'>
                                    {t('idlingGames.subtitle')}
                                </p>
                            </div>
                        </div>
                        {idleGamesList?.length > 0 && (
                            <div>
                                <Button
                                    size='sm'
                                    color='danger'
                                    isDisabled={idleGamesList?.length === 0}
                                    className='rounded-full font-semibold'
                                    startContent={<TbPlayerStopFilled fontSize={20} />}
                                    onPress={handleStopIdleAll}
                                >
                                    {t('idlingGames.stopAll')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 pt-2 mt-[60px]'>
                {idleGamesList && idleGamesList.map((item) => (
                    <GameCard
                        key={item.appid}
                        item={item}
                    />
                ))}
            </div>
        </div>
    );
}