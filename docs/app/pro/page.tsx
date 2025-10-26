'use client'

import type { ReactElement } from 'react'

import { load } from '@tauri-apps/plugin-store'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FaGithub, FaSpinner } from 'react-icons/fa'

declare global {
  interface Window {
    __TAURI__?: unknown
  }
}

export default function Pro(): ReactElement {
  const searchParams = useSearchParams()
  const [isPro, setIsPro] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__TAURI__) {
      window.location.href = '/'
    } else {
      setShouldMount(true)
    }
  }, [])

  useEffect(() => {
    const verifyProStatus = async () => {
      const username = searchParams.get('username')
      const isActiveSponsor = searchParams.get('isActiveSponsor')
      const error = searchParams.get('error')

      setLoading(true)

      console.log(username, isActiveSponsor)

      if (error) {
        setErrorMessage(error)
        setLoading(false)
        return
      }

      if (username && isActiveSponsor) {
        try {
          setIsPro(true)
          setGithubUsername(username)

          await window.__TAURI__?.core?.invoke('store_and_save', {
            username,
            isPro: isActiveSponsor === 'true',
          })
          console.log('store saved')
        } catch (error) {
          console.error('Error verifying Pro status:', error)
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    verifyProStatus()
  }, [])

  if (errorMessage) {
    return (
      <div
        className='min-h-screen w-screen flex flex-col items-center justify-center p-4'
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #232323 100%)',
        }}
      >
        <div className='flex flex-col items-center justify-center bg-black/70 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-full max-w-md border border-neutral-800'>
          <div className='flex items-center gap-2 mb-4'>
            <h1 className='text-2xl font-extrabold text-red-400 tracking-wide drop-shadow-lg'>Pro Status Error</h1>
          </div>
          <div className='text-left space-y-4'>
            <p className='text-md text-white font-medium text-center'>There was an error verifying your Pro status:</p>
            <p className='text-sm text-white font-medium text-center'>Error: {errorMessage}</p>
            <p className='text-xs text-orange-700 font-medium text-center'>
              Please try again or contact support if the issue persists.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isPro) {
    return (
      <div
        className='min-h-screen w-screen flex flex-col items-center justify-center p-4'
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #232323 100%)',
        }}
      >
        <div className='flex flex-col items-center justify-center bg-black/70 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-full max-w-md border border-neutral-800'>
          <div className='flex items-center gap-2 mb-4'>
            <h1 className='text-2xl font-extrabold text-green-400 tracking-wide drop-shadow-lg'>
              Welcome, {githubUsername}!
            </h1>
          </div>
          <div className='text-left space-y-4'>
            <p className='text-md text-white font-medium text-center'>
              <span className='font-bold text-green-300'>Thank you</span> for being a{' '}
              <span className='font-semibold text-green-300'>Pro supporter</span>!
            </p>
            <p className='text-md text-white font-medium text-center'>
              Enjoy your <span className='font-bold text-green-300'>ad-free</span> experience.
            </p>
            <p className='text-xs text-orange-700 font-medium text-center'>
              You can now close this window and return to Steam Game Idler.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (shouldMount) {
    return (
      <div
        className='min-h-screen w-screen flex flex-col items-center justify-center p-4'
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #232323 100%)',
        }}
      >
        <div
          className='flex flex-col items-center justify-center bg-black/70 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-full max-w-md border border-neutral-800'
          style={{
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35), 0 1.5px 8px 0 rgba(0,0,0,0.25)',
          }}
        >
          <div className='mb-3 text-2xl flex flex-col items-center'>
            <span className='uppercase font-bold text-white tracking-wide mb-1'>
              Steam Game Idler
              <span
                className='p-1 ml-2 rounded-xl font-black'
                style={{
                  background:
                    'linear-gradient(300deg, #1fbaf8 0%, #2a9bf9 10.94%, #3874fb 23.43%, #8a1299ff 69.51%, #6c0b79ff 93.6%, #4a0840ff 109.47%),linear-gradient(86deg, #320057 4.13%, #530de7 35.93%, #3874fb 64.42%, #0bf2f6 104.88%)',
                }}
              >
                PRO
              </span>
            </span>
          </div>

          <div className='mb-6'>
            <span
              className='text-4xl font-bold bg-clip-text text-transparent'
              style={{
                background:
                  'linear-gradient(300deg, #1fbaf8 0%, #2a9bf9 10.94%, #3874fb 23.43%, #8a1299ff 69.51%, #6c0b79ff 93.6%, #4a0840ff 109.47%),linear-gradient(86deg, #320057 4.13%, #530de7 35.93%, #3874fb 64.42%, #0bf2f6 104.88%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              $1
            </span>
            <span className='text-sm text-white/70 font-medium ml-2'>/month</span>
          </div>

          <div className='border border-white/10 p-4 rounded-2xl mb-6'>
            <p className='mb-4 font-bold text-center'>Follow the steps below</p>
            <ol className='list-decimal marker:text-indigo-500 marker:font-black space-y-3 pl-5'>
              <li>
                Visit the GitHub Sponsor page in your browser{' '}
                <span className='text-indigo-500 font-bold'>https://github.com/sponsors/zevnda</span>
              </li>
              <li>
                Select the <span className='text-indigo-500 hover:underline font-bold'>Steam Game Idler Pro</span> tier
                and complete the payment
              </li>
              <li>
                Once payment is confirmed, verify your sponsorship via the{' '}
                <span className='text-indigo-500 font-bold'>Verify via GitHub</span> button below
              </li>
            </ol>
          </div>

          <button
            onClick={() => {
              setLoading(true)
              const clientId = 'Ov23li6v2lfsoHWx3KDr'
              const redirectUri = encodeURIComponent('http://localhost:3002/api/github-oauth-callback')
              window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user`
            }}
            className={`w-full flex justify-center items-center gap-2 mt-2 text-black font-bold px-6 py-3 rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{
              boxShadow: '0 2px 8px 0 rgba(255, 215, 0, 0.18)',
              background:
                'linear-gradient(300deg, #1fbaf8 0%, #2a9bf9 10.94%, #3874fb 23.43%, #8a1299ff 69.51%, #6c0b79ff 93.6%, #4a0840ff 109.47%),linear-gradient(86deg, #320057 4.13%, #530de7 35.93%, #3874fb 64.42%, #0bf2f6 104.88%)',
            }}
            disabled={loading}
          >
            {loading ? (
              <span className='flex gap-2'>
                <FaSpinner size={22} className='animate-spin' />
                Verifying..
              </span>
            ) : (
              <span className='flex items-center gap-2 text-white'>
                <FaGithub size={20} /> Verify via GitHub
              </span>
            )}
          </button>

          <span className='text-xs text-white/30 mt-6 mb-4'>No lock in contract. Cancel any time.</span>
        </div>
      </div>
    )
  }

  return null
}
