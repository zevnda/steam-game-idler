import type { RouteObject } from 'react-router'
import { MainLayout } from '@/shared/ui'
import { RequireAuth } from '../../../ui/RequireAuth'
import { dashboardRoute } from './dashboard'
import { settingsRoute } from './settings'

export const requireAuthRoute: RouteObject = {
  element: <RequireAuth />,
  children: [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        {
          children: [dashboardRoute, settingsRoute],
        },
      ],
    },
  ],
}
