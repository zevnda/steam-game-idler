import { useDisclosure } from '@heroui/react';

const useResetSettings = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return { isOpen, onOpen, onOpenChange };
};

export default useResetSettings;
