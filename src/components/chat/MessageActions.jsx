import { Fragment } from 'react';
import { FaPen } from 'react-icons/fa';
import { RiDeleteBin5Fill } from 'react-icons/ri';

const MessageActions = ({ handleEditClick, handleDelete }) => (
    <div className='absolute flex items-center top-[-10px] right-2 rounded-sm bg-[#ebebeb] dark:bg-[#2a2a2a] border border-border opacity-0 group-hover:opacity-100'>
        <Fragment>
            <div className='p-1 cursor-pointer hover:bg-[#dedede] dark:hover:bg-[#353535]'>
                <FaPen fontSize={12} onClick={handleEditClick} />
            </div>
            <div className='p-1 cursor-pointer hover:bg-[#dedede] dark:hover:bg-[#353535]'>
                <RiDeleteBin5Fill className='text-danger' onClick={handleDelete} />
            </div>
        </Fragment>
    </div>
);

export default MessageActions;
