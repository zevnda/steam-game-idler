import type { RouteObject } from 'react-router'

import { SignInPage } from '@/pages/auth/sign-in'
import { UnauthenticatedLayout } from '@/shared/ui'

export const unauthenticatedRoute: RouteObject = {
  element: <UnauthenticatedLayout />,
  children: [
    {
      path: '/signin',
      element: <SignInPage />,
    },
  ],
}
