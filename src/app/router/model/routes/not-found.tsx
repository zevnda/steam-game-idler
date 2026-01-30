import { NotFoundPage } from '@/pages/common/not-found'
import { type RouteObject } from 'react-router'

export const notFoundRoute: RouteObject = {
  path: '*',
  element: <NotFoundPage />,
}
