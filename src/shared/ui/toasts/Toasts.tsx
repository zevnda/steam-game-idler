import i18next from 'i18next'
import { addToast } from '@heroui/react'
import { ToastMessage } from './ToastMessage'

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

export const showAccountMismatchToast = (color: 'danger' | 'warning') => {
  addToast({
    description: (
      <ToastMessage
        message={i18next.t('toasts.account_mismatch')}
        href='https://steamgameidler.com/docs/faq#error-messages:~:text=Account%20mismatch%20between%20Steam%20and%20SGI'
      />
    ),
    color,
  })
}
