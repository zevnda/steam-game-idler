import { Divider, Tooltip } from '@heroui/react';
import { Fragment, useContext } from 'react';

import { AppContext } from '@/components/layout/AppContext';

import { TbDownload } from 'react-icons/tb';

export default function UpdateButton() {
    const { setInitUpdate } = useContext(AppContext);

    return (
        <Fragment>
            <Tooltip content='Update Ready!' placement='left' closeDelay={0} size='sm'>
                <div className='flex justify-center items-center cursor-pointer' onClick={() => setInitUpdate(true)}>
                    <div className='flex items-center p-2 hover:bg-titlehover rounded-full'>
                        <TbDownload fontSize={18} className='text-success' />
                    </div>
                </div>
            </Tooltip>
            <Divider className='w-[1px] h-6 bg-border' />
        </Fragment>
    );
}