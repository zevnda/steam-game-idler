import { Fragment } from 'react';

import { Spinner } from '@heroui/react';

export default function Loader() {
    return (
        <Fragment>
            <div className='flex justify-center items-center w-calc h-calc'>
                <Spinner />
            </div>
        </Fragment>
    );
}