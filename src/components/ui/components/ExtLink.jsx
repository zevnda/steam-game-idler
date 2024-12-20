import React from 'react';

export default function ExtLink({ children, href, className }) {
    const handleClick = async (e) => {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.__TAURI__) {
            try {
                await window.__TAURI__.shell.open(href);
            } catch (error) {
                console.error('Failed to open link:', error);
            }
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
