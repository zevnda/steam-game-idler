import { useContext } from 'react';

import { useDisclosure } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import { logEvent, preserveKeysAndClearData } from '@/src/utils/utils';
import { handleClearLogs } from '@/src/utils/settings/logsHandler';

const useClearData = () => {
    const { setUserSummary } = useContext(AppContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();


    const handleClearData = (onClose, updateColor) => {
        onClose();
        updateColor('#2c7adb');
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
