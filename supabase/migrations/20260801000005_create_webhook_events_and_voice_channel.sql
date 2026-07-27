-- Provider-agnostic messaging architecture, part 6/6.
-- webhook_events: internal/ops log of every raw inbound webhook call (regardless of whether it's a
-- message, a status update, or something unrecognized) -- idempotency, debugging, and reprocessing
-- if parsing logic had a bug. No RLS policies for authenticated/anon at all (default-deny) -- this
-- is not a workspace-facing table, only ever touched via the service-role client inside the
-- webhook handler.
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  channel_type text not null references public.channel_types(code),
  channel_connection_id uuid references public.channel_connections(id),
  tenant_id uuid references public.tenants(id), -- nullable: null if account resolution failed
  provider_event_id text,
  payload jsonb not null,
  headers jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'failed', 'ignored')),
  processing_error text,
  received_at timestamptz not null default now()
);

create index idx_webhook_events_tenant_id on public.webhook_events (tenant_id, received_at desc);
create index idx_webhook_events_provider_event_id on public.webhook_events (channel_connection_id, provider_event_id);

alter table public.webhook_events enable row level security;
-- Deliberately no select/insert/update policies for authenticated or anon -- service-role bypasses
-- RLS entirely, which is the only way this table is ever touched.

-- Voice joins the channel list (the user's target channel set is WhatsApp/Email/SMS/Voice/
-- Instagram/Messenger; every other channel_type already existed from Phase 1).
insert into public.channel_types (code, label, sort_order) values
  ('voice', 'Voice', 45)
on conflict (code) do nothing;
