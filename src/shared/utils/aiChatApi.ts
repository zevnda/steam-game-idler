import type { AiChatQuota } from '@/shared/stores/aiChatStore'

export const AI_CHAT_API_URL = 'https://api.steamgameidler.com/api/ai-chat'

export interface AiChatApiResponse {
  answer?: string
  quota?: AiChatQuota
  error?: string
}
