import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { open } from '@tauri-apps/plugin-shell';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSteam } from 'react-icons/fa';
import { TbAwardFilled, TbDotsVertical, TbPlayerPlayFilled, TbSettingsFilled } from 'react-icons/tb';

import { useStateContext } from '@/components/contexts/StateContext';
import { handleIdle, viewAchievments, viewGameSettings } from '@/hooks/ui/useGameCard';
import type { Game } from '@/types/game';

interface CardMenuProps {
    item: Game;
    onOpen: () => void;
}

export default function CardMenu({ item, onOpen }: CardMenuProps): JSX.Element {
    const { t } = useTranslation();
    const { setAppId, setAppName, setShowAchievements, setIsGameSettingsOpen } = useStateContext();

    const viewStorePage = async (item: Game): Promise<void> => {
        try {
            await open(`https://store.steampowered.com/app/${item.appid}`);
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    };

    return (
        <Dropdown classNames={{ content: ['rounded-lg p-0 bg-base border border-border'] }}>
            <DropdownTrigger>
                <div className='p-0.5 bg-black text-offwhite bg-opacity-50 hover:bg-black hover:bg-opacity-70 hover:scale-105 cursor-pointer rounded-md duration-200'>
                    <TbDotsVertical />
                </div>
            </DropdownTrigger>
            <DropdownMenu aria-label='actions'>
                <DropdownItem
                    className='rounded'
                    classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
                    key='idle'
                    startContent={<TbPlayerPlayFilled size={16} className='text-content' />}
                    onPress={() => handleIdle(item)}
                    textValue='Idle game'
                >
                    <p className='text-sm text-content'>
                        {t('cardMenu.idle')}
                    </p>
                </DropdownItem>
                <DropdownItem
                    className='rounded'
                    classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
                    key='achievements'
                    startContent={<TbAwardFilled size={16} className='text-content' />}
                    onPress={() => viewAchievments(item, setAppId, setAppName, setShowAchievements)}
                    textValue='View achievements'
                >
                    <p className='text-sm text-content'>
                        {t('cardMenu.achievements')}
                    </p>
                </DropdownItem>
                <DropdownItem
                    className='rounded'
                    classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
                    key='store'
                    startContent={<FaSteam fontSize={16} className='text-content' />}
                    onPress={() => viewStorePage(item)}
                    textValue='View store page'
                >
                    <p className='text-sm text-content'>
                        {t('cardMenu.store')}
                    </p>
                </DropdownItem>
                <DropdownItem
                    className='rounded'
                    classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
                    key='settings'
                    startContent={<TbSettingsFilled fontSize={16} className='text-content' />}
                    onPress={() => viewGameSettings(item, setAppId, setAppName, setIsGameSettingsOpen, onOpen)}
                    textValue='Game settings'
                >
                    <p className='text-sm text-content'>
                        {t('cardMenu.settings')}
                    </p>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}