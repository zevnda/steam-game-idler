import { cloneElement } from 'react';

export function Screenshot({ children }) {
    return cloneElement(children, {
        className: 'mt-6 rounded-lg drop-shadow-md border border-[#242424]',
    });
}
