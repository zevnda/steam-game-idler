import { Suspense } from 'react'
import { FullScreenLoader } from '@/shared/ui'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router'

import { homeRoute } from './routes/home'
import { notFoundRoute } from './routes/not-found'

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
    children: [homeRoute, notFoundRoute],
  },
])
