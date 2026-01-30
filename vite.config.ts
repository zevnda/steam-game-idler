import tailwindcss from '@tailwindcss/vite'
import UnheadVite from '@unhead/addons/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    clearScreen: false,
    server: {
      port: 3000,
      strictPort: true,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      host: host || false,
      hmr: host
        ? {
            protocol: 'ws',
            host,
            port: 3001,
          }
        : undefined,
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    plugins: [
      tsconfigPaths(),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
      UnheadVite(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint',
          useFlatConfig: true,
          dev: {
            logLevel: ['error'],
          },
        },
      }),
    ],
  }
})
