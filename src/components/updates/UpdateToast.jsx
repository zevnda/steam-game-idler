import { Fragment } from 'react';

import { Button } from '@heroui/react';

import { handleUpdate } from '@/src/utils/updates/updateToastHandler';

export default function UpdateToast({ closeToast, updateManifest, setInitUpdate }) {
    return (
        <Fragment>
            <div className='flex flex-col gap-1 text-black dark:text-offwhite'>
                <p className='text-[15px] font-semibold'>
                    Update available
                </p>
                <p className='text-sm'>
                    Version <span className='font-mono bg-containerhover px-1 py-0.5 rounded'>{updateManifest?.version || 'Unknown'}</span> is now available
                </p>

                <div className='flex justify-end w-full gap-2 mt-3'>
                    <Button
                        size='sm'
                        color='danger'
                        variant='light'
                        className='font-semibold rounded'
                        onPress={closeToast}
                    >
                        Later
                    </Button>
                    <Button
                        size='sm'
                        color='primary'
                        className='font-semibold rounded'
                        onPress={() => handleUpdate(closeToast, setInitUpdate)}
                    >
                        Install
                    </Button>
                </div>
            </div>
        </Fragment>
    );
}