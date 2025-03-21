import { Button, Input } from '@heroui/react';
import Image from 'next/image';
import { useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import SettingsCheckbox from '@/components/settings/SettingsCheckbox';
import ExtLink from '@/components/ui/ExtLink';
import ThemeSwitch from '@/components/ui/theme/ThemeSwitch';
import { useGeneralSettings, handleKeyChange, handleKeySave, handleClear } from '@/hooks/settings/useGeneralSettings';

export default function GeneralSettings({ settings, setSettings, localSettings, setLocalSettings }) {
    const { userSummary } = useContext(UserContext);
    const { keyValue, setKeyValue, hasKey, setHasKey } = useGeneralSettings(settings);

    return (
        <div className='relative flex flex-col gap-4 p-2 overflow-y-auto max-h-[410px]'>
            <div className='absolute top-0 right-2'>
                <p className='text-xs text-altwhite mb-0.5'>
                    Logged in as
                </p>
                <div className='border border-border rounded-lg bg-input hover:bg-titlebar dark:bg-[#131313] dark:hover:bg-[#171717]'>
                    <ExtLink href={`https://steamcommunity.com/profiles/${userSummary.steamId}`}>
                        <div className='flex items-center gap-2 h-full p-2 group'>
                            <Image
                                src={userSummary.avatar}
                                height={40}
                                width={40}
                                alt='user avatar'
                                className='w-[40px] h-[40px] rounded-full group-hover:scale-110 duration-200'
                                priority
                            />
                            <div className='w-[140px]'>
                                <p className='font-medium truncate'>
                                    {userSummary.personaName}
                                </p>
                                <p className='text-xs text-altwhite truncate'>
                                    {userSummary.steamId}
                                </p>
                            </div>
                        </div>
                    </ExtLink>
                </div>
            </div>

            <SettingsCheckbox
                type='general'
                name='antiAway'
                content='Prevent away status on Steam'
                settings={settings}
                setSettings={setSettings}
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
            />

            <SettingsCheckbox
                type='general'
                name='freeGameNotifications'
                content='Get notifications about free games'
                settings={settings}
                setSettings={setSettings}
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
            />

            <SettingsCheckbox
                type='general'
                name='runAtStartup'
                content='Run at startup'
                settings={settings}
                setSettings={setSettings}
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
            />

            <div className='flex flex-col gap-2'>
                <p className='text-xs mt-2'>
                    Theme
                </p>
                <ThemeSwitch />
            </div>

            <div className='flex flex-col'>
                <p className='text-xs my-2' >
                    Use your own
                    <ExtLink
                        href='https://steamcommunity.com/dev/apikey'
                        className='mx-1 text-link hover:text-linkhover'
                    >
                        Steam web API key
                    </ExtLink>
                    <span className='italic'>(optional)</span>.
                    <ExtLink
                        href='https://steamgameidler.vercel.app/settings/general#use-your-own-steam-web-api-key'
                        className='mx-1 text-link hover:text-linkhover'
                    >
                        Learn more
                    </ExtLink>
                </p>
                <div className='flex gap-2'>
                    <Input
                        size='sm'
                        placeholder='Steam web API key'
                        className='max-w-[280px]'
                        classNames={{
                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                            input: ['!text-content placeholder:text-altwhite/50']
                        }}
                        value={keyValue}
                        onChange={(e) => handleKeyChange(e, setKeyValue)}
                        type='password'
                    />
                    <Button
                        size='sm'
                        isDisabled={hasKey || !keyValue}
                        className='font-semibold rounded-lg bg-dynamic text-button'
                        onPress={() => handleKeySave(keyValue, setHasKey)}
                    >
                        Save
                    </Button>
                    <Button
                        size='sm'
                        color='danger'
                        isDisabled={!hasKey}
                        className='font-semibold text-offwhite rounded-lg'
                        onPress={() => handleClear(setKeyValue, setHasKey)}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}