import type { ReactNode } from 'react'
import type { QrSignInPhase } from '../hooks/useAgentQrSignIn'
import { useTranslation } from 'react-i18next'
import CredentialsForm from './CredentialsForm'
import QrSignInPanel from './QrSignInPanel'

interface SteamSignInFormProps {
  isSubmitting: boolean
  errorCode: string | null
  onSubmit: (username: string, password: string) => void
  qrPhase: QrSignInPhase
  qrErrorCode: string | null
  onQrRetry: () => void
  onQrNewCode: () => void
  // Replaces the default heading, and tightens the spacing, for hosts short on height
  header?: ReactNode
}

// The whole Steam Sign-in step, shared by the sign-in screen and AddAccountModal. Purely
// presentational: each host owns its own sign-in and QR hooks, because each decides when the QR
// attempt starts and stops and what happens on success.
const SteamSignInForm = ({
  isSubmitting,
  errorCode,
  onSubmit,
  qrPhase,
  qrErrorCode,
  onQrRetry,
  onQrNewCode,
  header,
}: SteamSignInFormProps) => {
  const { t } = useTranslation()

  return (
    <div className={header ? 'flex flex-col gap-4' : 'flex flex-col gap-7'}>
      {header ?? (
        <h2 className='text-[28px] font-bold tracking-tight text-foreground'>
          {t('auth.signIn.title')}
        </h2>
      )}
      <CredentialsForm errorCode={errorCode} isSubmitting={isSubmitting} onSubmit={onSubmit} />
      <div className='h-px bg-border' />
      <QrSignInPanel
        errorCode={qrErrorCode}
        phase={qrPhase}
        onNewCode={onQrNewCode}
        onRetry={onQrRetry}
      />
    </div>
  )
}

export default SteamSignInForm
