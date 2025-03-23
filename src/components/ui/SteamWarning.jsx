import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react';
import { useContext, useEffect } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { checkSteamStatus } from '@/utils/tasks';

export default function SteamWarning() {
    const { showSteamWarning, setShowSteamWarning } = useContext(StateContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    useEffect(() => {
        if (showSteamWarning) {
            onOpen();
        }
    }, [onOpen, showSteamWarning]);

    const verifySteamStatus = async () => {
        const isSteamRunning = await checkSteamStatus(true);
        if (isSteamRunning) {
            setShowSteamWarning(false);
            onOpenChange();
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={verifySteamStatus} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
            <ModalContent>
                <>
                    <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                        Notice
                    </ModalHeader>
                    <ModalBody className='my-4'>
                        <p className='text-sm'>
                            Steam is not running. Open the Steam client to continue
                        </p>
                    </ModalBody>
                    <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                        <Button
                            size='sm'
                            className='font-semibold rounded-lg bg-dynamic text-button'
                            onPress={verifySteamStatus}
                        >
                            Confirm
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
}