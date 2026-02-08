import { useTranslation } from 'react-i18next'
import { ExtLink } from '@/shared/ui'

interface ErrorToastProps {
  message: string
  href: string
}

export const ErrorToast = ({ message, href }: ErrorToastProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-1'>
      <p className='text-sm text-content'>{message}</p>
      <ExtLink href={href}>
        <p className='text-xs text-dynamic hover:text-dynamic-hover'>{t('common.learnMore')}</p>
      </ExtLink>
    </div>
  )
}
