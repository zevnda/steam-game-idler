import type { QrSignInPhase } from '../hooks/useAgentQrSignIn'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, Spinner } from '@heroui/react'
import { QRCodeSVG } from 'qrcode.react'

interface QrSignInPanelProps {
  phase: QrSignInPhase
  errorCode: string | null
  onRetry: () => void
}

// Purely presentational - unlike the old `QrCodeForm`, this doesn't own `useAgentQrSignIn` itself
// (see `SignInScreen.tsx`'s doc comment on why that hook is lifted up to run continuously
// alongside the credentials flow, not mounted/unmounted with this panel's visibility).
const QrSignInPanel = ({ phase, errorCode, onRetry }: QrSignInPanelProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex w-56 flex-col items-center gap-3'>
      <p className='text-xs font-semibold uppercase tracking-wide text-primary'>
        {t('auth.signIn.qrCode.sectionLabel')}
      </p>

      {phase.kind === 'challenge' ? (
        <div className='rounded-lg bg-white p-4'>
          <QRCodeSVG size={176} value={phase.challengeUrl} />
        </div>
      ) : phase.kind === 'error' ? null : (
        <div className='flex h-52 w-52 items-center justify-center'>
          <Spinner size='lg' />
        </div>
      )}

      {phase.kind === 'error' ? (
        <Alert status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t(errorMessageKey(errorCode ?? 'agent_unknown_error'), { code: errorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <p className='text-center text-sm text-foreground-500'>
          {t('auth.signIn.qrCode.instructions')}
        </p>
      )}

      {phase.kind === 'error' ? (
        <Button size='sm' onPress={onRetry}>
          {t('common.actions.tryAgain')}
        </Button>
      ) : null}
    </div>
  )
}

export default QrSignInPanel
