import { useContext } from 'react';

import { useDisclosure } from '@heroui/react';

import { AppContext } from '@/components/layout/AppContext';
import { logEvent, preserveKeysAndClearData } from '@/utils/utils';
import { handleClearLogs } from '@/utils/settings/logsHandler';

const useClearData = () => {
    const { setUserSummary } = useContext(AppContext);
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
