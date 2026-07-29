import * as inboxController from './inbox.controller.ts'
import type { RouteDefinition } from '../../router.ts'

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/conversations' }),
    tier: 'workspace',
    handler: inboxController.listConversations,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/conversations' }),
    tier: 'workspace',
    handler: inboxController.startConversation,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/conversations/:id' }),
    tier: 'workspace',
    handler: inboxController.getConversation,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/conversations/:id' }),
    tier: 'workspace',
    handler: inboxController.updateConversation,
  },
  {
    method: 'PATCH',
    pattern: new URLPattern({ pathname: '/conversations/:id/link-contact' }),
    tier: 'workspace',
    handler: inboxController.linkContact,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/conversations/:id/create-contact' }),
    tier: 'workspace',
    handler: inboxController.createContact,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/conversations/:id/messages' }),
    tier: 'workspace',
    handler: inboxController.listMessages,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/conversations/:id/messages' }),
    tier: 'workspace',
    handler: inboxController.sendMessage,
  },
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: '/conversations/:id/notes' }),
    tier: 'workspace',
    handler: inboxController.listConversationNotes,
  },
  {
    method: 'POST',
    pattern: new URLPattern({ pathname: '/conversations/:id/notes' }),
    tier: 'workspace',
    handler: inboxController.createConversationNote,
  },
]
