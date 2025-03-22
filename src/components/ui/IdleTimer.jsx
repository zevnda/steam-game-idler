import { useState, useEffect } from 'react';
import { TbPlayerPlayFilled } from 'react-icons/tb';

export default function IdleTimer({ startTime }) {
    const formatTime = (elapsed) => {
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Use RAF for smoother updates and better battery life
    const [, forceUpdate] = useState({});

    useEffect(() => {
        let frameId;

        const updateTimer = () => {
            forceUpdate({});
            frameId = requestAnimationFrame(updateTimer);
        };

        frameId = requestAnimationFrame(updateTimer);
        return () => cancelAnimationFrame(frameId);
    }, []);

    // Calculate time directly in render
    const elapsed = Date.now() - startTime;
    const displayTime = formatTime(elapsed);

    return (
        <div className='absolute top-1.5 left-1.5 flex items-center gap-1 bg-black bg-opacity-70 text-offwhite pl-1 pr-2 py-[1px] rounded-md text-xs'>
            <TbPlayerPlayFilled size={14} />
            {displayTime}
        </div>
    );
}