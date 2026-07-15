import { useTranslation } from 'react-i18next'
import { Button } from '@heroui/react'

interface ErrorBoundaryFallbackProps {
  onRetry: () => void
}

// Deliberately not built on SplashScreen (video background + font load) - a fallback shown because
// something already broke shouldn't lean on more moving parts than a plain static screen needs.
export const ErrorBoundaryFallback = ({ onRetry }: ErrorBoundaryFallbackProps) => {
  const { t } = useTranslation()

  return (
    <div className='fixed inset-0 z-9998 flex h-screen w-screen flex-col items-center justify-center space-y-4 bg-black text-white'>
      <p className='text-2xl font-bold'>{t('common.errorBoundary.title')}</p>
      <p className='max-w-md text-center text-sm text-white/70'>
        {t('common.errorBoundary.description')}
      </p>
      <Button variant='secondary' onPress={onRetry}>
        {t('common.actions.tryAgain')}
      </Button>
    </div>
  )
}
