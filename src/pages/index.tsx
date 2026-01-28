import { emit } from '@tauri-apps/api/event'

import { useEffect } from 'react'

export default function Index() {
  // Emits the 'ready' event to Tauri backend when the component is mounted
  useEffect(() => {
    emit('ready')
  }, [])

  return (
    <div className='bg-black h-screen w-screen'>
      <p>Entry point</p>
    </div>
  )
}
