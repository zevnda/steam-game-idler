import { createElement } from 'react'
import { addToast } from '@heroui/react'
import i18next from 'i18next'

export const toast = {
  success(description: string) {
    addToast({ description, color: 'success' })
  },
  primary(description: string) {
    addToast({ description, color: 'primary' })
  },
  warning(description: string) {
    addToast({ description, color: 'warning' })
  },
  danger(description: string) {
    addToast({ description, color: 'danger' })
  },
  steamNotRunning() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.steam'),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Steam%20is%20not%20running',
      ),
      color: 'danger',
    })
  },
  accountMismatch(color: 'danger' | 'warning' = 'danger') {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.mismatch'),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Account%20mismatch%20between%20Steam%20and%20SGI',
      ),
      color,
    })
  },
  missingCredentials() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.missingCredentials'),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Missing%20card%20farming%20credentials',
      ),
      color: 'danger',
    })
  },
  outdatedCredentials() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.outdatedCredentials'),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Card%20farming%20credentials%20need%20to%20be%20updated',
      ),
      color: 'danger',
    })
  },
  incorrectCredentials() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.incorrectCredentials'),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Incorrect%20card%20farming%20credentials',
      ),
      color: 'danger',
    })
  },
  enableAllGames() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.enableAllGames'),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Add%20some%20games%20to%20your%20card%20farming%20list',
      ),
      color: 'danger',
    })
  },
  noGames() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.noGames'),
        'https://steamgameidler.com/docs/faq#:~:text=There%20are%20no%20games%20in%20your%20list',
      ),
      color: 'danger',
    })
  },
  priceFetchCooldown(cooldown: number) {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.tradingCards.cooldown', { cooldown }),
        'https://steamgameidler.com/docs/faq#error-messages:~:text=Please%20wait%20X%20seconds',
      ),
      color: 'warning',
    })
  },
  priceFetchRateLimit() {
    addToast({
      title: buildErrorTitle(
        i18next.t('toast.tradingCards.rateLimit'),
        'https://steamgameidler.com/docs/faq#:~:text=Rate%20limited%20when%20fetching%20card%20prices',
      ),
      color: 'danger',
    })
  },
}

function buildErrorTitle(message: string, href: string) {
  return createElement(
    'div',
    { className: 'grow' },
    createElement(
      'a',
      {
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'flex items-center gap-1 text-sm font-medium hover:underline',
        onClick: (e: MouseEvent) => e.stopPropagation(),
      },
      message,
    ),
  )
}
