import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

import { Chat, Channel, MessageInput, MessageList, Window } from 'stream-chat-react';

import { useStreamChat } from '@/src/hooks/chat/useStreamChat';
import { ChatMessage } from '@/src/components/chat/ChatMessage';
import styles from '@/src/styles/ChatBox.module.css';
import Loader from '@/src/components/ui/Loader';

export default function ChatBox() {
    const { theme } = useTheme();
    const { client, channel, isLoading, error, cleanup } = useStreamChat();
    const [chatTheme, setChatTheme] = useState('str-chat__theme-light');
    const [memberCount, setMemberCount] = useState(0);
    const [watcherCount, setWatcherCount] = useState(0);

    console.log(channel);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        setChatTheme(theme === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light');
    }, [theme]);

    useEffect(() => {
        if (channel) {
            setMemberCount(channel.data.member_count || 0);
            setWatcherCount(channel.state.watcher_count || 0);
        }
    }, [channel]);

    if (error) {
        return (
            <div className='flex justify-center items-center w-calc h-calc'>
                <p className='text-red-500'>Failed to initialize chat: {error.message}</p>
            </div>
        );
    }

    if (isLoading || !client || !channel) {
        return (
            <div className='flex justify-center items-center w-calc h-calc'>
                <Loader />
            </div>
        );
    }

    return (
        <div className={`w-calc h-[calc(100vh-98px)] ${styles.chatContainer}`}>
            <div className='flex justify-between items-center p-3 pb-0'>
                <p className='text-xs'>
                    Steam Game Idler Chat
                </p>
                <div>
                    <p className='text-[10px]'>
                        {watcherCount} online
                    </p>
                    <p className='text-[10px]'>
                        {memberCount - watcherCount} offline
                    </p>
                </div>
            </div>
            <Chat client={client} theme={chatTheme}>
                <Channel channel={channel}>
                    <Window>
                        <MessageList Message={ChatMessage} />
                        <MessageInput
                            grow
                            focus
                            noFiles
                            mentionAllAppUsers
                            maxRows={10}
                        />
                    </Window>
                </Channel>
            </Chat>
        </div>
    );
}