import { useTranslation } from 'react-i18next'
import { TbExternalLink } from 'react-icons/tb'
import { errorDocsHref } from '@/shared/utils/errorDocsHref'
import { openExternalLink } from '@/shared/utils/links'

// The inline counterpart to showErrorToast's "Learn more" button, for an error shown as page
// content (an Alert, a status card) rather than a toast. Renders nothing for a code with no docs
// entry in errorDocsHref, so a call site can pass any code without checking first. Same text-link
// style as the other inline "Learn more" links (e.g. CardFarmingSettingsTab).
export const ErrorDocsLink = ({ code }: { code: string }) => {
  const { t } = useTranslation()
  const href = errorDocsHref(code)
  if (!href) return null
  return (
    <button
      type='button'
      className='flex cursor-pointer items-center gap-1 text-sm text-accent duration-150 hover:text-accent/80'
      onClick={() => openExternalLink(href)}
    >
      {t('common.learnMore')}
      <TbExternalLink fontSize={12} />
    </button>
  )
}
