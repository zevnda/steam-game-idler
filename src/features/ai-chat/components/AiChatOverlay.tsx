import type { FormEvent } from 'react'
import type { Components } from 'react-markdown'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbMessage, TbSend2 } from 'react-icons/tb'
import Markdown from 'react-markdown'
import { useAiChat } from '../hooks/useAiChat'
import { Button, cn, EmptyState, Input, Modal, Spinner, TextField, Typography } from '@heroui/react'
import remarkGfm from 'remark-gfm'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useAiChatStore } from '@/shared/stores/aiChatStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'
import { hasCasualAccess, hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Assistant answers are grounded prose from apibase's /api/ai-chat, which now writes light GFM
// markdown (bold, lists, inline code, links) instead of plain text - these overrides keep it
// legible inside a narrow chat bubble without pulling in @tailwindcss/typography for one surface.
const markdownComponents: Components = {
  // Tailwind's preflight resets every heading to `font-size: inherit; font-weight: inherit`, so
  // without an explicit size/weight here a `#`/`##` in the model's answer silently renders as
  // plain paragraph text - these scale down from the browser defaults to fit a chat bubble.
  h1: ({ children }) => <h1 className='mt-1 mb-2 text-base font-bold first:mt-0'>{children}</h1>,
  h2: ({ children }) => <h2 className='mt-3 mb-2 text-sm font-bold first:mt-0'>{children}</h2>,
  h3: ({ children }) => <h3 className='mt-2 mb-1 text-sm font-semibold first:mt-0'>{children}</h3>,
  h4: ({ children }) => <h4 className='mt-2 mb-1 text-sm font-semibold first:mt-0'>{children}</h4>,
  h5: ({ children }) => <h5 className='mt-2 mb-1 text-sm font-semibold first:mt-0'>{children}</h5>,
  h6: ({ children }) => <h6 className='mt-2 mb-1 text-sm font-semibold first:mt-0'>{children}</h6>,
  hr: () => <hr className='my-3 border-black/10' />,
  p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
  ul: ({ children }) => <ul className='mb-2 list-disc pl-5 last:mb-0'>{children}</ul>,
  ol: ({ children }) => <ol className='mb-2 list-decimal pl-5 last:mb-0'>{children}</ol>,
  // `className` carries GFM's own "task-list-item" marker for a `- [ ]` checkbox item - dropping
  // the bullet there avoids a marker sitting redundantly next to the checkbox. The checkbox
  // `<input type="checkbox" disabled>` itself needs no override: preflight's `appearance: button`
  // reset explicitly excludes checkbox/radio inputs, so it already renders as a native checkbox.
  li: ({ children, className }) => (
    <li className={cn('mb-1 last:mb-0', className?.includes('task-list-item') && 'list-none')}>
      {children}
    </li>
  ),
  // Preflight's universal `*` reset zeroes every element's margin/padding/border, which strips a
  // browser-default blockquote down to indistinguishable-from-paragraph text - same underlying
  // cause as the heading fix above, just a different element.
  blockquote: ({ children }) => (
    <blockquote className='mb-2 border-l-2 border-black/20 pl-3 italic opacity-80 last:mb-0'>
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className='rounded bg-black/10 px-1 py-0.5 font-mono text-xs'>{children}</code>
  ),
  pre: ({ children }) => (
    <pre className='mb-2 overflow-x-auto rounded bg-black/10 p-2 font-mono text-xs last:mb-0'>
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <button
      className='text-left underline underline-offset-2'
      type='button'
      onClick={() => href && openExternalLink(href)}
    >
      {children}
    </button>
  ),
  // GFM tables hit the same preflight reset as blockquote (zeroed border/padding on every cell),
  // so without this they'd render as cell text running together with no grid at all. Wrapped in
  // its own `overflow-x-auto` since a wide table easily exceeds this bubble's `max-w-[80%]`.
  table: ({ children }) => (
    <div className='mb-2 overflow-x-auto last:mb-0'>
      <table className='w-full border-collapse text-left'>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className='border-b border-black/20'>{children}</thead>,
  tr: ({ children }) => <tr className='border-b border-black/10 last:border-0'>{children}</tr>,
  th: ({ children }) => <th className='px-2 py-1 font-semibold'>{children}</th>,
  td: ({ children }) => <td className='px-2 py-1 align-top'>{children}</td>,
}

// apibase's daily cap resets on the UTC calendar day (`usageDate` there is a plain
// `toISOString().slice(0, 10)`), so the countdown always counts down to the next UTC midnight.
function msUntilNextUtcReset() {
  const now = new Date()
  const nextUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(0, nextUtcMidnight - now.getTime())
}

// Largest-unit-only countdown ("36s"/"3m"/"18h") - informational status text, not a stopwatch, so
// it doesn't need formatDuration.ts's zero-padded mm:ss shape.
function formatResetCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  if (hours >= 1) return `${hours}h`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes >= 1) return `${minutes}m`
  return `${totalSeconds}s`
}

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
  const clearMessages = useAiChatStore(state => state.clearMessages)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const { sendQuestion } = useAiChat()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Runs before paint so a reopened modal never flashes scrolled-to-top before jumping to the
  // latest message - HeroUI's Modal unmounts its body content while closed, so every open starts
  // the feed's scroll position back at 0 without this.
  useLayoutEffect(() => {
    if (!isOpen) return
    bottomRef.current?.scrollIntoView()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, messages, isSending])

  const handleNewChat = () => {
    setInput('')
    clearMessages()
  }

  const quotaExceeded = quota !== null && quota.used >= quota.max
  const isInputDisabled = isSending || quotaExceeded
  const isGamer = hasGamerAccess(subscriptionTier)

  // Only a Gamer account gets a "resets in" countdown - free/casual accounts get an upgrade prompt
  // instead (raising their cap is instant, not a wait), so the ticking clock only needs to run for
  // the one tier that actually cares about the exact reset time.
  const [, forceCountdownTick] = useState(0)
  useEffect(() => {
    if (!(quotaExceeded && isGamer)) return
    const intervalId = setInterval(() => forceCountdownTick(tick => tick + 1), 1000)
    return () => clearInterval(intervalId)
  }, [quotaExceeded, isGamer])

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
          <Modal.Dialog className='flex h-250 max-h-[95vh] flex-col overflow-hidden p-0'>
            <Modal.Header className='p-4'>
              <div className='flex flex-wrap items-center gap-2 pr-6'>
                <Modal.Heading>{t('titlebar.aiChat')}</Modal.Heading>
                {quota && (
                  // A plain numeric fraction, not user-facing prose - no words to translate, so
                  // this is exempt from the app's "always route through t()" rule.
                  <span className='rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold leading-3.5 text-muted'>
                    {quota.used} / {quota.max}
                  </span>
                )}
                <AppTooltip.Root delay={300}>
                  <AppTooltip.Trigger>
                    <Button
                      isIconOnly
                      aria-label={t('aiChat.newChat')}
                      className='ml-auto'
                      isDisabled={messages.length === 0 || isSending}
                      variant='ghost'
                      onPress={handleNewChat}
                    >
                      <TbMessage fontSize={18} />
                    </Button>
                  </AppTooltip.Trigger>
                  <AppTooltip.Content>{t('aiChat.newChat')}</AppTooltip.Content>
                </AppTooltip.Root>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className='flex flex-col gap-3 overflow-y-auto p-4'>
              {messages.length === 0 ? (
                <EmptyState className='flex flex-1 flex-col items-center justify-center gap-2 text-center'>
                  <Typography type='h3'>{t('aiChat.empty.title')}</Typography>
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
                        'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                        message.role === 'user'
                          ? 'whitespace-pre-wrap bg-accent text-white'
                          : 'bg-surface-secondary text-foreground',
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </Markdown>
                      ) : (
                        message.content
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
              {quotaExceeded ? (
                isGamer ? (
                  <Typography className='text-center' color='muted' type='body-sm'>
                    {t('aiChat.limit.resetsIn', {
                      time: formatResetCountdown(msUntilNextUtcReset()),
                    })}
                  </Typography>
                ) : (
                  <div className='flex items-center justify-between gap-3'>
                    <Typography type='body-sm'>
                      {t('aiChat.limit.upgradePrompt', {
                        time: formatResetCountdown(msUntilNextUtcReset()),
                      })}
                    </Typography>
                    <Button
                      className='shrink-0 rounded-full px-3 py-1.5 font-semibold'
                      size='sm'
                      onPress={() =>
                        openProModalWithTier(hasCasualAccess(subscriptionTier) ? 'gamer' : 'casual')
                      }
                    >
                      {t('dashboard.settings.subscription.status.upgrade')}
                    </Button>
                  </div>
                )
              ) : (
                <form className='flex items-center gap-2' onSubmit={handleSubmit}>
                  <TextField
                    aria-label={t('aiChat.placeholder')}
                    className='flex-1'
                    isDisabled={isInputDisabled}
                    value={input}
                    onChange={setInput}
                  >
                    <Input autoComplete='off' placeholder={t('aiChat.placeholder')} />
                  </TextField>
                  <Button
                    isIconOnly
                    isDisabled={isInputDisabled || !input.trim()}
                    isPending={isSending}
                    type='submit'
                  >
                    <TbSend2 fontSize={18} />
                  </Button>
                </form>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
