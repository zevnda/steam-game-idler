import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Button,
  Form,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  Spinner,
} from '@heroui/react'
import AuthCard from '@/shared/components/AuthCard'

// Steam Guard codes (both the email and mobile-authenticator variants) are always 5 alphanumeric
// characters - see AuthFlow.cs's WaitForGuardCodeAsync callers ("device"/"email"), neither of which
// enforces a length itself since SteamKit2 validates server-side; this is Steam's fixed format.
const GUARD_CODE_LENGTH = 5

interface GuardCodeFormProps {
  guardType: string
  detail: string | null
  isSubmitting: boolean
  isIncorrect: boolean
  onSubmit: (code: string) => void
  onCancel: () => void
}

const GuardCodeForm = ({
  guardType,
  detail,
  isSubmitting,
  isIncorrect,
  onSubmit,
  onCancel,
}: GuardCodeFormProps) => {
  const { t } = useTranslation()
  const [code, setCode] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(code.trim())
  }

  if (guardType === 'confirmation') {
    return (
      <AuthCard
        description={t('auth.signIn.guardCode.confirmationDescription')}
        title={t('auth.signIn.guardCode.confirmationTitle')}
      >
        <div className='flex flex-col items-center gap-4'>
          <Spinner size='lg' />
          <Button variant='secondary' onPress={onCancel}>
            {t('common.actions.cancel')}
          </Button>
        </div>
      </AuthCard>
    )
  }

  const isEmail = guardType === 'email'

  return (
    <AuthCard
      description={
        isEmail
          ? t('auth.signIn.guardCode.emailDescription', { email: detail ?? '' })
          : t('auth.signIn.guardCode.deviceDescription')
      }
      title={
        isEmail ? t('auth.signIn.guardCode.emailTitle') : t('auth.signIn.guardCode.deviceTitle')
      }
    >
      <Form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        {isIncorrect ? (
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{t('auth.signIn.guardCode.incorrectCode')}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <div className='flex flex-col items-center gap-2'>
          <Label htmlFor='guard-code-input'>{t('auth.signIn.guardCode.codeLabel')}</Label>
          <InputOTP
            autoFocus
            id='guard-code-input'
            isDisabled={isSubmitting}
            isInvalid={isIncorrect}
            maxLength={GUARD_CODE_LENGTH}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            value={code}
            onChange={setCode}
          >
            <InputOTP.Group>
              {Array.from({ length: GUARD_CODE_LENGTH }, (_, index) => (
                <InputOTP.Slot key={index} index={index} />
              ))}
            </InputOTP.Group>
          </InputOTP>
        </div>

        <div className='flex gap-2'>
          <Button
            isDisabled={code.length < GUARD_CODE_LENGTH}
            isPending={isSubmitting}
            type='submit'
          >
            {t('auth.signIn.guardCode.submitButton')}
          </Button>
          <Button isDisabled={isSubmitting} type='button' variant='secondary' onPress={onCancel}>
            {t('common.actions.cancel')}
          </Button>
        </div>
      </Form>
    </AuthCard>
  )
}

export default GuardCodeForm
