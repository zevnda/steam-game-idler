import { cn } from '@heroui/react';
import type { ReactElement } from 'react';

export default function Beta(): ReactElement {
    return (
        <span className={cn(
            'text-[9px] px-1 select-none max-w-[29px] h-[15px]',
            'border border-dynamic rounded-full text-dynamic align-top ml-1'
        )}>
            beta
        </span>
    );
}