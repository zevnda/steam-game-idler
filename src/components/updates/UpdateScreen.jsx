import { Fragment, useContext, useEffect } from 'react';

import { Progress, Spinner } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import Header from '@/src/components/ui/Header';
import useUpdateScreen from '@/src/hooks/updates/useUpdateScreen';


export default function UpdateScreen({ updateManifest }) {
    const { setActivePage } = useContext(AppContext);
    const { progress, checkForUpdate } = useUpdateScreen(updateManifest);

    useEffect(() => {
        setActivePage('update');
    }, []);

    return (
        <Fragment>
            <Header />
            <div className='flex justify-center items-center flex-col gap-2 w-screen h-[calc(100vh-62px)]'>
                {checkForUpdate ? (
                    <Fragment>
                        <p className='text-sm font-semibold'>
                            Checking for updates
                        </p>
                        <Spinner />
                    </Fragment>
                ) : (
                    <Fragment>
                        <p className='text-sm font-semibold'>
                            Installing updates..
                        </p>
                        <Progress aria-label='progress-bar' color='secondary' size='sm' value={progress} className='w-1/2' />
                    </Fragment>
                )}
            </div>
        </Fragment>
    );
}