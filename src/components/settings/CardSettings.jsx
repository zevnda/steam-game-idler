import { Button, Input } from '@heroui/react';
import Image from 'next/image';
import { useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { UserContext } from '@/components/contexts/UserContext';
import SettingsCheckbox from '@/components/settings/SettingsCheckbox';
import ExtLink from '@/components/ui/ExtLink';
import { useCardSettings, handleSave, handleClear } from '@/hooks/settings/useCardSettings';

export default function CardSettings({ settings, setSettings, localSettings, setLocalSettings }) {
    const { t } = useTranslation();
    const { userSummary, userSettings, setUserSettings } = useContext(UserContext);
    const {
        sidValue,
        slsValue,
        smaValue,
        hasCookies,
        setSidValue,
        setSlsValue,
        setSmaValue,
        setHasCookies,
        cardFarmingUser,
        setCardFarmingUser,
    } = useCardSettings();

    return (
        <div className='relative flex flex-col gap-4 p-2'>
            {cardFarmingUser && (
                <div className='absolute top-0 right-2'>
                    <p className='text-xs text-altwhite mb-0.5'>
                        {t('settings.cardFarming.userSummary')}
                    </p>
                    <div className='border border-border rounded-lg bg-input hover:bg-titlebar dark:bg-[#131313] dark:hover:bg-[#171717]'>
                        <ExtLink href={`https://steamcommunity.com/profiles/${cardFarmingUser.steamId}`}>
                            <div className='flex items-center gap-2 h-full p-2 group'>
                                <Image
                                    src={cardFarmingUser.avatar}
                                    height={40}
                                    width={40}
                                    alt='user avatar'
                                    className='w-[40px] h-[40px] rounded-full group-hover:scale-110 duration-200'
                                    priority
                                />
                                <div className='w-[140px]'>
                                    <p className='font-medium truncate'>
                                        {cardFarmingUser.personaName}
                                    </p>
                                    <p className='text-xs text-altwhite truncate'>
                                        {cardFarmingUser.steamId}
                                    </p>
                                </div>
                            </div>
                        </ExtLink>
                    </div>
                </div>
            )}

            <SettingsCheckbox
                type='cardFarming'
                name='listGames'
                content={t('settings.cardFarming.listGames')}
                settings={settings}
                setSettings={setSettings}
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
            />

            <SettingsCheckbox
                type='cardFarming'
                name='allGames'
                content={t('settings.cardFarming.allGames')}
                settings={settings}
                setSettings={setSettings}
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
            />

            <div className='w-full'>
                <p className='text-xs mt-2'>
                    <Trans i18nKey='settings.cardFarming.steamCredentials'>
                        Steam credentials are required in order to use the Card Farming feature.&nbsp;
                        <ExtLink href='https://steamgameidler.vercel.app/steam-credentials' className='text-link hover:text-linkhover'>Learn more</ExtLink>
                    </Trans>
                </p>
                <div className='flex flex-col mt-4'>
                    <div className='flex flex-col gap-2'>
                        <div className='flex gap-6'>
                            <Input
                                size='sm'
                                label='sessionid'
                                labelPlacement='outside'
                                placeholder='sessionid'
                                className='max-w-[300px]'
                                classNames={{
                                    inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                                    label: ['!text-content'],
                                    input: ['!text-content placeholder:text-altwhite/50']
                                }}
                                value={sidValue}
                                onChange={(e) => setSidValue(e.target.value)}
                                type='password'
                            />
                            <Input
                                size='sm'
                                label='steamLoginSecure'
                                labelPlacement='outside'
                                placeholder='steamLoginSecure'
                                className='max-w-[300px]'
                                classNames={{
                                    inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                                    label: ['!text-content'],
                                    input: ['!text-content placeholder:text-altwhite/50']
                                }}
                                value={slsValue}
                                onChange={(e) => setSlsValue(e.target.value)}
                                type='password'
                            />
                            <Input
                                size='sm'
                                label={<p>steamParental/steamMachineAuth <span className='italic'>(optional)</span></p>}
                                labelPlacement='outside'
                                placeholder='steamParental/steamMachineAuth'
                                className='max-w-[300px]'
                                classNames={{
                                    inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                                    label: ['!text-content'],
                                    input: ['!text-content placeholder:text-altwhite/50']
                                }}
                                value={smaValue}
                                onChange={(e) => setSmaValue(e.target.value)}
                                type='password'
                            />
                        </div>
                        <div className='flex w-[200px] gap-2 mt-2'>
                            <Button
                                size='sm'
                                isDisabled={hasCookies || !sidValue || !slsValue}
                                className='font-semibold rounded-lg w-full bg-dynamic text-button'
                                onPress={() => handleSave(sidValue, slsValue, smaValue, setHasCookies, userSummary, setCardFarmingUser, userSettings, setUserSettings)}
                            >
                                {t('common.save')}
                            </Button>
                            <Button
                                size='sm'
                                color='danger'
                                isDisabled={!hasCookies}
                                className='font-semibold rounded-lg w-full'
                                onPress={() => handleClear(setHasCookies, setSidValue, setSlsValue, setSmaValue, userSummary, setCardFarmingUser, setUserSettings)}
                            >
                                {t('common.clear')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}