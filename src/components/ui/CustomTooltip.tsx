import { Tooltip } from '@heroui/react';
import type { ReactElement, ReactNode } from 'react';

interface CustomTooltipProps {
    children: ReactNode,
    content: ReactNode,
    placement?: 'top' | 'bottom' | 'left' | 'right' | undefined,
    className?: string
}

export default function CustomTooltip({
    children,
    content,
    placement = 'bottom',
    className
}: CustomTooltipProps): ReactElement {
    return (
        <Tooltip
            showArrow
            content={content}
            placement={placement}
            className={`font-semibold bg-titlehover ${className}`}
            closeDelay={100}
            classNames={{
                base: 'pointer-events-none before:!bg-titlehover',
                content: 'shadow-none'
            }}
        >
            {children}
        </Tooltip>
    );
}