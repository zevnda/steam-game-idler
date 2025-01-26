import { useEffect } from 'react';
import { ThemeProvider } from '@/src/components/ui/theme/theme-provider';
import { HeroUIProvider } from '@heroui/react';
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
            <HeroUIProvider>
                <Component {...pageProps} />
            </HeroUIProvider>
        </ThemeProvider>
    );
}