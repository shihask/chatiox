import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/api/contactsApi'
import { leadStatusesKeys } from '@/features/crm/contacts/hooks/queryKeys'

/** Backs the ContactForm's dropdown -- changes rarely, so a longer staleTime avoids refetching on
 * every form open. Phase 1 has no write UI for these lists yet (see docs/modules/administration/workspace.md). */
export function useLeadStatuses() {
  return useQuery({
    queryKey: leadStatusesKeys.all,
    queryFn: () => contactsApi.listLeadStatuses(),
    staleTime: 5 * 60 * 1000,
  })
}
