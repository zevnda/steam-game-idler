import { useDisclosure } from '@heroui/react';
import { useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { handleClearLogs } from '@/hooks/settings/useLogs';
import { logEvent } from '@/utils/global/tasks';
import { preserveKeysAndClearData } from '@/utils/global/tasks';

const useClearData = () => {
    const { setUserSummary } = useContext(UserContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const handleClearData = (onClose) => {
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
