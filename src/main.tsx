import { StrictMode } from 'react'
import { App } from '@/app/App'
import { createRoot } from 'react-dom/client'

import { bootstrap } from './app/bootstrap'

async function start() {
  await bootstrap()

  const container = document.getElementById('root')!
  const root = createRoot(container)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
