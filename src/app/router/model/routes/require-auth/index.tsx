import type { RouteObject } from 'react-router'

import { dashboardRoute } from '@/app/router/model/routes/require-auth/dashboard'
import { settingsRoute } from '@/app/router/model/routes/require-auth/settings'
import { RequireAuth } from '@/app/router/ui/RequireAuth'
import { MainLayout } from '@/shared/ui'

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
