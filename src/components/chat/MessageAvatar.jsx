import Image from 'next/image';

const MessageAvatar = ({ image }) => (
    <div className='flex-shrink-0'>
        <div className='w-9 h-9 rounded-full bg-container border border-border flex items-center justify-center'>
            <Image
                src={image}
                width={34}
                height={34}
                alt='Chat avatar'
                className='rounded-full'
            />
        </div>
    </div>
);

export default MessageAvatar;
