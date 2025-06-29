import type { ReactElement } from 'react'

import { useTranslation } from 'react-i18next'
import { TbBook } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'

export default function ViewDocumentation(): ReactElement {
  const { t } = useTranslation()
  const { currentSettingsTab } = useNavigationContext()

  return (
    <ExtLink href={`https://steamgameidler.com/docs/settings/${currentSettingsTab}`}>
      <CustomTooltip content={t('settings.documentation')}>
        <TbBook
          size={20}
          className='w-8 h-8 p-1.5 font-semibold rounded-lg bg-dynamic text-button-text hover:bg-dynamic/80 duration-200'
        />
      </CustomTooltip>
    </ExtLink>
  )
}
