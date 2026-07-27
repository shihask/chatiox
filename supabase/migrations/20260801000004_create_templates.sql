-- Provider-agnostic messaging architecture, part 5/6.
-- Business templates split from provider templates from day one: `templates` is the channel-
-- agnostic business concept (e.g. "Welcome Message"), `channel_templates` is the WhatsApp/Email/
-- SMS-specific approved variant. This is deliberately the "Template -> ChannelTemplate" model
-- docs/modules/marketing/templates.md already documents as future Marketing scope -- built here so
-- Marketing's future campaign-sending logic references this pair rather than inventing its own.
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  purpose text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_templates_name_not_blank check (btrim(name) <> '')
);

create trigger trg_templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

alter table public.templates enable row level security;

create policy templates_select on public.templates for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy templates_insert on public.templates for insert
  with check (
    tenant_id in (select public.get_my_tenant_ids())
    and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager')
    and created_by = auth.uid()
  );

create policy templates_update on public.templates for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy templates_delete on public.templates for delete
  using (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin', 'manager'));

-- channel_templates: v1 scope is read/sync only for the provider side -- rows get populated by a
-- future "sync approved templates from Meta" action (provider.listApprovedTemplates()), not
-- authored in Chatiox's UI, since WhatsApp template approval fundamentally happens in Meta
-- Business Manager. No create/update endpoints built this pass.
create table public.channel_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  channel_connection_id uuid not null references public.channel_connections(id),
  channel_type text not null references public.channel_types(code),
  provider_template_name text not null,
  language_code text not null,
  category text,
  body text,
  variables jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  provider_template_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_channel_templates_connection_name_lang
  on public.channel_templates (tenant_id, channel_connection_id, provider_template_name, language_code);
create index idx_channel_templates_template_id on public.channel_templates (template_id);

create trigger trg_channel_templates_set_updated_at
  before update on public.channel_templates
  for each row execute function public.set_updated_at();

create or replace function public.enforce_channel_template_tenant_match()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.templates t where t.id = new.template_id and t.tenant_id = new.tenant_id
  ) then
    raise exception 'channel_templates.tenant_id must match parent template.tenant_id';
  end if;
  if not exists (
    select 1 from public.channel_connections cc where cc.id = new.channel_connection_id and cc.tenant_id = new.tenant_id
  ) then
    raise exception 'channel_templates.tenant_id must match channel_connections.tenant_id';
  end if;
  return new;
end;
$$;

create trigger trg_channel_templates_tenant_match
  before insert on public.channel_templates
  for each row execute function public.enforce_channel_template_tenant_match();

alter table public.channel_templates enable row level security;

create policy channel_templates_select on public.channel_templates for select
  using (tenant_id in (select public.get_my_tenant_ids()));

create policy channel_templates_insert on public.channel_templates for insert
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

create policy channel_templates_update on public.channel_templates for update
  using (tenant_id in (select public.get_my_tenant_ids()))
  with check (tenant_id in (select public.get_my_tenant_ids()) and public.get_my_role(tenant_id) in ('owner', 'admin'));

-- Now that channel_templates exists, wire up the forward reference left open in
-- 20260801000003_create_messages_and_attachments.sql.
alter table public.messages
  add constraint fk_messages_channel_template
  foreign key (channel_template_id) references public.channel_templates(id);
