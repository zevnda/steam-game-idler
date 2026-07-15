import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, FieldError, Form, Input, Label, TextField } from '@heroui/react'

interface CredentialsFormProps {
  isSubmitting: boolean
  errorCode: string | null
  onSubmit: (username: string, password: string) => void
}

// Bare fields only - the outer `AuthCard` title/description now lives in `SignInScreen.tsx`,
// shared with `QrSignInPanel.tsx` as the two columns of one combined sign-in card.
const CredentialsForm = ({ isSubmitting, errorCode, onSubmit }: CredentialsFormProps) => {
  const { t } = useTranslation()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const username = String(data.get('username') ?? '').trim()
    const password = String(data.get('password') ?? '')
    onSubmit(username, password)
  }

  return (
    <div className='flex w-64 flex-col gap-3'>
      <p className='text-xs font-semibold uppercase tracking-wide text-primary'>
        {t('auth.signIn.credentialsSectionLabel')}
      </p>

      <Form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        {errorCode ? (
          <Alert status='danger'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('auth.signIn.errors.title')}</Alert.Title>
              <Alert.Description>
                {t(errorMessageKey(errorCode), { code: errorCode })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <TextField isRequired isDisabled={isSubmitting} name='username'>
          <Label>{t('auth.signIn.usernameLabel')}</Label>
          <Input autoComplete='username' placeholder={t('auth.signIn.usernamePlaceholder')} />
          <FieldError>{t('auth.signIn.usernameRequired')}</FieldError>
        </TextField>

        <TextField isRequired isDisabled={isSubmitting} name='password'>
          <Label>{t('auth.signIn.passwordLabel')}</Label>
          <Input
            autoComplete='current-password'
            placeholder={t('auth.signIn.passwordPlaceholder')}
            type='password'
          />
          <FieldError>{t('auth.signIn.passwordRequired')}</FieldError>
        </TextField>

        <Button isPending={isSubmitting} type='submit'>
          {t('common.actions.signIn')}
        </Button>
      </Form>
    </div>
  )
}

export default CredentialsForm
