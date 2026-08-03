set statement_timeout = 0;

create index if not exists user_profiles_created_by_idx
  on public.user_profiles (created_by);

create or replace function public.enforce_admin_distrital_user_creation_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_id uuid;
  creator_role text;
  created_count integer;
begin
  creator_id := coalesce(auth.uid(), new.created_by);

  if creator_id is null then
    return new;
  end if;

  select profile.role
    into creator_role
  from public.user_profiles as profile
  where profile.auth_user_id = creator_id
    and profile.estado = 'activo'
  for update;

  if creator_role is distinct from 'admin_distrital' then
    return new;
  end if;

  new.created_by := creator_id;

  select count(*)
    into created_count
  from public.user_profiles as profile
  where profile.created_by = creator_id;

  if created_count >= 10 then
    raise exception 'Este Admin distrital ya alcanzo el limite de 10 usuarios creados.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admin_distrital_user_creation_limit on public.user_profiles;

create trigger trg_admin_distrital_user_creation_limit
before insert on public.user_profiles
for each row
execute function public.enforce_admin_distrital_user_creation_limit();

revoke all on function public.enforce_admin_distrital_user_creation_limit() from public;
grant execute on function public.enforce_admin_distrital_user_creation_limit() to authenticated;
grant execute on function public.enforce_admin_distrital_user_creation_limit() to service_role;

comment on function public.enforce_admin_distrital_user_creation_limit() is
  'Impide que un Admin distrital cree mas de 10 perfiles operativos.';

notify pgrst, 'reload schema';
