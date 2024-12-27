import { logEvent, stopIdler } from '@/src/utils/utils';
import { toast } from 'react-toastify';
import { sendMessage } from '../../layout/utils/windowHandler';

export const handleStop = async (isMountedRef, abortControllerRef, gamesWithDrops, activePage, setActivePage, currentGame) => {
    try {
        setActivePage('games');
        if (activePage === 'card-farming') {
            const stopPromises = Array.from(gamesWithDrops).map(game => stopIdler(game.appId, game.name));
            await Promise.all(stopPromises);
        } else {
            await stopIdler(currentGame.appId, currentGame.name);
        }
    } catch (error) {
        toast.error(`Error in (handleStop): ${error?.message || error}`);
        console.error('Error in (handleStop) :', error);
        logEvent(`[Error] in (handleStop) ${error}`);
    } finally {
        isMountedRef.current = false;
        abortControllerRef.current.abort();
        sendMessage({ stopAutomation: true });
    }
};