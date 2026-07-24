import * as contactsController from './contacts.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/contacts' }),
    tier: 'workspace',
    handler: contactsController.list,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/contacts' }),
    tier: 'workspace',
    handler: contactsController.create,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/contacts/:id' }),
    tier: 'workspace',
    handler: contactsController.getById,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/contacts/:id' }),
    tier: 'workspace',
    handler: contactsController.update,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/contacts/:id' }),
    tier: 'workspace',
    handler: contactsController.remove, // soft delete, see supabase/migrations/*_create_contacts_and_channels.sql
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/contacts/:id/channels' }),
    tier: 'workspace',
    handler: contactsController.addChannel,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/contact-channels/:id' }),
    tier: 'workspace',
    handler: contactsController.updateChannel,
  },
  {
    method: 'DELETE',
    pattern: new URLPattern({ pathname: '/contact-channels/:id' }),
    tier: 'workspace',
    handler: contactsController.removeChannel,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/lead-statuses' }),
    tier: 'workspace',
    handler: contactsController.listLeadStatuses,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/lead-sources' }),
    tier: 'workspace',
    handler: contactsController.listLeadSources,
  },
]
