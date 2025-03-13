import { Spinner } from '@heroui/react';

export default function Loader() {
    return (
        <div className='flex justify-center items-center w-calc h-calc'>
            <Spinner classNames={{ circle1: ['border-b-dynamic'], circle2: ['border-b-dynamic'] }} />
        </div>
    );
}