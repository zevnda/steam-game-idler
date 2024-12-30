import React from 'react';
import { Button } from '@nextui-org/react';
import { TbCardsFilled } from "react-icons/tb";
import { FaAward } from 'react-icons/fa';
import { useAutomate } from '../hooks/useAutomateButtons';

export default function AutomateButtons() {
    const { startCardFarming, startAchievementUnlocker } = useAutomate();

    return (
        <React.Fragment>
            <Button
                size='sm'
                color='primary'
                className='rounded-full font-semibold'
                startContent={<TbCardsFilled fontSize={18} />}
                onPress={startCardFarming}
            >
                Card farming
            </Button>
            <Button
                size='sm'
                color='primary'
                className='rounded-full font-semibold'
                startContent={<FaAward fontSize={15} />}
                onPress={startAchievementUnlocker}
            >
                Achievement unlocker
            </Button>
        </React.Fragment>
    );
}