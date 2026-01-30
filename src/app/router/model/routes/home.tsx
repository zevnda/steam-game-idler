import type { RouteObject } from 'react-router'

import { HomePage } from '@/pages/home'
import { MainLayout } from '@/shared/ui'

export const homeRoute: RouteObject = {
  element: <MainLayout />,
  children: [
    {
      path: '/',
      index: true,
      element: <HomePage />,
    },
  ],
}
