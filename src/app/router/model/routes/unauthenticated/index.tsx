import { SignInPage } from '@/pages/auth/sign-in'
import { UnauthenticatedLayout } from '@/shared/ui'
import { type RouteObject } from 'react-router'

export const unauthenticatedRoute: RouteObject = {
  element: <UnauthenticatedLayout />,
  children: [
    {
      path: '/signin',
      element: <SignInPage />,
    },
  ],
}
