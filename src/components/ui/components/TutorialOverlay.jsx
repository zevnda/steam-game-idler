import React, { useState } from 'react';
import { Button } from '@nextui-org/react';
import { FaBackwardStep, FaForwardStep } from "react-icons/fa6";
import ExtLink from './ExtLink';

export default function TutorialOverlay({ onClose }) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            target: { top: '-20px', left: '80px', width: '100px', height: '100px' },
            spotlight: { size: 40 },
            title: 'Search Bar',
            content: 'Search for games in the games list by title.',
            contentPos: { y: 'top', x: 'left' },
        },
        {
            target: { top: '-20px', left: '1025px', width: '100px', height: '100px' },
            spotlight: { size: 40 },
            title: 'Notifications',
            content: 'Notifications about new SGI features and updates will be displayed here.',
            contentPos: { y: 'top', x: 'right' },
        },
        {
            target: { top: '45px', left: '-20px', width: '100px', height: '100px' },
            spotlight: { size: 40 },
            title: 'Games List',
            content: 'Displays a list of all the free and paid games in your Steam library.',
            contentPos: { y: 'top', x: 'left' },
        },
        {
            target: { top: '480px', left: '-20px', width: '100px', height: '100px' },
            spotlight: { size: 40 },
            title: 'Settings',
            content: 'Change settings for SGI and its features, such as Card Farming and Achievement Unlocker settings.',
            contentPos: { y: 'bottom', x: 'left' },
            url: 'https://github.com/zevnda/steam-game-idler/wiki/Settings'
        },
        {
            target: { top: '540px', left: '-20px', width: '100px', height: '100px' },
            spotlight: { size: 40 },
            title: 'Logout',
            content: 'Log out of of SGI and return to the account picker screen.',
            contentPos: { y: 'bottom', x: 'left' },
        },
        {
            target: { top: '40px', left: '605px', width: '100px', height: '100px' },
            spotlight: { size: 30 },
            title: 'Add A Game',
            content: 'Manually add games that you do not own, but have in your Steam library, such as family shared games.',
            contentPos: { y: 'top', x: 'right' },
        },
        {
            target: { top: '40px', left: '695px', width: '100px', height: '100px' },
            spotlight: { size: 55 },
            title: 'Card Farming',
            content: 'Start the Card Farming feature to automatically farm Steam Trading Cards.',
            contentPos: { y: 'top', x: 'right' },
            url: 'https://github.com/zevnda/steam-game-idler/wiki/Features#card-farming'
        },
        {
            target: { top: '40px', left: '850px', width: '100px', height: '100px' },
            spotlight: { size: 55 },
            title: 'Achievement Unlocker',
            content: 'Start the Achievement Unlocker feature to automatically unlock Steam Achievements.',
            contentPos: { y: 'top', x: 'right' },
            url: 'https://github.com/zevnda/steam-game-idler/wiki/Features#achievement-unlocker'
        },
        {
            target: { top: '40px', left: '1020px', width: '100px', height: '100px' },
            spotlight: { size: 55 },
            title: 'Sort Options',
            content: 'Sort the games list by various options, such as title, playtime, and more. You can also filter by games that you have in your Achievement Unlocker, Card Farming, and AutoIdle lists.',
            contentPos: { y: 'top', x: 'right' },
        },
        {
            target: { top: '80px', left: '130px', width: '100px', height: '200px' },
            spotlight: { size: 100 },
            title: 'Game Cards',
            content: 'Each game has it own game card. Hover over the game card to manually idle the game, view the game\'s achievements, and more.',
            contentPos: { y: 'top', x: 'left' },
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const skipTutorial = () => {
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    if (!steps || steps.length === 0) {
        return null;
    }

    const { target, spotlight, title, content, contentPos, url } = steps[currentStep];

    return (
        <React.Fragment>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 9998,
                pointerEvents: 'auto',
                mask: `radial-gradient(circle at ${parseInt(target.left) + parseInt(target.width) / 2}px ${parseInt(target.top) + parseInt(target.height) / 2}px, transparent ${spotlight.size}px, rgba(0, 0, 0, 0.7) ${spotlight.size + 10}px)`
            }}></div>
            <div style={{
                position: 'fixed',
                top: target.top,
                left: target.left,
                width: target.width,
                height: target.height,
                zIndex: 9999,
                pointerEvents: 'auto',
            }}>
                <div className={`absolute ${contentPos.y}-full ${contentPos.x}-1/2 transform bg-container rounded z-50`}>
                    <div className='flex justify-between items-center w-full bg-modalheader border-b border-border py-2 px-4'>
                        <p className='font-semibold'>
                            {title}
                        </p>
                        <p className='text-sm text-altwhite'>
                            {currentStep + 1}/{steps.length}
                        </p>
                    </div>

                    <div className='p-4'>
                        <p className='text-sm w-[500px]'>
                            {content}
                        </p>
                    </div>

                    <div className='flex justify-between items-end w-full border-t border-border bg-footer px-4 py-3'>
                        <div>
                            {url && (
                                <ExtLink href={url}>
                                    <p className=' text-xs text-link hover:text-linkhover'>
                                        Learn more about {title}
                                    </p>
                                </ExtLink>
                            )}
                        </div>

                        <div className='flex gap-2'>
                            <Button
                                size='sm'
                                color='primary'
                                isIconOnly
                                startContent={<FaBackwardStep />}
                                isDisabled={currentStep === 0}
                                onPress={prevStep}
                            />
                            <Button
                                size='sm'
                                color='primary'
                                isIconOnly
                                startContent={<FaForwardStep />}
                                isDisabled={currentStep === steps.length - 1}
                                onPress={nextStep}
                            />
                            {currentStep < steps.length - 1 && (
                                <Button
                                    size='sm'
                                    color='default'
                                    className='font-semibold'
                                    onPress={skipTutorial}
                                >
                                    Skip
                                </Button>
                            )}
                            {currentStep === steps.length - 1 && (
                                <Button
                                    size='sm'
                                    color='danger'
                                    className='font-semibold'
                                    onPress={skipTutorial}
                                >
                                    Finish
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}