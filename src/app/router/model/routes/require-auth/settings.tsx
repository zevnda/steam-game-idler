import type { RouteObject } from 'react-router'

import { SettingsPage } from '@/pages/settings'
import { MainLayout } from '@/shared/ui'

export const settingsRoute: RouteObject = {
  element: <MainLayout />,
  children: [
    {
      path: '/',
      index: true,
      element: <SettingsPage />,
    },
  ],
}
