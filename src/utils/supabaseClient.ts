import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zirhwhmtmhindenkzsoh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcmh3aG10bWhpbmRlbmt6c29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTQ4NDYsImV4cCI6MjA3NzczMDg0Nn0.x2VF88-3oA3OsrK5WGR7hdlonCovQqCAB5d4w7j8f1k',
)
