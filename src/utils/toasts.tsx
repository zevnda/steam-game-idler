/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { TOptions } from 'i18next'

import { addToast } from '@heroui/react'
import i18next from 'i18next'

import ErrorToast from '@/components/ui/ErrorToast'

export const t = (key: string, options?: TOptions): string => i18next.t(key, options)

export function showSuccessToast(description: string): void {
  addToast({ description, color: 'success' })
}

export function showPrimaryToast(description: string): void {
  addToast({ description, color: 'primary' })
}

export function showWarningToast(description: string): void {
  addToast({ description, color: 'warning' })
}

export function showDangerToast(description: string): void {
  addToast({ description, color: 'danger' })
}

export function showSteamNotRunningToast(): void {
  addToast({
    title: (
      <div className='flex-grow'>
        <ErrorToast
          message={t('toast.steam')}
          href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
        />
      </div>
    ),
    color: 'danger',
  })
}

export function showAccountMismatchToast(color: 'danger' | 'warning'): void {
  addToast({
    title: (
      <ErrorToast
        message={t('toast.mismatch')}
        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Account%20mismatch%20between%20Steam%20and%20SGI'
      />
    ),
    color,
  })
}

export function showMissingCredentialsToast(): void {
  addToast({
    title: (
      <ErrorToast
        message={t('toast.missingCredentials')}
        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Missing%20card%20farming%20credentials%20in%20%E2%80%9Csettings%20%3E%20card%20farming%22'
      />
    ),
    color: 'danger',
  })
}

export function showOutdatedCredentialsToast(): void {
  addToast({
    title: (
      <ErrorToast
        message={t('toast.outdatedCredentials')}
        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Card%20farming%20credentials%20need%20to%20be%20updated%20in%20%E2%80%9Csettings%20%3E%20card%20farming%22'
      />
    ),
    color: 'danger',
  })
}

export function showEnableAllGamesToast(): void {
  addToast({
    title: (
      <ErrorToast
        message={t('toast.enableAllGames')}
        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Add%20some%20games%20to%20your%20card%20farming%20list%20or%20enable%20%E2%80%9Call%20games%E2%80%9D%20in%20%E2%80%9Csettings%20%3E%20card%20farming%22'
      />
    ),
    color: 'danger',
  })
}

export function showIncorrectCredentialsToast(): void {
  addToast({
    title: (
      <ErrorToast
        message={t('toast.incorrectCredentials')}
        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Incorrect%20card%20farming%20credentials'
      />
    ),
    color: 'danger',
  })
}

export function showNoGamesToast(): void {
  addToast({
    title: (
      <ErrorToast
        message={t('toast.noGames')}
        href='https://steamgameidler.vercel.app/faq#error-messages:~:text=There%20are%20no%20games%20in%20your%20achievement%20unlocker%20list'
      />
    ),
    color: 'danger',
  })
}
