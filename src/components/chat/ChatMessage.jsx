import { Fragment, useState } from 'react';
import Image from 'next/image';

import { useMessageContext, useDeleteHandler, useChatContext, useEditHandler } from 'stream-chat-react';

import { FaTrash, FaEdit } from 'react-icons/fa';

export const ChatMessage = () => {
    const { message, isMyMessage } = useMessageContext();
    const { client } = useChatContext();

    const handleDelete = useDeleteHandler(message);
    const { editing, setEdit, clearEdit } = useEditHandler();

    const [editedText, setEditedText] = useState(message.text);

    const handleSaveEdit = async () => {
        try {
            const trimmedText = trimTrailingNewLines(editedText);
            console.log(trimmedText);
            await client.updateMessage({
                ...message,
                text: trimmedText,
            });
            clearEdit();
        } catch (error) {
            console.error('Failed to update message:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            clearEdit();
        }
    };

    const getLineCount = (text) => {
        return text.split('\n').length;
    };

    const trimTrailingNewLines = (text) => {
        return text.replace(/\n+$/, '');
    };

    const hasAttachments = message.attachments && message.attachments.length > 0;
    const imageAttachments = hasAttachments
        ? message.attachments.filter(att => att.type === 'image')
        : [];

    return (
        <Fragment>
            {message?.deleted_at === null && (
                <div className='group py-1 px-3 hover:bg-[#f1f1f1] dark:hover:bg-[#191919] relative mb-2.5'>
                    {(isMyMessage() || client?.user?.dashboard_user) && (
                        <div className='absolute flex top-[-10px] right-2 rounded-sm bg-[#ebebeb] dark:bg-[#2a2a2a] border border-border opacity-0 group-hover:opacity-100'>
                            <Fragment>
                                <div className='p-1 cursor-pointer hover:bg-[#dedede] dark:hover:bg-[#353535]'>
                                    <FaEdit onClick={setEdit} />
                                </div>
                                <div className='p-1 cursor-pointer hover:bg-[#dedede] dark:hover:bg-[#353535]'>
                                    <FaTrash className='text-danger' onClick={handleDelete} />
                                </div>
                            </Fragment>
                        </div>
                    )}
                    <div className='flex items-start gap-4'>
                        <div className='flex-shrink-0'>
                            <div className='w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center'>
                                <Image
                                    src={message?.user?.image}
                                    width={34}
                                    height={34}
                                    alt='Chat avatar'
                                    className='rounded-full'
                                />
                            </div>
                        </div>
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-baseline'>
                                <p className={`text-xs mr-0.5 text-altwhite ${message?.user?.dashboard_user && 'text-purple-500 font-semibold'}`}>
                                    {message.user?.name}
                                </p>
                                <span className='text-[10px] text-gray-400 ml-2'>
                                    {new Date(message.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            {editing ? (
                                <div className='text-xs break-words'>
                                    <textarea
                                        autoFocus
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className='w-full p-1 border border-gray-300 rounded'
                                        rows={getLineCount(editedText)}
                                    />
                                    <button onClick={handleSaveEdit} className='text-xs text-blue-500'>Save</button>
                                    <button onClick={clearEdit} className='text-xs text-red-500 ml-2'>Cancel</button>
                                </div>
                            ) : (
                                <Fragment>
                                    {message.text && (
                                        <div className='text-xs break-words'>
                                            {trimTrailingNewLines(message.text).split('\n').map((line, index) => (
                                                <Fragment key={index}>
                                                    {line}
                                                    <br />
                                                </Fragment>
                                            ))}
                                        </div>
                                    )}
                                    {imageAttachments.length > 0 && (
                                        <div className={`mt-2 grid gap-2 ${imageAttachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                                            } max-w-[400px]`}>
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
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    );
};
