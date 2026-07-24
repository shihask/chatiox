# Chatiox Architecture

Chatiox is a multi-tenant **CRM with integrated omnichannel customer communication** -- not a WhatsApp marketing tool, not an ERP, not a student/school management system. Its responsibility stops at lead capture, contact management, communication, campaigns, follow-ups, and lead conversion; once a lead converts (e.g. status "Admission Confirmed"), downstream operational systems (fee collection, attendance, payroll, accounting, etc.) are explicitly out of scope. It must work for any lead-generating, customer-communicating business (education, clinics, real estate, travel, salons, services...) without the core CRM being industry-specific.

The backend must be swappable later from Supabase to ASP.NET Core + SQL Server **without touching the React frontend**. Every architectural decision below is made with that migration in mind.

## 1. Layering

**One deployed Edge Function for the entire backend** (`supabase/functions/api/`), internally organized exactly like a future ASP.NET Core project: `controllers/` -> `services/` -> `repositories/`, plus `mappers/`, `schemas/`, `dtos/`. `supabase functions deploy api` is the only deploy target, forever -- adding a module never creates a new deploy target, only new files inside the existing one.

Each of those six layer folders gains **one subfolder per business domain**: `crm/`, `communication/`, `marketing/`, `automation/`, `analytics/`, `administration/`. Files inside stay bare (`contacts.controller.ts`, not `crm-contacts.controller.ts` -- the folder already encodes the domain). Two things stay flat, ungrouped by domain, because they are cross-cutting infrastructure rather than a business domain:

- **Auth** -- platform identity/access, not a business concern.
- **`workspace.repository.ts`** -- the tenant-role lookup every domain's repository depends on equally.

A domain subfolder is only created when its first real module is built (Phase 1 only creates `crm/`, populated with `contacts.*`) -- never speculatively.

The Deno `URLPattern`-based router (`api/router.ts`) aggregates each module's own `<module>.routes.ts` file. Adding a module means adding one file + one import + one array entry in `router.ts` -- never a growing inline route list. REST URL paths themselves stay flat (`/contacts`, not `/crm/contacts`) -- domain grouping is a file-system/mental-model concern, not a URL-namespacing concern.

Frontend mirrors the same domain-folder principle under `src/features/`, with `auth/` and `dashboard/` staying flat for the same reason (platform identity; a standalone landing page, not itself a domain).

## 2. Multi-tenancy: Workspace (UI/API) vs. tenant (database)

Users and the REST API speak **"Workspace"** (`X-Workspace-Id` header, `workspaceId` in every DTO). The Postgres schema keeps **"tenant"** naming forever (`tenants`, `tenant_id`, `tenant_memberships`, `get_my_tenant_ids()`, `get_my_role(tenant_id)`). The Repository layer is the _only_ place both names ever appear together -- exactly like `ContactRow -> ContactDTO` hides schema details from the frontend, `tenant_id -> workspaceId` hides the database's own naming from everything above the repository.

Roles: `owner` / `admin` / `manager` / `agent` (Postgres enum `tenant_role`). RLS enforces tenant isolation on every table via `get_my_tenant_ids()`; role-gated actions (e.g. only `owner`/`admin`/`manager` may soft-delete a contact) are checked in `security definer` RPCs or the Service layer, not left to a generic RLS policy to distinguish.

### Two things both named "Workspace"

1. The multi-tenancy noun above (`workspaceId`, `X-Workspace-Id`).
2. The settings-page feature (`src/features/administration/workspace/`, `docs/modules/administration/workspace.md`) -- kept textually distinct by living under `administration/`.

### Two things both named "Channels"

1. `supabase/functions/api/channels/` -- the cross-cutting `IChannelProvider` plugin abstraction (interface + registry + concrete providers), sibling to `controllers/`, not domain-nested.
2. The **business module** (`docs/modules/communication/channels.md`, `src/features/communication/channels/`) -- the screen where a workspace connects/manages its WhatsApp number, email sender, etc. It _calls into_ (1); they are not the same thing.

## 3. Channel-agnostic core

A Contact has zero or more `ContactChannel` identities (WhatsApp, email, SMS, Telegram, ...) -- Contacts never hardcode a phone/WhatsApp field. Messaging lives entirely behind an `IChannelProvider` contract (`send`, `receiveWebhook`, `validateTemplate`, `uploadMedia`, plus a `capabilities` flag set) and a `providerRegistry` (`registerProvider`/`getProvider`). Business logic always calls `getProvider(channelType).send(...)` -- **never** a concrete `WhatsAppService`. Providers are plugins, not modules: a channel's entire footprint is `WhatsAppProvider implements IChannelProvider`, registered once; it never gets its own `*Service`/`*Controller`/top-level folder outside `api/channels/providers/<name>/`.

## 4. Repository pattern & the ASP.NET Core migration story

```ts
export interface IRepository<TEntity, TCreate, TUpdate, TId = string> {
  list(workspaceId: string, params: ListParams): Promise<Page<TEntity>>
  getById(workspaceId: string, id: TId): Promise<TEntity | null>
  create(workspaceId: string, data: TCreate): Promise<TEntity>
  update(workspaceId: string, id: TId, data: TUpdate): Promise<TEntity>
  delete(workspaceId: string, id: TId): Promise<void>
}
```

