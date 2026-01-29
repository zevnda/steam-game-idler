import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes'
import type { PropsWithChildren } from 'react'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeProviderProps = PropsWithChildren & Omit<NextThemesProviderProps, 'children'>

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
