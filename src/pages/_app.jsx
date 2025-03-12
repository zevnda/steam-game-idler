import { ThemeProvider } from '@/components/ui/theme/theme-provider';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import '@/styles/globals.css';
import { TbX } from 'react-icons/tb';

export default function MyApp({ Component, pageProps }) {
    return (
        <ThemeProvider
            attribute='class'
            themes={[
                'light',
                'dark',
                'nordic',
                'pastel',
                'sunshine',
                'seafoam',
                'blossom',
                'meadow',
                'sandstone',
                'icicle',
                'midnight',
                'amethyst',
                'emerald',
                'cherry',
                'cosmic',
                'mint',
                'arctic',
                'nightshade'
            ]}
            enableSystem={true}
            defaultTheme='dark'
            disableTransitionOnChange
        >
            <HeroUIProvider>
                <ToastProvider
                    toastProps={{
                        radius: 'sm',
                        variant: 'flat',
                        timeout: 3000,
                        shouldShowTimeoutProgress: true,
                        closeIcon: (<TbX size={24} className='text-content' />),
                        classNames: {
                            base: ['bg-titlebar border-border cursor-default'],
                            description: ['text-content'],
                            closeButton: ['opacity-100 absolute right-1 top-1 hover:bg-titlehover']
                        }
                    }}
                />
                <Component {...pageProps} />
            </HeroUIProvider>
        </ThemeProvider>
    );
}