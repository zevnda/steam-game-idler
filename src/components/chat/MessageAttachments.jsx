import Image from 'next/image';

const MessageAttachments = ({ imageAttachments, message }) => (
    imageAttachments.length > 0 && (
        <div className={`mt-2 grid gap-2 ${imageAttachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-[400px]`}>
            {imageAttachments.map((attachment, index) => (
                <div
                    key={`${message.id}-${index}`}
                    className='relative rounded-lg overflow-hidden'
                >
                    <Image
                        src={attachment.image_url}
                        alt={attachment.fallback || 'Image attachment'}
                        width={400}
                        height={300}
                        className='object-cover hover:scale-105 transition-transform cursor-pointer'
                        loading='lazy'
                    />
                </div>
            ))}
        </div>
    )
);

export default MessageAttachments;
