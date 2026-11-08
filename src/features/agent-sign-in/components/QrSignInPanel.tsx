import type { QrSignInPhase } from '../hooks/useAgentQrSignIn'
import { useTranslation } from 'react-i18next'
import { TbCheck } from 'react-icons/tb'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, cn, Skeleton, Spinner } from '@heroui/react'
import { QRCodeSVG } from 'qrcode.react'

// The code gives up height before its host starts to scroll. 623px is the window height taken by
// everything else on the sign-in screen (AuthLayout's top row and footer, plus the heading, form,
// divider and this panel's two lines of text), and AddAccountModal's own frame comes to about the
// same. So the code takes whatever is left, up to its full size. Below 120px it stops shrinking, to
// stay easy to scan, and the host scrolls instead.
const QR_SIZE = 'size-[clamp(120px,calc(100vh-623px),175px)]'

interface QrSignInPanelProps {
  phase: QrSignInPhase
  errorCode: string | null
  onRetry: () => void
  onNewCode: () => void
}

// Purely presentational - unlike the old `QrCodeForm`, this doesn't own `useAgentQrSignIn` itself
// (see `SignInScreen.tsx`'s doc comment on why that hook is lifted up to run continuously
// alongside the credentials flow, not mounted/unmounted with this panel's visibility).
const QrSignInPanel = ({ phase, errorCode, onRetry, onNewCode }: QrSignInPanelProps) => {
  const { t } = useTranslation()
  const scanState = phase.kind === 'challenge' ? phase.scanState : 'waiting'

  return (
    <div className='flex w-full flex-col items-center gap-3'>
      <p className='text-sm font-semibold text-foreground'>{t('auth.signIn.qrCode.scanLabel')}</p>

      {phase.kind === 'error' ? null : (
        // One box for both states, so the code replaces the skeleton without moving anything.
        // `size` is only the SVG's intrinsic size, QR_SIZE is what it's displayed at.
        <div className={`relative rounded-xl p-3 ${phase.kind === 'challenge' ? 'bg-white' : ''}`}>
          {phase.kind === 'challenge' ? (
            <>
              <QRCodeSVG
                className={cn(QR_SIZE, scanState !== 'waiting' && 'blur-sm')}
                size={176}
                value={phase.challengeUrl}
              />
              {scanState === 'waiting' ? null : (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='flex size-14 items-center justify-center rounded-xl bg-black/85 text-white'>
                    {scanState === 'scanned' ? (
                      <Spinner color='current' />
                    ) : (
                      <TbCheck fontSize={30} strokeWidth={3} />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Skeleton className='absolute inset-0 rounded-[inherit]' />
              <div className={QR_SIZE} />
            </>
          )}
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
        <p className='text-center text-[13px] text-muted' role='status'>
          {scanState === 'waiting'
            ? t('auth.signIn.qrCode.instructions')
            : scanState === 'scanned'
              ? t('auth.signIn.qrCode.scanned')
              : t('auth.signIn.qrCode.approved')}
          {scanState === 'scanned' ? (
            <>
              {' '}
              <button
                className='cursor-pointer font-medium text-accent outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-focus'
                type='button'
                onClick={onNewCode}
              >
                {t('auth.signIn.qrCode.newCode')}
              </button>
            </>
          ) : null}
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
