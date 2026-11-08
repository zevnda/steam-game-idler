import type { SteamAccount } from '../types'
import { useTranslation } from 'react-i18next'
import { TbRefresh } from 'react-icons/tb'
import { errorMessageKey } from '../utils/errorMessageKey'
import AccountOption, { AccountOptionSkeleton } from './AccountOption'
import { Alert, Button, cn, EmptyState, RadioGroup, Skeleton, Typography } from '@heroui/react'

// Bounded and scrollable on its own, so Continue and Refresh stay in view however many accounts are
// signed into this Steam client. The negative right margin puts the scrollbar in the padding of the
// host (AuthLayout's panel, or the AddAccountModal dialog) beside the rows rather than against them,
// and the always-reserved gutter plus `pr-2` adds back exactly that margin, so the rows line up with
// the buttons below whether or not there's a scrollbar. Local sign-in is Windows-only, so WebView2's
// `scrollbar-gutter` support is all this needs.
const LIST_SCROLLER = '-ml-0.5 -mr-6 overflow-y-auto pr-2 [scrollbar-gutter:stable]'
// The calc() subtracts the window height used by everything else around the list, so it stays the
// only scrollbar when the window is short. The modal has less around it and more rows to fill it with.
const SCREEN_LIST_HEIGHT = 'max-h-[min(20rem,calc(100vh-400px))]'
const MODAL_LIST_HEIGHT = 'max-h-[min(28rem,calc(100vh-240px))]'
// The restart notice's line stays reserved so selecting a row doesn't move anything. In the modal it
// tucks into the dialog's bottom padding, which would otherwise leave a large empty strip there.
const SCREEN_NOTICE = 'min-h-5'
const MODAL_NOTICE = 'min-h-5 -mt-2 -mb-4'
// Padding so the selected row's ring isn't clipped by the scroller
const LIST_ROWS = 'flex w-full flex-col gap-2 p-0.5'
// How many placeholder rows to show before the first load has said how many accounts there are
const FIRST_LOAD_ROWS = 3

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
  // Rendered inside AddAccountModal rather than on the sign-in screen
  embedded?: boolean
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
  embedded = false,
}: AccountPickerProps) => {
  const { t } = useTranslation()
  const listClassName = cn(LIST_SCROLLER, embedded ? MODAL_LIST_HEIGHT : SCREEN_LIST_HEIGHT)
  const noticeClassName = embedded ? MODAL_NOTICE : SCREEN_NOTICE
  const selectedAccount = accounts.find(account => account.steamId === selectedSteamId)

  if (isLoading) {
    return (
      <div aria-busy className='flex w-full flex-col gap-4'>
        <div className={listClassName}>
          <div className={LIST_ROWS}>
            {Array.from({ length: accounts.length || FIRST_LOAD_ROWS }, (_, index) => (
              <AccountOptionSkeleton key={index} />
            ))}
          </div>
        </div>
        <div className='flex w-full gap-2'>
          <Skeleton className='h-9 min-w-0 flex-1 rounded-full' />
          <Skeleton className='size-9 shrink-0 rounded-full' />
        </div>
        <div className={noticeClassName} />
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
    <div className='flex w-full flex-col gap-4'>
      {summaryErrorCode ? (
        <Alert status='warning'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t(errorMessageKey(summaryErrorCode))}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className={listClassName}>
        <RadioGroup className={LIST_ROWS} value={selectedSteamId} onChange={onSelect}>
          {accounts.map(account => (
            <AccountOption key={account.steamId} account={account} />
          ))}
        </RadioGroup>
      </div>

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

      <div className='flex w-full gap-2'>
        <Button
          className='min-w-0 flex-1'
          isDisabled={!selectedAccount}
          isPending={isContinuing}
          onPress={onContinue}
        >
          <span className='truncate'>
            {selectedAccount
              ? t('auth.localSignIn.continueAs', { name: selectedAccount.personaName })
              : t('common.actions.continue')}
          </span>
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

      {/* Only for an account Steam isn't already on: useLocalSignIn's continueSignIn kills and
          relaunches Steam for those, and just carries on for the most recent one. */}
      <Typography align='center' className={noticeClassName} color='muted' type='body-xs'>
        {selectedAccount && !selectedAccount.mostRecent
          ? t('auth.localSignIn.restartNotice', { name: selectedAccount.personaName })
          : null}
      </Typography>
    </div>
  )
}

export default AccountPicker
