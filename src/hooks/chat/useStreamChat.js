import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import 'stream-chat-react/dist/css/v2/index.css';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export function useStreamChat() {
    const [client, setClient] = useState(null);
    const [username, setUsername] = useState(null);
    const [channel, setChannel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const connectUser = async () => {
        const userSummary = localStorage.getItem('userSummary');
        const { personaName, avatar } = JSON.parse(userSummary);

        try {
            let chatToken = localStorage.getItem('chatToken');

            if (!chatToken) {
                const response = await fetch('https://apibase.vercel.app/api/getToken', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: personaName })
                });
                const data = await response.json();
                chatToken = data.token;

                localStorage.setItem('chatUsername', personaName);
                localStorage.setItem('chatToken', chatToken);
            }

            const chatClient = new StreamChat(API_KEY);

            await chatClient.connectUser(
                {
                    id: personaName,
                    name: personaName,
                    image: avatar,
                },
                chatToken
            );

            const channel = chatClient.channel('messaging', 'steam-game-idler-chat', {
                name: 'Steam Game Idler Chat',
            });
            await channel.watch();

            setClient(chatClient);
            setChannel(channel);
            setUsername(personaName);
        } catch (error) {
            console.error('Chat connection error:', error);
            setError(error);
            localStorage.removeItem('chatUsername');
            localStorage.removeItem('chatToken');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const userSummary = localStorage.getItem('userSummary');
        if (userSummary && !client) {
            connectUser();
        } else {
            setIsLoading(false);
        }

        return () => {
            if (client) {
                client.disconnectUser();
            }
        };
    }, []);

    const cleanup = () => {
        if (client) {
            client.disconnectUser();
            setClient(null);
            setChannel(null);
            setUsername(null);
        }
    };

    return { client, username, channel, connectUser, isLoading, error, cleanup };
}
