import { useTranslation } from 'react-i18next'
import { RiRobotLine } from 'react-icons/ri'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useAiChatStore } from '@/shared/stores/aiChatStore'

// Titlebar launcher for the AI Assistant (AiChatOverlay). Unlike HelpDesk (hard-gated to Casual+,
// renders nothing below that), this is visible to every tier - free-tier users get a lower daily
// message cap rather than no access at all, enforced server-side by apibase's /api/ai-chat.
export const AiChatButton = () => {
  const { t } = useTranslation()
  const open = useAiChatStore(state => state.open)

  return (
    <AppTooltip.Root delay={300}>
      <AppTooltip.Trigger>
        <button
          type='button'
          aria-label={t('titlebar.aiChat')}
          className='relative flex h-14 w-12 items-center justify-center text-foreground cursor-pointer outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
          onClick={open}
        >
          <RiRobotLine fontSize={18} />
        </button>
      </AppTooltip.Trigger>
      <AppTooltip.Content placement='bottom'>{t('titlebar.aiChat')}</AppTooltip.Content>
    </AppTooltip.Root>
  )
}
