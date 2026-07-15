import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalSignIn } from '../hooks/useLocalSignIn'
import { errorMessageKey } from '../utils/errorMessageKey'
import AccountPicker from './AccountPicker'
import { Alert, Button, Spinner } from '@heroui/react'
import { useRouter } from 'next/router'
import AuthCard from '@/shared/components/AuthCard'
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
    return <Spinner size='lg' />
  }

  return (
    <>
      {/* Only offered while idle/errored ('ready') - hidden during 'loading'/'continuing' so
          backing out mid-request can't leave the account list or a Steam-switch action stranded. */}
      {phase === 'ready' ? <BackButton onPress={onBack} /> : null}
      {/* Full-width within AuthLayout's fixed-width left column, not `max-w-2xl` - this screen
          used to own its own full-viewport wrapper (room to spread wide), but now shares that
          column with the hero panel, so the account cards wrap onto more rows instead. */}
      <AuthCard className='w-full' title={t('auth.localSignIn.title')}>
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
      </AuthCard>
    </>
  )
}

export default LocalSignInScreen
