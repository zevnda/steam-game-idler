import type { SteamAccount } from '../types'
import { useTranslation } from 'react-i18next'
import { TbRefresh } from 'react-icons/tb'
import { errorMessageKey } from '../utils/errorMessageKey'
import AccountOption from './AccountOption'
import { Alert, Button, EmptyState, RadioGroup, Spinner, Typography } from '@heroui/react'

interface AccountPickerProps {
  accounts: SteamAccount[]
  selectedSteamId: string | null
  isLoading: boolean
  isContinuing: boolean
  summaryErrorCode: string | null
  actionErrorCode: string | null
  onSelect: (steamId: string) => void
  onContinue: () => void
  onRefresh: () => void
}

const AccountPicker = ({
  accounts,
  selectedSteamId,
  isLoading,
  isContinuing,
  summaryErrorCode,
  actionErrorCode,
  onSelect,
  onContinue,
  onRefresh,
}: AccountPickerProps) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <EmptyState>
        <Typography align='center' type='body-sm'>
          {t('auth.localSignIn.noAccounts')}
        </Typography>
      </EmptyState>
    )
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      {summaryErrorCode ? (
        <Alert status='warning'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t(errorMessageKey(summaryErrorCode))}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <RadioGroup
        aria-label='Steam accounts'
        className='flex flex-row flex-wrap justify-center gap-3 mb-4'
        value={selectedSteamId}
        onChange={onSelect}
      >
        {accounts.map(account => (
          <AccountOption key={account.steamId} account={account} />
        ))}
      </RadioGroup>

      {actionErrorCode ? (
        <Alert status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('common.errorBoundary.title')}</Alert.Title>
            <Alert.Description>
              {t(errorMessageKey(actionErrorCode), { code: actionErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className='flex gap-2'>
        <Button isDisabled={!selectedSteamId} isPending={isContinuing} onPress={onContinue}>
          {t('common.actions.continue')}
        </Button>
        <Button
          isIconOnly
          aria-label={t('common.actions.refresh')}
          isDisabled={isContinuing}
          variant='secondary'
          onPress={onRefresh}
        >
          <TbRefresh fontSize={18} />
        </Button>
      </div>
    </div>
  )
}

export default AccountPicker
