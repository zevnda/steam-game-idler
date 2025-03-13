import { Fragment, useContext } from 'react';
import Image from 'next/image';

import { Button, Checkbox, Input } from '@heroui/react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { handleCheckboxChange, handleRunAtStartupChange, handleKeyChange, handleKeySave, handleClear } from '@/utils/settings/generalSettingsHandler';
import { antiAwayStatus } from '@/utils/utils';
import useGeneralSettings from '@/hooks/settings/useGeneralSettings';
import ExtLink from '@/components/ui/ExtLink';
import ThemeSwitch from '../ui/theme/ThemeSwitch';

export default function GeneralSettings({ settings, setSettings }) {
    const { isDarkMode } = useContext(StateContext);
    const { userSummary } = useContext(UserContext);
    const { localSettings, setLocalSettings, startupState, setStartupState, keyValue, setKeyValue, hasKey, setHasKey } = useGeneralSettings(settings);

    return (
        <Fragment>
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

                <Checkbox
                    name='stealthIdle'
                    isSelected={localSettings?.general?.stealthIdle || false}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                    classNames={{
                        wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button group-data-[hover=true]:before:${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`]
                    }}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs text-content'>
                            Hide idle windows <span className='italic'>(not recommended)</span>
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='antiAway'
                    isSelected={localSettings?.general?.antiAway || false}
                    onChange={(e) => {
                        handleCheckboxChange(e, localSettings, setLocalSettings, setSettings);
                        antiAwayStatus(!localSettings?.general?.antiAway);
                    }}
                    classNames={{
                        wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button group-data-[hover=true]:before:${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`]
                    }}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs text-content'>
                            Prevent away status on Steam
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='freeGameNotifications'
                    isSelected={localSettings?.general?.freeGameNotifications || false}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                    classNames={{
                        wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button group-data-[hover=true]:before:${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`]
                    }}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs text-content'>
                            Get notifications about free games
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='clearData'
                    isSelected={localSettings?.general?.clearData || false}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                    classNames={{
                        wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button group-data-[hover=true]:before:${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`]
                    }}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs text-content'>
                            Clear custom list when logging out
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    isSelected={startupState || false}
                    onChange={() => handleRunAtStartupChange(startupState, setStartupState)}
                    classNames={{
                        wrapper: [`before:group-data-[selected=true]:!border-dynamic after:bg-dynamic border-red-500 text-button group-data-[hover=true]:before:${isDarkMode ? 'bg-white/20' : 'bg-black/20'}`]
                    }}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs text-content'>
                            Run at startup
                        </p>
                    </div>
                </Checkbox>

                <div className='flex flex-col gap-2'>
                    <p className='text-xs mt-2'>
                        Theme
                    </p>
                    <ThemeSwitch />
                </div>

                <div className='flex flex-col'>
                    <p className='text-xs my-2' >
                        Use your own
                        <ExtLink href={'https://steamcommunity.com/dev/apikey'} className={'mx-1 text-link hover:text-linkhover'}>
                            Steam web API key
                        </ExtLink>
                        <span className='italic'>(optional)</span>.
                        <ExtLink href={'https://steamgameidler.vercel.app/settings/general#use-your-own-steam-web-api-key'} className={'mx-1 text-link hover:text-linkhover'}>
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
                            type={'password'}
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
        </Fragment>
    );
}