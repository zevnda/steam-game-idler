import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalSignIn } from '../hooks/useLocalSignIn'
import { errorMessageKey } from '../utils/errorMessageKey'
import AccountPicker from './AccountPicker'
import { Alert, Button, Spinner } from '@heroui/react'
import { useRouter } from 'next/router'
import BackButton from '@/shared/components/BackButton'

interface LocalSignInScreenProps {
  onBack: () => void
}

const LocalSignInScreen = ({ onBack }: LocalSignInScreenProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    phase,
    accounts,
    selectedSteamId,
    loadErrorCode,
    summaryErrorCode,
    actionErrorCode,
    selectAccount,
    continueSignIn,
    refresh,
  } = useLocalSignIn()

  useEffect(() => {
    if (phase === 'success') {
      router.push('/dashboard')
    }
  }, [phase, router])

  if (phase === 'success') {
    return (
      <div className='flex justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  return (
    <>
      {/* Hidden only while 'continuing', so backing out can't strand a half-finished Steam
          switch. It stays during 'loading': leaving then is harmless, and the Steam Web API call
          behind that phase has no timeout, so a hung request would otherwise trap the user here. */}
      {phase !== 'continuing' ? <BackButton onPress={onBack} /> : null}
      <div className='flex flex-col gap-7'>
        <h2 className='text-[28px] font-bold tracking-tight text-foreground'>
          {t('auth.localSignIn.title')}
        </h2>
        {loadErrorCode ? (
          <div className='flex flex-col items-center gap-4'>
            <Alert status='danger'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('common.errorBoundary.title')}</Alert.Title>
                <Alert.Description>
                  {t(errorMessageKey(loadErrorCode), { code: loadErrorCode })}
                </Alert.Description>
              </Alert.Content>
            </Alert>
            <Button variant='secondary' onPress={refresh}>
              {t('common.actions.tryAgain')}
            </Button>
          </div>
        ) : (
          <AccountPicker
            accounts={accounts}
            actionErrorCode={actionErrorCode}
            isContinuing={phase === 'continuing'}
            isLoading={phase === 'loading'}
            selectedSteamId={selectedSteamId}
            summaryErrorCode={summaryErrorCode}
            onContinue={continueSignIn}
            onRefresh={refresh}
            onSelect={selectAccount}
          />
        )}
      </div>
    </>
  )
}

export default LocalSignInScreen
