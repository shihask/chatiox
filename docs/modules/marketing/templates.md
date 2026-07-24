# Marketing: Templates

## Status

Not implemented in Phase 1. Real nav item (sidebar → Marketing → Templates), currently rendering `ComingSoonPage`.

## Model

```
Template -> ChannelTemplate
```

Never `WhatsAppTemplate`. One channel-agnostic `Template` (a name/category grouping) has N per-channel-type `ChannelTemplate` variants -- a WhatsApp-approved body differs from an SMS plain-text body differs from an Email HTML body, but they represent "the same template."

## Data shapes (documented now, no tables built yet)

```ts
interface TemplateDTO {
  id: string
  workspaceId: string
  name: string
  category: string | null
  channelTemplates: ChannelTemplateDTO[]
}
interface ChannelTemplateDTO {
  id: string
  templateId: string
  channelType: ChannelType
  providerTemplateId: string | null // e.g. a WhatsApp-approved template name
  body: string
  variables: string[] // e.g. ["first_name", "course_name"]
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
}
```

## Implementation checklist (when this is built)

- [ ] `marketing/templates.schemas.ts` / `.dtos.ts` / `.mapper.ts` / `.repository.ts` / `.service.ts` / `.controller.ts` / `.routes.ts`
- [ ] Migrations: `templates`, `channel_templates`, RLS scoped like `contacts`
- [ ] WhatsApp template _approval_ (a provider-side workflow) is validated through `IChannelProvider.validateTemplate()`, never a bespoke WhatsApp-only code path
