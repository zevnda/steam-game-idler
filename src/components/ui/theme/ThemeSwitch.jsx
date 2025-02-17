import { Fragment, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Select, SelectItem } from '@heroui/react';
import { TbBrush } from 'react-icons/tb';

const themes = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'nordic', label: 'Nordic' },
    { key: 'coffee', label: 'Coffee' },
    { key: 'forest', label: 'Forest' },
    { key: 'high-contrast', label: 'High Contrast' },
];

export default function ThemeSwitch() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const localTheme = localStorage.getItem('theme');
        if (!localTheme) {
            localStorage.setItem('theme', 'dark');
            setTheme('dark');
        }
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Fragment>
            <Select
                size='sm'
                aria-label='theme'
                disallowEmptySelection
                radius='none'
                startContent={<TbBrush />}
                items={themes}
                className='w-[203px]'
                classNames={{
                    listbox: ['p-0'],
                    value: ['text-sm !text-content'],
                    trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                    popoverContent: ['bg-titlebar border border-border rounded-lg justify-start text-content'],
                }}
                defaultSelectedKeys={[theme]}
                onSelectionChange={(e) => setTheme(e.currentKey)}
            >
                {(theme) => <SelectItem>{theme.label}</SelectItem>}
            </Select>
        </Fragment>
    );
}