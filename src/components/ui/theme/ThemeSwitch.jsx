import { Select, SelectItem } from '@heroui/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { TbBrush } from 'react-icons/tb';

export default function ThemeSwitch() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const themes = [
        { key: 'light', label: 'Light' },
        { key: 'dark', label: 'Dark' },
        { key: 'nordic', label: 'Nordic (Light)' },
        { key: 'pastel', label: 'Pastel (Light)' },
        { key: 'sunshine', label: 'Sunshine (Light)' },
        { key: 'seafoam', label: 'Seafoam (Light)' },
        { key: 'blossom', label: 'Blossom (Light)' },
        { key: 'meadow', label: 'Meadow (Light)' },
        { key: 'sandstone', label: 'Sandstone (Light)' },
        { key: 'icicle', label: 'Icicle (Light)' },
        { key: 'midnight', label: 'Midnight (Dark)' },
        { key: 'amethyst', label: 'Amethyst (Dark)' },
        { key: 'emerald', label: 'Emerald (Dark)' },
        { key: 'cherry', label: 'Cherry (Dark)' },
        { key: 'cosmic', label: 'Cosmic (Dark)' },
        { key: 'mint', label: 'Mint (Dark)' },
        { key: 'arctic', label: 'Arctic (Dark)' },
        { key: 'nightshade', label: 'Nightshade (Dark)' }
    ];

    useEffect(() => {
        const localTheme = localStorage.getItem('theme');
        if (!localTheme) {
            localStorage.setItem('theme', 'dark');
            setTheme('dark');
        } else {
            setTheme(localTheme);
        }
        setMounted(true);
    }, [setTheme]);

    if (!mounted) return null;

    return (
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
                popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
            }}
            defaultSelectedKeys={[resolvedTheme]}
            onSelectionChange={(e) => {
                const selectedTheme = e.currentKey;
                localStorage.setItem('theme', selectedTheme);
                setTheme(selectedTheme);
            }}
        >
            {(theme) => <SelectItem classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>{theme.label}</SelectItem>}
        </Select>
    );
}