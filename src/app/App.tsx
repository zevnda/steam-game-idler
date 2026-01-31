import { emit } from '@tauri-apps/api/event'

import { useEffect } from 'react'
import { RouterProvider } from 'react-router/dom'

import './styles/globals.css'

import { HeadData } from '@/app/meta'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { TitleBar } from '@/shared/ui'

export const App = () => {
  // Emits the 'ready' event to Tauri backend when the component is mounted
  useEffect(() => {
    emit('ready')
  }, [])

  return (
    <Providers>
      <HeadData />
      <TitleBar />
      <RouterProvider router={router} />
    </Providers>
  )
}
