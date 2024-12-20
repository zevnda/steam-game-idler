import React from 'react';
import ExtLink from '@/src/components/ui/components/ExtLink';
import { Button, Checkbox, Input } from '@nextui-org/react';
import { handleSave, handleClear, handleCheckboxChange } from '@/src/components/settings/utils/cardSettingsHandler';
import useCardSettings from '@/src/components/settings/hooks/useCardSettings';

export default function CardSettings({ settings, setSettings }) {
    const {
        sidValue,
        slsValue,
        smaValue,
        hasCookies,
        setSidValue,
        setSlsValue,
        setSmaValue,
        setHasCookies,
        localSettings,
        setLocalSettings,
        handleSidChange,
        handleSlsChange,
        handleSmaChange,
    } = useCardSettings(settings);

    return (
        <React.Fragment>
            <div className='flex flex-col gap-4 p-2'>
                <Checkbox
                    name='listGames'
                    isSelected={localSettings?.cardFarming?.listGames}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            Card farming list
                        </p>
                    </div>
                </Checkbox>

                <Checkbox
                    name='allGames'
                    isSelected={localSettings?.cardFarming?.allGames}
                    onChange={(e) => handleCheckboxChange(e, localSettings, setLocalSettings, setSettings)}
                >
                    <div className='flex items-center gap-1'>
                        <p className='text-xs'>
                            All games with drops
                        </p>
                    </div>
                </Checkbox>

                <div className='w-full'>
                    <p className='text-xs my-2'>
                        Steam credentials are required in order to use the Card Farming feature. <ExtLink href={'https://github.com/probablyraging/steam-game-idler/wiki/steam-credentials'} className='text-blue-400'>Learn more</ExtLink>
                    </p>
                    <div className='flex flex-col mt-4'>
                        <div className='flex flex-col gap-2'>
                            <Input
                                size='sm'
                                label='sessionid'
                                labelPlacement='outside'
                                placeholder=' '
                                className='max-w-[300px]'
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md'] }}
                                value={sidValue}
                                onChange={handleSidChange}
                                type={'password'}
                            />
                            <Input
                                size='sm'
                                label='steamLoginSecure'
                                labelPlacement='outside'
                                placeholder=' '
                                className='max-w-[300px]'
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md'] }}
                                value={slsValue}
                                onChange={handleSlsChange}
                                type={'password'}
                            />
                            <Input
                                size='sm'
                                label={<p>steamParental/steamMachineAuth <span className='italic'>(optional)</span></p>}
                                labelPlacement='outside'
                                placeholder=' '
                                className='max-w-[300px]'
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md'] }}
                                value={smaValue}
                                onChange={handleSmaChange}
                                type={'password'}
                            />
                            <div className='flex w-[200px] gap-2 mt-2'>
                                <Button
                                    size='sm'
                                    color='primary'
                                    isDisabled={hasCookies || !sidValue || !slsValue}
                                    className='font-semibold rounded-md w-full'
                                    onClick={() => handleSave(sidValue, slsValue, smaValue, setHasCookies)}
                                >
                                    Save
                                </Button>
                                <Button
                                    size='sm'
                                    color='danger'
                                    isDisabled={!hasCookies}
                                    className='font-semibold rounded w-full'
                                    onClick={() => handleClear(setHasCookies, setSidValue, setSlsValue, setSmaValue)}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}