import type { RouteObject } from 'react-router'
import { SettingsPage } from '@/pages/settings'

export const settingsRoute: RouteObject = {
  children: [
    {
      path: '/',
      index: true,
      element: <SettingsPage />,
    },
  ],
}
