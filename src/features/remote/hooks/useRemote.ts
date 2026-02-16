import { useCallback, useEffect, useRef, useState } from 'react'
import Pusher from 'pusher-js'

interface Command {
  action: string
  game: string
}

// Desktop App Strategy:
// 1. Generate code on app start (PRO users only)
// 2. DON'T connect to Pusher immediately
// 3. Only connect when user clicks "Enable Remote Control" button
// 4. Stay connected until user clicks "Disable Remote Control" or app closes
// 5. Code remains valid for entire session while connected
// 6. Dropdown can be opened/closed freely - connection stays active in background

// Remote App Strategy:
// 1. Connect when user enters code
// 2. Start 5 minute inactivity timer
// 3. Reset timer to 5 minutes whenever user clicks any button
// 4. If timer reaches 0, disconnect
// 5. Show warning at 30 seconds remaining
// 6. User can reconnect anytime with same code (desktop still listening)

export function useRemote() {
  const [code, setCode] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [pusher, setPusher] = useState<Pusher | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Only generate code and setup Pusher when opening
  const openDropdown = useCallback(() => {
    if (!showDropdown) {
      const deviceCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      setCode(deviceCode)
      console.debug('Device code:', deviceCode)

      const p = new Pusher('00776dc2529e72eb0b27', {
        cluster: 'us2',
        authEndpoint: 'http://localhost:3001/api/pusher/auth',
      })
      setPusher(p)

      const channel = p.subscribe(`private-device-${deviceCode}`)

      channel.bind('pusher:subscription_succeeded', () => {})

      channel.bind('client-command', (data: Command) => {
        console.debug('Received command:', data)
      })

      channel.bind('client-request-games', () => {
        console.debug('Desktop received request for games!')
        channel.trigger('client-games-list', {
          games: ['CS2', 'Dota 2', 'Team Fortress 2'],
        })
      })
    }
    setShowDropdown(true)
  }, [showDropdown])

  // Cleanup Pusher when closing
  const closeDropdown = useCallback(() => {
    setShowDropdown(false)
    if (pusher && code) {
      pusher.unsubscribe(`private-device-${code}`)
      pusher.disconnect()
      setPusher(null)
      setCode('')
    }
  }, [pusher, code])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown, closeDropdown])

  return { code, showDropdown, openDropdown, closeDropdown, dropdownRef }
}
