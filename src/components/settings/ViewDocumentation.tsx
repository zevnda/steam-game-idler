import type { ReactElement } from 'react'

import { useTranslation } from 'react-i18next'
import { TbBook } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import ExtLink from '@/components/ui/ExtLink'

export default function ViewDocumentation(): ReactElement {
  const { t } = useTranslation()
  const { currentSettingsTab } = useNavigationContext()

  return (
    <ExtLink href={`https://steamgameidler.com/docs/settings/${currentSettingsTab}`}>
      <p className='text-xs text-center text-link hover:text-linkhover'>{t('settings.documentation')}</p>
    </ExtLink>
  )
}
