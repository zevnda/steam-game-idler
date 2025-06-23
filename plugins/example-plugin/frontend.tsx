import { invoke } from '@tauri-apps/api/core'

import React, { useState } from 'react'

export const ExamplePluginPage: React.FC = () => {
  const [steamId, setSteamId] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    if (!steamId.trim()) {
      setError('Please enter a Steam ID64')
      return
    }

    setLoading(true)
    setError('')
    setUserData(null)

    try {
      const result = (await invoke('execute_plugin_command', {
        pluginId: 'example-plugin',
        command: 'get_steam_user',
        args: { steamId: steamId.trim() },
      })) as any

      if (result.status === 'success') {
        setUserData(result.user)
      } else {
        setError(result.message || 'Failed to lookup user')
      }
    } catch (err) {
      setError(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  return (
    <div className='p-6 max-w-2xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2 text-content'>Steam User Lookup</h1>
        <p className='text-dynamic'>Enter a Steam ID64 to lookup user profile information.</p>
      </div>

      <div className='bg-titlebar border border-border rounded-lg p-4 mb-6'>
        <label className='block text-sm font-medium mb-2 text-content'>Steam ID64</label>
        <div className='flex gap-3'>
          <input
            type='text'
            value={steamId}
            onChange={e => setSteamId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='e.g., 76561198000000000'
            className='flex-1 px-3 py-2 bg-input border border-border rounded text-content placeholder-dynamic'
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className='px-4 py-2 bg-primary text-primarycontent rounded hover:bg-primaryhover disabled:opacity-50 transition-colors'
          >
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>

      {error && (
        <div className='bg-danger border border-danger rounded-lg p-4 mb-6'>
          <p className='text-dangercontent'>{error}</p>
        </div>
      )}

      {userData && (
        <div className='bg-titlebar border border-border rounded-lg p-4'>
          <h2 className='text-xl font-semibold mb-4 text-content'>User Profile</h2>
          <div className='flex items-center gap-4 mb-4'>
            <img src={userData.avatar} alt='Avatar' className='w-16 h-16 rounded' />
            <div>
              <h3 className='text-lg font-medium text-content'>{userData.personaname}</h3>
              <p className='text-sm text-dynamic'>Steam ID: {userData.steamid}</p>
            </div>
          </div>
          <div className='space-y-2'>
            <p className='text-sm text-content'>
              <strong>Profile URL:</strong>{' '}
              <a
                href={userData.profileurl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {userData.profileurl}
              </a>
            </p>
            <p className='text-sm text-content'>
              <strong>Status:</strong>{' '}
              <span className={userData.personastate === 1 ? 'text-success' : 'text-dynamic'}>
                {userData.personastate === 1 ? 'Online' : 'Offline'}
              </span>
            </p>
            <p className='text-sm text-content'>
              <strong>Visibility:</strong> {userData.communityvisibilitystate === 3 ? 'Public' : 'Private'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
