import { openExternalLink } from '@/shared/utils'
import { useTranslation } from 'react-i18next'

interface ErrorToastProps {
  message: string
  href: string
}

export const ToastMessage = ({ message, href }: ErrorToastProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-1'>
      <p className='text-sm text-content'>{message}</p>
      <button
        type='button'
        className='text-xs text-dynamic hover:text-dynamic-hover text-left cursor-pointer w-fit my-2 duration-150'
        onClick={() => openExternalLink(href)}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            openExternalLink(href)
          }
        }}
      >
        {t('common.learn_more')}
      </button>
    </div>
  )
}
