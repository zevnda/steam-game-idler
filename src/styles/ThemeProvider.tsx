import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes'
import type { ReactElement, ReactNode } from 'react'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeProviderProps = {
  children: ReactNode
} & Omit<NextThemesProviderProps, 'children'>

export function ThemeProvider({ children, ...props }: ThemeProviderProps): ReactElement {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
