import { addToast } from '@heroui/react'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://inbxfhxkrhwiybnephlq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYnhmaHhrcmh3aXlibmVwaGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Njc5NjgsImV4cCI6MjA3NzM0Mzk2OH0.xUbDMdMUk7S2FgRZu8itWr4WsIV41TX-sNgilXiZg_Y',
)

export function usePinnedMessage(): {
  pinnedMessageId: string | null
  pinnedMessage: Record<string, unknown> | null
  handlePinMessage: (msgId: string) => Promise<void>
  handleUnpinMessage: () => Promise<void>
  setPinnedMessage: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
} {
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const fetchPin = async (): Promise<void> => {
      const { data, error } = await supabase.from('pins').select('message_id').maybeSingle()
      if (!error && data?.message_id) setPinnedMessageId(data.message_id)
      else setPinnedMessageId(null)
    }
    fetchPin()
    const pinChannel = supabase
      .channel('pins')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setPinnedMessageId(payload.new.message_id)
        } else if (payload.eventType === 'DELETE') {
          setPinnedMessageId(null)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(pinChannel)
    }
  }, [])

  useEffect(() => {
    if (!pinnedMessageId) {
      setPinnedMessage(null)
      return
    }
    supabase
      .from('messages')
      .select('*')
      .eq('id', pinnedMessageId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setPinnedMessage(data)
        else setPinnedMessage(null)
      })
  }, [pinnedMessageId])

  const handlePinMessage = async (msgId: string): Promise<void> => {
    await supabase.from('pins').delete().not('message_id', 'is', null)
    const { error } = await supabase.from('pins').insert({ message_id: msgId })
    if (!error) setPinnedMessageId(msgId)
    else addToast({ title: 'Failed to pin message', color: 'danger' })
  }

  const handleUnpinMessage = async (): Promise<void> => {
    setPinnedMessageId(null)
    setPinnedMessage(null)
    const { error } = await supabase.from('pins').delete().not('message_id', 'is', null)
    if (error) addToast({ title: 'Failed to unpin message', color: 'danger' })
  }

  return {
    pinnedMessageId,
    pinnedMessage,
    handlePinMessage,
    handleUnpinMessage,
    setPinnedMessage,
  }
}
