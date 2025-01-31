import { useCallback, useContext } from 'react';

import { toast } from 'react-toastify';

import { AppContext } from '@/src/components/layout/AppContext';
import { logEvent, toggleAchievement } from '@/src/utils/utils';

const useAchievementsList = () => {
    const { appId, appName } = useContext(AppContext);

    const handleToggle = useCallback(async (achievementName, type) => {
        try {
            await toggleAchievement(appId, appName, achievementName, type);
        } catch (error) {
            toast.error(`Error in (handleToggle): ${error?.message || error}`);
            console.error('Error in (handleToggle):', error);
            logEvent(`[Error] in (handleToggle): ${error}`);
        }
    }, [appId, appName]);

    return { handleToggle };
};

export default useAchievementsList;
