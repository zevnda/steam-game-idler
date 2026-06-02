import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeProviderProps = React.PropsWithChildren<Omit<NextThemesProviderProps, 'children'>>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
