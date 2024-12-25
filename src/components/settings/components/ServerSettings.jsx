import React from 'react';
import { Button, Checkbox, Input } from '@nextui-org/react';
import useServerSettings from '../hooks/useServerSettings';
import { handleCheckboxChange, handleClear, handleEnableChange, handleSave } from '../utils/serverSettingsHandler';

export default function ServerSettings({ settings, setSettings }) {
    const { localSettings, setLocalSettings, portValue, setPortValue, handlePortChange, hasServerSettings, setHasServerSettings } = useServerSettings(settings);

    return (
        <React.Fragment>
            <div className='relative flex flex-col gap-4 p-2'>
                <Checkbox
                    name='enabled'
                    isSelected={localSettings?.serverSettings?.enabled || false}
                    onChange={(e) => handleEnableChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Enable mobile server
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='local'
                    isSelected={localSettings?.serverSettings?.local || false}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Local server
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='public'
                    isSelected={localSettings?.serverSettings?.public || false}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Public server
                        </p>
                    </div>
                </Checkbox>

                <Input
                    size='sm'
                    label='Port'
                    labelPlacement='outside'
                    placeholder=' '
                    className='max-w-[80px] leading-6'
                    classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'], }}
                    value={portValue}
                    onChange={handlePortChange}
                />

                <div className='flex w-[200px] gap-2 mt-2'>
                    <Button
                        size='sm'
                        color='primary'
                        isDisabled={hasServerSettings || !portValue}
                        className='font-semibold rounded-md w-full'
                        onPress={() => handleSave(portValue, setHasServerSettings)}
                    >
                        Save
                    </Button>
                    <Button
                        size='sm'
                        color='danger'
                        isDisabled={!hasServerSettings}
                        className='font-semibold rounded w-full'
                        onPress={() => handleClear(setHasServerSettings, setPortValue)}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </React.Fragment>
    );
}