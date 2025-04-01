import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes';
import type { JSX, ReactNode } from 'react';

type ThemeProviderProps = {
    children: ReactNode;
} & Omit<NextThemesProviderProps, 'children'>;

export function ThemeProvider({
    children,
    ...props
}: ThemeProviderProps): JSX.Element {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}