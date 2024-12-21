import { useCallback, useContext } from 'react';
import { logEvent, toggleAchievement } from '@/src/utils/utils';
import { toast } from 'react-toastify';
import { AppContext } from '../../layouts/components/AppContext';

const useAchievementsList = () => {
    const { appId, appName } = useContext(AppContext);

    const handleToggle = useCallback(async (achievementName, type) => {
        try {
            const status = await toggleAchievement(appId, achievementName, false);
            if (!status.error) {
                toast.success(`${type} ${achievementName} for ${appName}`);
            } else {
                toast.error(`Error in (handleToggle): ${status?.error}`);
                logEvent(`[Error] in (handleToggle): ${status.error}`);
            }
        } catch (error) {
            toast.error(`Error in (handleToggle): ${error?.message || error}`);
            console.error('Error in (handleToggle):', error);
            logEvent(`[Error] in (handleToggle): ${error}`);
        }
    }, [appId, appName]);

    return { handleToggle };
};

export default useAchievementsList;
