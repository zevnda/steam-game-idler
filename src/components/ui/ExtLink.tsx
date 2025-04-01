import { open } from '@tauri-apps/plugin-shell';
import type { MouseEvent, ReactElement, ReactNode } from 'react';

interface ExtLinkProps {
    children: ReactNode;
    href: string;
    className?: string;
}

export default function ExtLink({
    children,
    href,
    className = ''
}: ExtLinkProps): ReactElement {
    const handleClick = async (e: MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        try {
            await open(href);
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    };

    return (
        <a
            className={`w-fit h-fit cursor-pointer ${className}`}
            href={href}
            onClick={handleClick}
        >
            {children}
        </a>
    );
}
