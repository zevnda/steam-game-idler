import { Spinner } from '@heroui/react';
import type { ReactElement } from 'react';

export default function Loader(): ReactElement {
    return (
        <div className='flex justify-center items-center w-calc h-calc'>
            <Spinner variant='simple' />
        </div>
    );
}