import { Fragment, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { LuMoonStar } from 'react-icons/lu';
import { LuSun } from 'react-icons/lu';

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
            return <LuMoonStar fontSize={18} />;
        } else {
            return <LuSun fontSize={18} />;
        }
    };

    return (
        <Fragment>
            <div className='flex justify-center items-center cursor-pointer w-[42px]' onClick={handleClick}>
                <div className='flex items-center p-2 hover:bg-titlehover rounded-full'>
                    {renderIcon()}
                </div>
            </div>
        </Fragment>
    );
}