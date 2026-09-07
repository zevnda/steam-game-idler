import type { AiChatQuota } from '@/shared/stores/aiChatStore'

export const AI_CHAT_API_URL = 'https://api.steamgameidler.com/api/ai-chat'

// Sent as `history` on the request body - deliberately capped to the single prior user+assistant
// exchange (see useAiChat.ts's sendQuestion), not the full aiChatStore transcript. apibase's
// /api/ai-chat re-sends the numbered-sources context block on every turn regardless, so an
// unbounded history would grow input-token cost on every single turn of a long conversation, not
// just the cost of remembering one prior exchange.
export interface AiChatHistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatApiResponse {
  answer?: string
  quota?: AiChatQuota
  error?: string
}
