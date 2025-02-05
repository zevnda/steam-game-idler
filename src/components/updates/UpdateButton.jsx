import { Divider, Tooltip } from '@heroui/react';
import { Fragment, useContext } from 'react';

import { FiDownload } from "react-icons/fi";
import { AppContext } from '@/src/components/layout/AppContext';

export default function UpdateButton() {
    const { setInitUpdate } = useContext(AppContext);

    return (
        <Fragment>
            <Tooltip content='Update available' closeDelay={0} size='sm'>
                <div className='flex justify-center items-center cursor-pointer w-[55px]' onClick={() => setInitUpdate(true)}>
                    <div className='flex items-center p-2 hover:bg-titlehover rounded-full'>
                        <FiDownload fontSize={18} className='text-success' />
                    </div>
                </div>
            </Tooltip>
            <Divider className='w-[1px] h-full bg-titleborder' />
        </Fragment>
    );
}