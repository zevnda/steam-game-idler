import React from 'react';
import { Button, Checkbox, Input } from '@nextui-org/react';
import ExtLink from '@/src/components/ui/components/ExtLink';
import { antiAwayStatus } from '@/src/utils/utils';
import useGeneralSettings from '../hooks/useGeneralSettings';
import { handleCheckboxChange, handleRunAtStartupChange, handleKeyChange, handleKeySave, handleClear } from '../utils/generalSettingsHandler';
import Image from 'next/image';

export default function GeneralSettings({ userSummary, settings, setSettings }) {
    const {
        localSettings,
        setLocalSettings,
        startupState,
        setStartupState,
        keyValue,
        setKeyValue,
        hasKey,
        setHasKey
    } = useGeneralSettings(settings);

    return (
        <React.Fragment>
            <div className='relative flex flex-col gap-4 p-2'>
                <div className='absolute top-0 right-2'>
                    <p className='text-xs text-neutral-400 mb-0.5'>
                        Logged in as
                    </p>
                    <div className='border border-border rounded hover:bg-input'>
                        <ExtLink href={`https://steamcommunity.com/profiles/${userSummary.steamId}`}>
                            <div className='flex items-center gap-2 h-full p-2'>
                                <Image src={userSummary.avatar} height={40} width={40} alt='user avatar' className='w-[40px] h-[40px] rounded-full' />
                                <div className='w-[140px]'>
                                    <p className='font-medium truncate'>
                                        {userSummary.personaName}
                                    </p>
                                    <p className='text-xs text-neutral-400 truncate'>
                                        {userSummary.steamId}
                                    </p>
                                </div>
                            </div>
                        </ExtLink>
                    </div>
                </div>

                <Checkbox
                    name='stealthIdle'
                    isSelected={localSettings?.general?.stealthIdle}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Stealth idle windows
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='antiAway'
                    isSelected={localSettings?.general?.antiAway}
                    onChange={(e) => {
                        handleCheckboxChange(e, localSettings, setLocalSettings, setSettings);
                        antiAwayStatus(!localSettings?.general?.antiAway);
                    }}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Anti-away status
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='freeGameNotifications'
                    isSelected={localSettings?.general?.freeGameNotifications}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Free game notifications
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='clearData'
                    isSelected={localSettings?.general?.clearData}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Delete saved data on logout
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    isSelected={startupState}
                    onChange={() => handleRunAtStartupChange(startupState, setStartupState)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Run at startup
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='minimizeToTray'
                    isSelected={localSettings?.general?.minimizeToTray}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Minimize to tray
                        </p>
                    </div>
                </Checkbox>

                <div className='flex flex-col'>
                    <p className='text-xs my-2' >
                        Use your own
                        <ExtLink href={'https://steamcommunity.com/dev/apikey'} className={'mx-1 text-blue-400'}>
                            Steam web API key
                        </ExtLink>
                        instead of the default one <span className='italic'>(optional)</span>
                    </p>
                    <div className='flex gap-4'>
                        <Input
                            size='sm'
                            placeholder='Steam web API key'
                            className='max-w-[280px]'
                            classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md'] }}
                            value={keyValue}
                            onChange={(e) => handleKeyChange(e, setKeyValue)}
                            type={'password'}
                        />
                        <Button
                            size='sm'
                            color='primary'
                            isDisabled={hasKey || !keyValue}
                            className='font-semibold rounded'
                            onClick={() => handleKeySave(keyValue, setHasKey)}
                        >
                            Save
                        </Button>
                        <Button
                            size='sm'
                            color='danger'
                            isDisabled={!hasKey}
                            className='font-semibold text-offwhite rounded'
                            onClick={() => handleClear(setKeyValue, setHasKey)}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}