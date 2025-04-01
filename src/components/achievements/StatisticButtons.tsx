import { Modal, ModalContent, ModalBody, Button, useDisclosure, ModalFooter, ModalHeader } from '@heroui/react';
import type { Dispatch, SetStateAction, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import useStatisticButtons from '@/hooks/achievements/useStatisticButtons';
import type { Achievement, ChangedStats, Statistic } from '@/types/achievment';

interface StatisticButtonsProps {
    statistics: Statistic[];
    setStatistics: Dispatch<SetStateAction<Statistic[]>>;
    changedStats: ChangedStats;
    setChangedStats: Dispatch<SetStateAction<ChangedStats>>;
    setAchievements: Dispatch<SetStateAction<Achievement[]>>;
}

export default function StatisticButtons({
    statistics,
    setStatistics,
    changedStats,
    setChangedStats,
    setAchievements
}: StatisticButtonsProps): ReactElement {
    const { t } = useTranslation();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const {
        handleUpdateAllStats,
        handleResetAll
    } = useStatisticButtons(
        statistics,
        setStatistics,
        changedStats,
        setChangedStats,
        setAchievements
    );

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
                {t('achievementManager.statistics.saveChanges')} {hasChanges && `(${changedCount})`}
            </Button>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={onOpen}
            >
                {t('achievementManager.statistics.resetAll')}
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose: () => void) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                {t('common.confirm')}
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    <Trans i18nKey='confirmation.resetStatistics'>
                                        Are you sure you want to <strong>reset</strong> all statistics?
                                    </Trans>
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
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    size='sm'
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => handleResetAll(onClose)}
                                >
                                    {t('common.confirm')}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}