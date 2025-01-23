import React, { useContext } from 'react';
import ExtLink from '@/src/components/ui/components/ExtLink';
import { Button, Checkbox, Input } from '@nextui-org/react';
import { handleSave, handleClear, handleCheckboxChange } from '@/src/components/settings/utils/cardSettingsHandler';
import useCardSettings from '@/src/components/settings/hooks/useCardSettings';
import { AppContext } from '../../layout/components/AppContext';
import Image from 'next/image';

export default function CardSettings({ settings, setSettings }) {
    const { userSummary } = useContext(AppContext);
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
        cardFarmingUser,
        setCardFarmingUser,
    } = useCardSettings(settings);

    return (
        <React.Fragment>
            <div className='relative flex flex-col gap-4 p-2'>
                {cardFarmingUser && (
                    <div className='absolute top-0 right-2'>
                        <p className='text-xs text-neutral-400 mb-0.5'>
                            Farming cards as
                        </p>
                        <div className='border border-border rounded bg-input hover:bg-titlebar dark:bg-[#131313] dark:hover:bg-[#171717]'>
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
                                        <p className='text-xs text-neutral-400 truncate'>
                                            {cardFarmingUser.steamId}
                                        </p>
                                    </div>
                                </div>
                            </ExtLink>
                        </div>
                    </div>
                )}
                <Checkbox
                    name='listGames'
                    isSelected={localSettings?.cardFarming?.listGames || false}
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
                    isSelected={localSettings?.cardFarming?.allGames || false}
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
                        Steam credentials are required in order to use the Card Farming feature. <ExtLink href={'https://steamgameidler.vercel.app/steam-credentials'} className='text-link hover:text-linkhover'>Learn more</ExtLink>
                    </p>
                    <div className='flex flex-col mt-4'>
                        <div className='flex flex-col gap-2'>
                            <Input
                                size='sm'
                                label='sessionid'
                                labelPlacement='outside'
                                placeholder=' '
                                className='max-w-[300px]'
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
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
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
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
                                classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
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
                                    onPress={() => handleSave(sidValue, slsValue, smaValue, setHasCookies, userSummary, setCardFarmingUser)}
                                >
                                    Save
                                </Button>
                                <Button
                                    size='sm'
                                    color='danger'
                                    isDisabled={!hasCookies}
                                    className='font-semibold rounded w-full'
                                    onPress={() => handleClear(setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser)}
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