import { emit } from '@tauri-apps/api/event'

import { useEffect } from 'react'
import { RouterProvider } from 'react-router/dom'

import { HeadData } from './meta'
import { Providers } from './providers'
import { router } from './router'

import './styles/globals.css'

export const App = () => {
  // Emits the 'ready' event to Tauri backend when the component is mounted
  useEffect(() => {
    emit('ready')
  }, [])

  return (
    <Providers>
      <HeadData />
      <RouterProvider router={router} />
    </Providers>
  )
}
