import { Modal, ModalContent, ModalBody, Button, useDisclosure, ModalFooter, ModalHeader } from '@heroui/react';

import useStatisticButtons from '@/hooks/achievements/useStatisticButtons';

export default function StatisticButtons({ statistics, setStatistics, changedStats, setChangedStats, setAchievements }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { handleUpdateAllStats, handleResetAll } = useStatisticButtons(statistics, setStatistics, changedStats, setChangedStats, setAchievements);

    const changedCount = Object.keys(changedStats).length;
    const hasChanges = changedCount > 0;

    return (
        <div className='absolute top-0 right-0 flex gap-2'>
            <Button
                size='sm'
                className='font-semibold rounded-lg bg-dynamic text-button'
                onPress={handleUpdateAllStats}
                isDisabled={!hasChanges}
            >
                Save Changes {hasChanges && `(${changedCount})`}
            </Button>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={onOpen}
            >
                Reset All
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to <strong>reset</strong> all statistics?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='font-semibold rounded-lg'
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => handleResetAll(onClose)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}