import { open } from '@tauri-apps/plugin-shell';

export default function ExtLink({ children, href, className }) {
    const handleClick = async (e) => {
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
            onClick={(e) => {
                handleClick(e);
            }}
        >
            {children}
        </a>
    );
}
