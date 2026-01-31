import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { bootstrap } from '@/app/bootstrap'

const start = async () => {
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
