import { Fragment, useContext } from 'react';
import Image from 'next/image';

import { Button, Checkbox, Input } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import { handleCheckboxChange, handleRunAtStartupChange, handleKeyChange, handleKeySave, handleClear } from '@/src/utils/settings/generalSettingsHandler';
import { antiAwayStatus } from '@/src/utils/utils';
import useGeneralSettings from '@/src/hooks/settings/useGeneralSettings';
import ExtLink from '@/src/components/ui/ExtLink';

export default function GeneralSettings({ settings, setSettings }) {
    const { userSummary } = useContext(AppContext);
    const { localSettings, setLocalSettings, startupState, setStartupState, keyValue, setKeyValue, hasKey, setHasKey } = useGeneralSettings(settings);

    return (
        <Fragment>
            <div className='relative flex flex-col gap-4 p-2'>
                <div className='absolute top-0 right-2'>
                    <p className='text-xs text-neutral-400 mb-0.5'>
                        Logged in as
                    </p>
                    <div className='border border-border rounded bg-input hover:bg-titlebar dark:bg-[#131313] dark:hover:bg-[#171717]'>
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
                    isSelected={localSettings?.general?.stealthIdle || false}
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
                    isSelected={localSettings?.general?.antiAway || false}
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
                    isSelected={localSettings?.general?.freeGameNotifications || false}
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
                    isSelected={localSettings?.general?.clearData || false}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Delete saved data on logout
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    isSelected={startupState || false}
                    onChange={() => handleRunAtStartupChange(startupState, setStartupState)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Run at startup
                        </p>
                    </div>
                </Checkbox>

                <div className='flex flex-col'>
                    <p className='text-xs my-2' >
                        Use your own
                        <ExtLink href={'https://steamcommunity.com/dev/apikey'} className={'mx-1 text-link hover:text-linkhover'}>
                            Steam web API key
                        </ExtLink>
                        instead of the default one <span className='italic'>(optional)</span>
                    </p>
                    <div className='flex gap-4'>
                        <Input
                            size='sm'
                            placeholder='Steam web API key'
                            className='max-w-[280px]'
                            classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
                            value={keyValue}
                            onChange={(e) => handleKeyChange(e, setKeyValue)}
                            type={'password'}
                        />
                        <Button
                            size='sm'
                            color='primary'
                            isDisabled={hasKey || !keyValue}
                            className='font-semibold rounded'
                            onPress={() => handleKeySave(keyValue, setHasKey)}
                        >
                            Save
                        </Button>
                        <Button
                            size='sm'
                            color='danger'
                            isDisabled={!hasKey}
                            className='font-semibold text-offwhite rounded'
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