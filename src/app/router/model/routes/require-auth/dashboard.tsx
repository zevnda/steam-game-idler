import type { RouteObject } from 'react-router'

import { DashboardPage } from '@/pages/dashboard'

export const dashboardRoute: RouteObject = {
  children: [
    {
      path: '/',
      index: true,
      element: <DashboardPage />,
    },
  ],
}
