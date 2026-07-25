import { createContext } from 'react'

export interface CreateContactDialogContextValue {
  open: () => void
}

export const CreateContactDialogContext = createContext<CreateContactDialogContextValue | null>(null)
