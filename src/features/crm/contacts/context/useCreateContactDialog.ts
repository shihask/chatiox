import { useContext } from 'react'
import {
  CreateContactDialogContext,
  type CreateContactDialogContextValue,
} from '@/features/crm/contacts/context/CreateContactDialogContext'

export function useCreateContactDialog(): CreateContactDialogContextValue {
  const ctx = useContext(CreateContactDialogContext)
  if (!ctx) throw new Error('useCreateContactDialog must be used within a CreateContactDialogProvider')
  return ctx
}
