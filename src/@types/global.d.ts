declare global {
  interface Window {
      lastComponentStack?: string
      $chatway: {
      openChatwayWidget: () => void
      closeChatwayWidget: () => void
      updateChatwayCustomData: (key: string, value: string) => void
    }
  }
}

export {}
