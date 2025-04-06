import type { ReactElement } from 'react'

import { useTranslation } from 'react-i18next'

import ExtLink from '@/components/ui/ExtLink'

interface ErrorToastProps {
  message: string
  href: string
}

export default function ErrorToast({ message, href }: ErrorToastProps): ReactElement {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-1'>
      <p className='text-sm text-content'>{message}</p>
      <ExtLink href={href}>
        <p className='text-xs text-link hover:text-linkhover'>{t('common.learnMore')}</p>
      </ExtLink>
    </div>
  )
}
