import type { FallbackProps } from 'react-error-boundary'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../buttons/PrimaryButton'

interface ErrorInfo {
  componentStack?: string | null
}

export const GlobalErrorFallback = ({ error }: FallbackProps) => {
  const { t } = useTranslation()
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)

  // Try to get errorInfo from window if available
  if (!errorInfo && window.lastComponentStack) {
    setErrorInfo({ componentStack: window.lastComponentStack + window.lastComponentStack })
  }

  const issueTitle = error && String(error)
  const issueBody = `### Description
<give a brief description of what you were doing when the error occurred>

### Steps to reproduce
<give a step-by-step description of how to reproduce the error>

### Stack
\`\`\`
${errorInfo?.componentStack ?? ''}
\`\`\`
`
  const encodedTitle = encodeURIComponent(String(issueTitle ?? 'Error in Steam Game Idler'))
  const encodedBody = encodeURIComponent(String(issueBody))

  return (
    <div className='bg-base min-h-screen w-screen flex flex-col'>
      <div
        className='fixed top-0 left-0 w-full h-12 select-none flex justify-center items-center bg-sidebar z-10'
        data-tauri-drag-region
      >
        <p className='text-content font-bold text-lg flex items-center gap-2'>
          {t('error_boundary.title')}
        </p>
      </div>

      <div className='flex flex-1 flex-col items-center justify-center gap-4 pt-16 pb-8 px-2 text-content'>
        <div className='flex flex-col justify-center gap-4 w-full max-w-4xl bg-tab-panel rounded-lg border border-border p-4 shadow-lg'>
          <p className='text-sm text-center'>{t('error_boundary.description')}</p>

          <div className='flex flex-col'>
            <p className='font-bold'>{t('common.error')}</p>
            <p className='text-sm font-mono text-danger font-semibold wrap-break-word'>
              {(() => {
                if (typeof error === 'string') {
                  return error.replace('Error: ', '')
                }
                if (error instanceof Error) {
                  return error.message.replace('Error: ', '')
                }
                return ''
              })()}
            </p>
          </div>

          <div className='flex flex-col max-h-80'>
            <p className='font-bold'>{t('error_boundary.stack_trace')}</p>
            <div className='bg-base border border-border rounded-lg h-full w-full p-1'>
              <div className='overflow-auto max-h-72 max-w-full'>
                <pre className='text-xs text-altwhite font-semibold text-left whitespace-pre-wrap p-1 min-h-8 min-w-full'>
                  {errorInfo?.componentStack ?? t('error_boundary.no_stack_trace')}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-wrap gap-4 justify-center'>
          <a
            href={`https://github.com/zevnda/steam-game-idler/issues/new?title=${encodedTitle}&body=${encodedBody}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <div className='bg-warning py-2 px-3 font-semibold rounded-full hover:opacity-90 duration-150'>
              <p className='text-xs'>{t('error_boundary.report_on_github')}</p>
            </div>
          </a>

          <PrimaryButton size='sm' onPress={() => window.location.reload()}>
            {t('common.reload_button')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
