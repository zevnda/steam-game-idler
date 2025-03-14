import { Spinner } from '@heroui/react';

export default function Loader() {
    return (
        <div className='flex justify-center items-center w-calc h-calc'>
            <Spinner variant='simple' />
        </div>
    );
}