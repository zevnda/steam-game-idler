import { useDisclosure } from '@nextui-org/react';

const useResetSettings = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return { isOpen, onOpen, onOpenChange };
};

export default useResetSettings;
