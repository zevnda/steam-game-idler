import { Suspense } from 'react'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router'

import { notFoundRoute } from '@/app/router/model/routes/not-found'
import { requireAuthRoute } from '@/app/router/model/routes/require-auth'
import { unauthenticatedRoute } from '@/app/router/model/routes/unauthenticated'
import { FullScreenLoader } from '@/shared/ui'

export const router = createBrowserRouter([
  {
    element: (
      <>
        <ScrollRestoration />
        <Suspense fallback={<FullScreenLoader />}>
          <Outlet />
        </Suspense>
      </>
    ),
    children: [unauthenticatedRoute, requireAuthRoute, notFoundRoute],
  },
])
