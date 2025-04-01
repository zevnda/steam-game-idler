import { useDisclosure } from '@heroui/react';

import { useUserContext } from '@/components/contexts/UserContext';
import { handleClearLogs } from '@/hooks/settings/useLogs';
import { logEvent } from '@/utils/tasks';
import { preserveKeysAndClearData } from '@/utils/tasks';

interface ClearDataHook {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    handleClearData: (onClose: () => void) => void;
}

const useClearData = (): ClearDataHook => {
    const { setUserSummary } = useUserContext();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Clear all data
    const handleClearData = (onClose: () => void): void => {
        onClose();
        handleClearLogs(false);
        preserveKeysAndClearData();
        setUserSummary(null);
        logEvent('[Settings] Cleared all data successfully');
    };

    return {
        isOpen,
        onOpen,
        onOpenChange,
        handleClearData
    };
};

export default useClearData;
