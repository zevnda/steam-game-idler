import { useContext } from 'react';

import { useDisclosure } from '@heroui/react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent, preserveKeysAndClearData } from '@/utils/utils';
import { handleClearLogs } from '@/hooks/settings/useLogs';

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
