import { useEffect } from 'react';
import { ThemeProvider } from '@/src/components/ui/components/theme/theme-provider';
import { NextUIProvider } from '@nextui-org/react';
import { setupAppWindow } from '@/src/utils/myAppHandler';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
    useEffect(() => {
        setupAppWindow();
    }, []);

    return (
        <ThemeProvider
            attribute='class'
            themes={['light', 'dark']}
            enableSystem={true}
            defaultTheme='system'
            disableTransitionOnChange
        >
            <NextUIProvider>
                <Component {...pageProps} />
            </NextUIProvider>
        </ThemeProvider>
    );
}