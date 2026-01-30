import { StrictMode } from 'react'
import { App } from '@/app/App'
import { initI18n } from '@/shared/config'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')!
const root = createRoot(container)

initI18n()

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
