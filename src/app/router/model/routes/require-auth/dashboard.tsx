import type { RouteObject } from 'react-router'

import { DashboardPage } from '@/pages/dashboard'
import { MainLayout } from '@/shared/ui'

export const dashboardRoute: RouteObject = {
  element: <MainLayout />,
  children: [
    {
      path: '/',
      index: true,
      element: <DashboardPage />,
    },
  ],
}
