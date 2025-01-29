import { Fragment } from 'react';
import { isToday, isYesterday } from 'date-fns';
import { MdOutlineVerified } from 'react-icons/md';
import { FaBug, FaEarlybirds, FaGithubAlt } from 'react-icons/fa';
import { RiPoliceBadgeFill, RiVerifiedBadgeFill } from 'react-icons/ri';
import { IoMdBug } from 'react-icons/io';
import { Tooltip } from '@heroui/react';

const MessageContent = ({ message, editing, editedText, setEditedText, handleKeyDown, handleSaveEdit, clearEdit, trimTrailingNewLines, getLineCount }) => {
    const formatTimestamp = (date) => {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const options = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: userTimeZone };

        if (isToday(date)) {
            return `Today at ${new Intl.DateTimeFormat('en-US', options).format(date)}`;
        } else if (isYesterday(date)) {
            return `Yesterday at ${new Intl.DateTimeFormat('en-US', options).format(date)}`;
        } else {
            return new Intl.DateTimeFormat('en-US', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
        }
    };

    const formatMentions = (text, mentionedUsers) => {
        let formattedText = text;
        mentionedUsers.forEach(user => {
            const mentionRegex = new RegExp(`@${user.name}`, 'g');
            formattedText = formattedText.replace(mentionRegex, `<span class="mention">@${user.name}</span>`);
        });
        return formattedText;
    };

    return (
        <div className='flex-1 min-w-0'>
            <div className='flex items-baseline mb-1'>
                <p className={`inline-flex items-baseline gap-1 text-xs text-altwhite font-semibold leading-none ${message?.user?.dashboard_user && ''}`}>
                    <span className='align-baseline'>{message.user?.name}</span>
                    {message?.user?.dashboard_user && (
                        <Tooltip
                            content={<span className='text-[10px] text-white'>Administrator</span>}
                            className='bg-blue-500'
                            size='sm'
                            closeDelay={0}
                            showArrow={true}
                            classNames={{
                                base: ['before:bg-blue-500'],
                                content: ['px-[6px] py-[1px]']
                            }}
                        >
                            <span><RiPoliceBadgeFill className='translate-y-[2.5px] text-blue-500' size={16} /></span>
                        </Tooltip>
                    )}
                    {message?.user?.role === 'early_supporter' && (
                        <Tooltip
                            content={<span className='text-[10px] text-white'>Early Supporter</span>}
                            className='bg-orange-400'
                            size='sm'
                            closeDelay={0}
                            showArrow={true}
                            classNames={{
                                base: ['before:bg-orange-400'],
                                content: ['px-[6px] py-[1px]']
                            }}
                        >
                            <span><FaGithubAlt className='translate-y-[2.5px] text-orange-400' size={16} /></span>
                        </Tooltip>
                    )}
                    <span className='text-[10px] text-gray-400 align-baseline leading-none'>
                        {formatTimestamp(new Date(message.created_at))}
                    </span>
                </p>
            </div>
            {editing ? (
                <div className='text-xs break-words'>
                    <textarea
                        id='edit-textarea'
                        autoFocus
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className='w-full border border-border p-2 bg-input rounded focus-within:outline-none'
                        rows={getLineCount(editedText)}
                    />
                    <p className='text-[10px] text-altwhite'>
                        escape to <span className='text-link cursor-pointer hover:underline' onClick={handleSaveEdit}>cancel</span>
                        <span className='mx-1'>•</span>
                        enter to <span className='text-link cursor-pointer hover:underline' onClick={clearEdit}>save</span>
                    </p>
                </div>
            ) : (
                <Fragment>
                    {message.text && (
                        <div className='text-xs break-words' dangerouslySetInnerHTML={{ __html: formatMentions(trimTrailingNewLines(message.text), message.mentioned_users) }} />
                    )}
                </Fragment>
            )}
        </div>
    );
};

export default MessageContent;
