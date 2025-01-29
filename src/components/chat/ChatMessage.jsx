import { Fragment, useState } from 'react';
import { useMessageContext, useDeleteHandler, useChatContext, useEditHandler } from 'stream-chat-react';
import MessageActions from './MessageActions';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageAttachments from './MessageAttachments';

export const ChatMessage = () => {
    const { message, isMyMessage } = useMessageContext();
    const { client } = useChatContext();

    const handleDelete = useDeleteHandler(message);
    const { editing, setEdit, clearEdit } = useEditHandler();

    const [editedText, setEditedText] = useState(message.text);

    const handleSaveEdit = async () => {
        try {
            const trimmedText = trimTrailingNewLines(editedText);
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

    const getLineCount = (text) => text.split('\n').length;

    const trimTrailingNewLines = (text) => text.replace(/\n+$/, '');

    const handleEditClick = () => {
        setEdit();
        setTimeout(() => {
            const textarea = document.getElementById('edit-textarea');
            if (textarea) {
                textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
                textarea.focus();
            }
        }, 0);
    };

    const hasAttachments = message.attachments && message.attachments.length > 0;
    const imageAttachments = hasAttachments
        ? message.attachments.filter(att => att.type === 'image')
        : [];

    const isMentioned = message.mentioned_users.some(user => user.id === client.user.id);

    return (
        <Fragment>
            {message?.deleted_at === null && (
                <div className={`group py-1 px-3 hover:bg-[#f3f3f3] dark:hover:bg-[#191919] relative mb-2.5 border-l-2 border-transparent ${isMentioned && 'border-[#5589dc8f] bg-[#5589dc16] hover:bg-[#5589dc29] dark:hover:bg-[#5589dc1b]'}`}>
                    {(isMyMessage() || client?.user?.dashboard_user) && (
                        <MessageActions
                            handleEditClick={handleEditClick}
                            handleDelete={handleDelete}
                        />
                    )}
                    <div className='flex items-start gap-4'>
                        <MessageAvatar image={message?.user?.image} />
                        <MessageContent
                            message={message}
                            editing={editing}
                            editedText={editedText}
                            setEditedText={setEditedText}
                            handleKeyDown={handleKeyDown}
                            handleSaveEdit={handleSaveEdit}
                            clearEdit={clearEdit}
                            trimTrailingNewLines={trimTrailingNewLines}
                            getLineCount={getLineCount}
                        />
                    </div>
                    <MessageAttachments imageAttachments={imageAttachments} message={message} />
                </div>
            )}
        </Fragment>
    );
};
