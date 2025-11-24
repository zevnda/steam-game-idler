import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react'

import { createContext, useContext, useState } from 'react'

interface UpdateContextType {
  updateAvailable: boolean
  setUpdateAvailable: Dispatch<SetStateAction<boolean>>
}

export const UpdateContext = createContext<UpdateContextType | undefined>(undefined)

export const UpdateProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  return (
    <UpdateContext.Provider
      value={{
        updateAvailable,
        setUpdateAvailable,
      }}
    >
      {children}
    </UpdateContext.Provider>
  )
}

export function useUpdateContext(): UpdateContextType {
  const context = useContext(UpdateContext)
  if (context === undefined) {
    throw new Error('useUpdateContext must be used within an UpdateProvider')
  }
  return context
}
