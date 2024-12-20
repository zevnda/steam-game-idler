import { Spinner } from '@nextui-org/react';
import React from 'react';

export default function Loader() {
    return (
        <React.Fragment>
            <div className='flex justify-center items-center w-calc h-loader'>
                <Spinner color='secondary' size='lg' />
            </div>
        </React.Fragment>
    );
}