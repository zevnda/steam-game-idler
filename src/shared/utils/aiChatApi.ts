import type { AiChatQuota, AiChatSource } from '@/shared/stores/aiChatStore'

export const AI_CHAT_API_URL = 'https://api.steamgameidler.com/api/ai-chat'

export interface AiChatApiResponse {
  answer?: string
  sources?: AiChatSource[]
  quota?: AiChatQuota
  error?: string
}
