import { Fragment, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { TbMoon, TbSun } from 'react-icons/tb';

export default function ThemeSwitch() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const handleClick = () => {
        if (theme === 'dark') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    };

    useEffect(() => {
        const localTheme = localStorage.getItem('theme');
        if (!localTheme) {
            localStorage.setItem('theme', 'light');
            setTheme('light');
        }
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const renderIcon = () => {
        if (theme === 'dark') {
            return <TbMoon fontSize={20} />;
        } else {
            return <TbSun fontSize={20} />;
        }
    };

    return (
        <Fragment>
            <div className='flex justify-center items-center'>
                <div className='flex items-center p-2 hover:bg-titlehover rounded-full duration-200 active:scale-90 cursor-pointer' onClick={handleClick}>
                    {renderIcon()}
                </div>
            </div>
        </Fragment>
    );
}