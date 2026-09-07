import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbSend2 } from 'react-icons/tb'
import { useAiChat } from '../hooks/useAiChat'
import { Button, cn, EmptyState, Input, Modal, Spinner, TextField, Typography } from '@heroui/react'
import { useAiChatStore } from '@/shared/stores/aiChatStore'
import { openExternalLink } from '@/shared/utils/links'

// Mounted once in DashboardShell, driven entirely by aiChatStore so opening it never depends on
// which /dashboard/* route is active - same pattern as AchievementManagerOverlay/
// AchievementOrderOverlay. A plain Q&A modal (message list + input), not a per-account overlay:
// conversation history is session-only and global, see aiChatStore's own doc comment for why.
export const AiChatOverlay = () => {
  const { t } = useTranslation()
  const isOpen = useAiChatStore(state => state.isOpen)
  const close = useAiChatStore(state => state.close)
  const messages = useAiChatStore(state => state.messages)
  const isSending = useAiChatStore(state => state.isSending)
  const quota = useAiChatStore(state => state.quota)
  const { sendQuestion } = useAiChat()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const quotaExceeded = quota !== null && quota.used >= quota.max
  const isInputDisabled = isSending || quotaExceeded

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!input.trim() || isInputDisabled) return
    const question = input
    setInput('')
    sendQuestion(question)
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && close()}>
      <Modal.Backdrop>
        <Modal.Container size='lg'>
          <Modal.Dialog className='overflow-hidden p-0'>
            <Modal.Header className='p-4'>
              <Modal.Heading>{t('titlebar.aiChat')}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className='flex min-h-125 flex-col gap-3 overflow-y-auto p-4'>
              {messages.length === 0 ? (
                <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 text-center'>
                  <Typography type='h3'>{t('aiChat.empty.title')}</Typography>
                  <Typography color='muted' type='body-sm'>
                    {t('aiChat.empty.description')}
                  </Typography>
                </EmptyState>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm',
                        message.role === 'user'
                          ? 'bg-accent text-white'
                          : 'bg-surface-secondary text-foreground',
                      )}
                    >
                      {message.content}
                      {message.sources && message.sources.length > 0 && (
                        <div className='mt-2 flex flex-col gap-1 border-t border-border/50 pt-2'>
                          <Typography color='muted' type='body-xs'>
                            {t('aiChat.sources')}
                          </Typography>
                          {message.sources.map(source => (
                            <button
                              key={source.url}
                              className='text-left text-xs text-accent underline underline-offset-2'
                              type='button'
                              onClick={() => openExternalLink(source.url)}
                            >
                              {source.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className='flex justify-start'>
                  <div className='rounded-xl bg-surface-secondary px-3 py-2'>
                    <Spinner size='sm' />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </Modal.Body>

            <Modal.Footer className='mt-0 flex-col items-stretch gap-2 border-t border-border p-4'>
              {quotaExceeded && (
                <Typography className='text-danger' type='body-xs'>
                  {t('aiChat.errors.quotaExceeded')}
                </Typography>
              )}
              <form className='flex items-center gap-2' onSubmit={handleSubmit}>
                <TextField
                  aria-label={t('aiChat.placeholder')}
                  className='flex-1'
                  isDisabled={isInputDisabled}
                  value={input}
                  onChange={setInput}
                >
                  <Input placeholder={t('aiChat.placeholder')} />
                </TextField>
                <Button
                  isIconOnly
                  aria-label={t('common.actions.send')}
                  isDisabled={isInputDisabled || !input.trim()}
                  isPending={isSending}
                  type='submit'
                >
                  <TbSend2 fontSize={18} />
                </Button>
              </form>
              {quota && (
                <Typography color='muted' type='body-xs'>
                  {t('aiChat.quota.remaining', { used: quota.used, max: quota.max })}
                </Typography>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
