import { Modal, ModalContent, ModalBody, Button, useDisclosure, ModalFooter, ModalHeader, Select, SelectItem } from '@heroui/react';
import { useState, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TbSortDescending2 } from 'react-icons/tb';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import useAchievementButtons from '@/hooks/achievements/useAchievementButtons';

export default function AchievementButtons({ achievements, setAchievements, protectedAchievements }) {
    const { t } = useTranslation();
    const { userSummary } = useContext(UserContext);
    const { appId, appName } = useContext(StateContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { handleChange, handleUnlockAll, handleLockAll } = useAchievementButtons(userSummary, setAchievements);
    const [state, setState] = useState('');

    const sortOptions = [
        { key: 'percent', label: t('achievementManager.achievements.sort.percent') },
        { key: 'title', label: t('achievementManager.achievements.sort.title') },
        { key: 'unlocked', label: t('achievementManager.achievements.sort.unlocked') },
        { key: 'locked', label: t('achievementManager.achievements.sort.locked') },
        { key: 'unprotected', label: t('achievementManager.achievements.sort.unprotected') },
        { key: 'protected', label: t('achievementManager.achievements.sort.protected') },
    ];

    const unAchieved = achievements.filter(achievement => !achievement.achieved);
    const achieved = achievements.filter(achievement => achievement.achieved);

    const getTranslatedState = (state) => {
        if (state === 'unlock') return t('achievementManager.achievements.unlock');
        if (state === 'lock') return t('achievementManager.achievements.lock');
        return state;
    };

    const handleShowModal = (onOpen, state) => {
        setState(state);
        onOpen();
    };

    return (
        <div className='absolute top-0 right-0 flex gap-2'>
            <Button
                isDisabled={protectedAchievements || unAchieved.length === 0}
                size='sm'
                className='font-semibold rounded-lg bg-dynamic text-button'
                onPress={() => handleShowModal(onOpen, 'unlock')}
            >
                {t('achievementManager.achievements.unlockAll')}
            </Button>

            <Button
                isDisabled={protectedAchievements || achieved.length === 0}
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={() => handleShowModal(onOpen, 'lock')}
            >
                {t('achievementManager.achievements.lockAll')}
            </Button>

            <Select
                size='sm'
                aria-label='sort'
                disallowEmptySelection
                radius='none'
                startContent={<TbSortDescending2 fontSize={26} />}
                items={sortOptions}
                className='w-[230px]'
                classNames={{
                    listbox: ['p-0'],
                    value: ['text-sm !text-content'],
                    trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                    popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
                }}
                defaultSelectedKeys={['percent']}
                onSelectionChange={(e) => { handleChange(e, achievements, setAchievements); }}
            >
                {(item) => <SelectItem classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>{item.label}</SelectItem>}
            </Select>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                {t('common.confirm')}
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    <Trans i18nKey='achievementManager.achievements.modal' values={{ state: getTranslatedState(state) }}>
                                        Are you sure you want to <strong>{state}</strong> all achievements?
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
                                    onPress={() => {
                                        if (state === 'unlock') {
                                            handleUnlockAll(appId, appName, achievements, onClose);
                                        } else {
                                            handleLockAll(appId, appName, achievements, onClose);
                                        }
                                    }}
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