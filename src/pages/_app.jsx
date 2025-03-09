import { ThemeProvider } from '@/src/components/ui/theme/theme-provider';
import { HeroUIProvider } from '@heroui/react';
import '@/src/styles/globals.css';

export default function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider
            attribute='class'
            themes={['light', 'dark']}
            enableSystem={true}
            defaultTheme='dark'
            disableTransitionOnChange
        >
            <HeroUIProvider>
                <Component {...pageProps} />
            </HeroUIProvider>
        </ThemeProvider>
    );
}