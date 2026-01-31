import { Navigate, Outlet } from 'react-router'
import { FullScreenLoader } from '../loaders/FullScreenLoader'

export const UnauthenticatedLayout = () => {
  // const { isAuthenticated, isLoading, error } = useAuth()
  // Example (change localstorage items for test)
  const isAuthenticated = localStorage.getItem('auth/isAuthenticated')
  const isLoading = localStorage.getItem('auth/isLoading')

  // if (error) {
  //   throw error
  // }

  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  if (isLoading) {
    return <FullScreenLoader />
  }

  return (
    <div>
      <div className='bg-base pt-9'>
        <Outlet />
      </div>
    </div>
  )
}
