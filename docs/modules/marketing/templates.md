# Marketing: Templates

## Status

Not implemented in Phase 1/2's Marketing domain. Real nav item (sidebar → Marketing → Templates), currently rendering `ComingSoonPage`.

**The underlying tables already exist**, built as part of the provider-agnostic messaging architecture (see `docs/modules/communication/inbox.md`) since Inbox needed them before Marketing did: `public.templates` (business-facing, channel-agnostic) and `public.channel_templates` (the provider-specific approved variant), both in the Communication domain (`supabase/functions/api/{repositories,services,controllers}/communication/templates.*`). `GET/POST /templates` and `GET /templates/:id/channel-templates` are already real endpoints. **This module's job, when built, is the UI and campaign-integration layer on top of those existing tables** -- not a new schema.

## Model

```
Template -> ChannelTemplate
```

Never `WhatsAppTemplate`. One channel-agnostic `Template` (e.g. "Welcome Message" -- just a name/purpose) has N per-channel-type `ChannelTemplate` variants -- a WhatsApp-approved body differs from an SMS plain-text body differs from an Email HTML body, but they represent "the same template." A future Campaign references a `Template`, and at send time resolves the right `ChannelTemplate` for whichever channel it's sending through.

## Data shapes (already implemented -- see supabase/functions/api/dtos/communication/templates.dtos.ts)

```ts
interface TemplateDTO {
  id: string
  workspaceId: string
  name: string
  purpose: string | null
  createdBy: string | null
}
interface ChannelTemplateDTO {
  id: string
  workspaceId: string
  templateId: string
  channelConnectionId: string
  channelType: ChannelType
  providerTemplateName: string // e.g. a WhatsApp-approved template name
  languageCode: string
  body: string | null
  variables: unknown[] // e.g. ["first_name", "course_name"]
  status: 'pending' | 'approved' | 'rejected'
  providerTemplateId: string | null
}
```

`channel_templates` is **read/sync only** today -- rows are meant to be populated by a future "sync approved templates from Meta" action (`IChannelProvider.validateTemplate()`/a `listApprovedTemplates()` call), not authored directly in Chatiox's UI, since WhatsApp template approval fundamentally happens in Meta Business Manager. No create/update endpoints exist for `channel_templates` yet -- only for the parent `templates` row.

## Implementation checklist (when this Marketing-domain module is built)

- [x] Migrations: `templates`, `channel_templates`, RLS scoped like `contacts` -- already done, in `communication/`, not `marketing/`
- [x] `GET/POST /templates`, `GET /templates/:id/channel-templates` -- already real
- [ ] `marketing/templates.*` UI: template list/detail pages, a "create template" flow, and a "sync channel templates" action calling into `IChannelProvider`
- [ ] WhatsApp template _approval_ sync is validated through `IChannelProvider.validateTemplate()`, never a bespoke WhatsApp-only code path
- [ ] Campaign send logic (future) resolves `channel_templates` by `(templateId, channelType)` at send time -- never duplicates template content into a campaign row
