import type { ReactElement } from 'react'

import { useTranslation } from 'react-i18next'

import WebviewWindow from '@/components/ui/WebviewWindow'

interface ErrorToastProps {
  message: string
  href: string
}

export default function ErrorToast({ message, href }: ErrorToastProps): ReactElement {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-1'>
      <p className='text-sm text-content'>{message}</p>
      <WebviewWindow href={href}>
        <p className='text-xs text-dynamic hover:text-dynamic-hover'>{t('common.learnMore')}</p>
      </WebviewWindow>
    </div>
  )
}
