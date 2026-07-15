// Mirrors src-tauri/src/auto_idle/mod.rs's `AutoIdleEntry` (serde `rename_all = "camelCase"`).
export interface AutoIdleEntry {
  appId: number
  name: string
  enabled: boolean
}
