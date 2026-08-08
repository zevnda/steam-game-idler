import { useTranslation } from 'react-i18next'
import { Description, Input, Label, TextField } from '@heroui/react'

export interface ManualCookiesFormValue {
  sls: string
  sma: string
}

export const EMPTY_MANUAL_COOKIES_FORM_VALUE: ManualCookiesFormValue = { sls: '', sma: '' }

interface ManualCookiesFormProps {
  value: ManualCookiesFormValue
  isDisabled: boolean
  onChange: (value: ManualCookiesFormValue) => void
}

// Casual/free-tier fallback (and gamer-tier's manual override) for a feature's Steam Community
// session. Promoted here from
// features/card-farming/components/ once inventory-manager needed the identical form (same
// `steam_community::SteamCookies` shape every cookie-authenticated feature resolves against).
// `sma` is optional
// (`steamMachineAuth{steamId}`, only set for accounts with a pending Steam Guard machine
// confirmation), `sls` is required. No `sessionid` field - it's just a CSRF double-submit token
// Steam never validates against anything server-side (see `session::resolve`'s Rust-side doc
// comment), so the app mints one itself instead of asking the user to dig it out of dev tools.
export const ManualCookiesForm = ({ value, isDisabled, onChange }: ManualCookiesFormProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-4'>
      <TextField
        isDisabled={isDisabled}
        value={value.sls}
        onChange={sls => onChange({ ...value, sls })}
      >
        <Label>{t('common.manualCookies.slsLabel')}</Label>
        <Input autoComplete='off' placeholder='steamLoginSecure' type='password' />
      </TextField>
      <TextField
        isDisabled={isDisabled}
        value={value.sma}
        onChange={sma => onChange({ ...value, sma })}
      >
        <Label>{t('common.manualCookies.smaLabel')}</Label>
        <Input autoComplete='off' placeholder='steamMachineAuth' type='password' />
        <Description>{t('common.manualCookies.smaDescription')}</Description>
      </TextField>
    </div>
  )
}
