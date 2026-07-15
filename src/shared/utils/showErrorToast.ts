import type { ReactNode } from 'react'
import { errorDocsHref } from './errorDocsHref'
import { openExternalLink } from './links'
import { toast } from '@heroui/react'

// Shared toast helper for a known AppError code - attaches a "Learn more" actionProps button
// (HeroUI's toast supports this natively) when errorDocsHref has a mapped anchor for this code,
// plain toast otherwise. `learnMoreLabel` is passed in pre-translated so this stays a plain
// function like links.ts rather than importing useTranslation itself.
export function showErrorToast(
  message: ReactNode,
  code: string,
  learnMoreLabel: string,
  variant: 'danger' | 'warning' = 'danger',
) {
  const href = errorDocsHref(code)
  const toastFn = variant === 'warning' ? toast.warning : toast.danger
  toastFn(
    message,
    href
      ? { actionProps: { children: learnMoreLabel, onPress: () => openExternalLink(href) } }
      : undefined,
  )
}
