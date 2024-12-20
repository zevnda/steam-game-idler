import React from 'react';
import { Button } from '@nextui-org/react';
import { handleUpdate } from '../utils/updateToastHandler';

export default function UpdateToast({ closeToast, updateManifest, setInitUpdate }) {
    return (
        <React.Fragment>
            <div className='flex flex-col gap-1 text-black dark:text-offwhite'>
                <p className='font-semibold uppercase'>
                    Update available
                </p>
                <p className='text-xs'>
                    Version <span className='font-mono bg-containerhover px-1 py-0.5 rounded'>{updateManifest?.version || 'Unknown'}</span> is now available to install
                </p>

                <div className='flex justify-end w-full gap-2 mt-3'>
                    <Button
                        size='sm'
                        color='danger'
                        variant='light'
                        className='max-h-[25px] font-semibold rounded'
                        onClick={closeToast}
                    >
                        Not Now
                    </Button>
                    <Button
                        size='sm'
                        color='primary'
                        className='max-h-[25px] font-semibold rounded'
                        onClick={() => handleUpdate(closeToast, setInitUpdate)}
                    >
                        Install Update
                    </Button>
                </div>
            </div>
        </React.Fragment>
    );
}