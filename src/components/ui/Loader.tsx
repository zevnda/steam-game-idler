import { Spinner } from '@heroui/react';
import type { JSX } from 'react';

export default function Loader(): JSX.Element {
    return (
        <div className='flex justify-center items-center w-calc h-calc'>
            <Spinner variant='simple' />
        </div>
    );
}