import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/pages/common/not-found'

export const notFoundRoute: RouteObject = {
  path: '*',
  element: <NotFoundPage />,
}
