-- The `vault` schema isn't exposed via PostgREST (Supabase deliberately keeps it out of the REST
-- API's exposed-schemas list), so even the service-role JS client can't call `vault.create_secret`
-- or select `vault.decrypted_secrets` directly via `.rpc()`/`.from()`. These SECURITY DEFINER
-- wrapper functions in `public` bridge that gap -- the standard Supabase pattern for using Vault
-- from application code rather than a direct Postgres connection.
--
-- These are deliberately NOT granted to `authenticated`/`anon`/PUBLIC -- only `service_role` may
-- call them, since none of them re-check tenant ownership of the secret_id internally (that check
-- happens one layer up, in channels.repository.ts, which only ever calls these with a secret_id it
-- already confirmed belongs to the caller's workspace via a normal RLS-scoped read first).
create or replace function public.channel_connection_set_secret(p_secret_value text, p_name text, p_description text default '')
returns uuid
language plpgsql security definer set search_path = public, vault as $$
declare
  v_secret_id uuid;
begin
  select vault.create_secret(p_secret_value, p_name, p_description) into v_secret_id;
  return v_secret_id;
end;
$$;

create or replace function public.channel_connection_update_secret(p_secret_id uuid, p_new_value text)
returns void
language plpgsql security definer set search_path = public, vault as $$
begin
  perform vault.update_secret(p_secret_id, p_new_value);
end;
$$;

create or replace function public.channel_connection_get_secret(p_secret_id uuid)
returns text
language plpgsql security definer set search_path = public, vault as $$
declare
  v_value text;
begin
  select decrypted_secret into v_value from vault.decrypted_secrets where id = p_secret_id;
  return v_value;
end;
$$;

revoke execute on function public.channel_connection_set_secret(text, text, text) from public;
revoke execute on function public.channel_connection_update_secret(uuid, text) from public;
revoke execute on function public.channel_connection_get_secret(uuid) from public;

grant execute on function public.channel_connection_set_secret(text, text, text) to service_role;
grant execute on function public.channel_connection_update_secret(uuid, text) to service_role;
grant execute on function public.channel_connection_get_secret(uuid) to service_role;
