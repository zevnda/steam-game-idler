import { Suspense } from 'react'
import { FullScreenLoader } from '@/shared/ui'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router'

import { notFoundRoute } from './routes/not-found'
import { requireAuthRoute } from './routes/require-auth'
import { unauthenticatedRoute } from './routes/unauthenticated'

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