This shape is unchanged across every revision of this architecture. `ContactsRepository` implements it without changing the shape: reads use PostgREST's embedded-resource select, `create` calls a Postgres RPC (`create_contact_with_channels`) for the atomic two-table write, `delete` internally calls `soft_delete_contact` (an RPC, not a raw SQL `DELETE`). When ASP.NET Core replaces Supabase, this exact interface is re-expressed as a C# `IContactsRepository`, `SqlServerContactsRepository` (EF Core) replaces the Supabase implementation, and `ContactsService` doesn't conceptually change -- only the language does. The frontend never notices, because it only ever talks to DTOs over `/api/v1/*`.

## 5. Domain events, audit log, and how Timeline extends both

Two real, Phase-1 mechanisms, both wired into Auth and Contacts:

- **Domain event bus** (`_shared/events.ts`): `emit(event: DomainEvent)`, console-log-backed today, swappable for a real broker (Redis/Kafka/RabbitMQ) later with zero call-site changes. `onEvent(listener)` exists from Phase 1 onward specifically so a future consumer (Timeline, Automation) can subscribe without any emitting module changing.
- **Audit log** (`audit_logs` table + `recordAudit()`): a human-readable, `owner`/`admin`-only-readable trail of sensitive actions (`contact.created`, `auth.login`, ...), written via a `security definer` RPC so no client can forge an entry.

**Timeline** (documented in `docs/modules/crm/timeline.md`, not built in Phase 1) is designed to be a third downstream consumer of the _same_ event bus rather than a new mechanism: a future `activities.subscriber.ts` calls `onEvent()` once and maps `DomainEvent` variants into rows of an `activities` table, keyed by `contact_id`. "Timeline" is the per-contact chronological read view over those Activities -- not a second storage concept. This is why every module, from Phase 1 onward, is expected to `emit()` a `DomainEvent` after every state-changing write: it is simultaneously how the audit log, and eventually Timeline and Automation, all stay informed, with the emitting code never needing to know who's listening.

## 6. Future CRM Extensions

Deliberately documented here, not built, until a concrete need promotes one into a real module following the same pattern as Contacts:

- **Opportunity.** Phase 1's `lead_status_id`/`lead_source_id` living directly on `Contact` is a deliberately simplified model ("one contact = one active lead journey") and must not be assumed permanent. The natural evolution if/when a business needs multiple concurrent or repeated sales journeys per contact (e.g. a contact takes one course, then re-enquires about a different one six months later -- same Contact, new sales opportunity) is `Contact 1->N Opportunity`, each carrying its own `leadStatus`/`expectedValue`/`pipeline`/`owner`, with `Contact.lead_status_id`/`lead_source_id` becoming a denormalized "current/latest opportunity" convenience rather than the source of truth.
- **Companies.** A lightweight entity, nullable `company_id` FK on `contacts` ("one company has many contacts"), contact count derived, never duplicated.
- **Segments**, **Custom Fields** -- future, deferred the same way.
- **Capture Method.** A distinct dimension from Lead Source ("how did this contact enter the system" -- Manual, Import CSV, Website Form, WhatsApp, API, QR Code, Facebook Lead Ads, Google Lead Form -- vs. "which channel/campaign brought them"). Unlike `lead_sources` (business-curated per workspace), Capture Method values are integration-driven, so a future `capture_methods` lookup is modeled like `channel_types` -- global/platform-curated, not per-workspace -- with a nullable `capture_method_id` FK reserved on `contacts`.
- **Contact Import** (CSV/Excel/Google Contacts) -- an early Phase 2 candidate since the Contacts schema already supports it (multiple channels per contact, tags, lead status/source).
- **File Storage.** Supabase Storage buckets, workspace-prefixed paths, for logos/CSV imports/media attachments -- not built, no bucket policy defined yet.
- **Contact Merge.** Every CRM eventually encounters duplicate contacts. Not built now, but documented as a hard constraint on everything built from here forward: Activities, Tasks, Notes, campaign/delivery history, and any other future record that references a contact must do so **only** via `contact_id` foreign key, never by duplicating contact fields (name/phone/email/tags). Phase 1's Contacts design already follows this discipline throughout. That is what keeps a future merge operation a matter of reassigning foreign keys, not migrating scattered denormalized copies.

### Explicit non-goals

To keep the CRM from drifting into a full sales platform: Deals, Opportunity forecasting, Revenue forecasting, Products, Quotations, Invoices, Contracts, Accounting, Inventory. These move the product toward Salesforce/HubSpot/ERP territory, which isn't the current goal -- add them only if real customer demand justifies it, not speculatively.

## 7. Where module documentation lives

Every module not built in a given phase gets a spec-only doc at `docs/modules/<domain>/<module>.md` (flat `docs/modules/<name>.md` only for genuinely cross-domain infrastructure, e.g. `jobs.md`) -- never a placeholder folder inside `supabase/functions/`, since there is exactly one deployable bundle and a stray README next to real controllers would look like dead scaffolding. See each module's doc for its planned data shape, endpoints, and implementation checklist.
