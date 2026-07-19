drop policy if exists "Perfiles activos pueden leer candidatos" on public.candidatos;

create policy "Perfiles activos pueden leer candidatos"
  on public.candidatos
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.user_profiles as profile
      where profile.auth_user_id = auth.uid()
        and profile.estado = 'activo'
        and profile.role = 'referente'
        and public.candidatos.activo = true
        and upper(trim(coalesce(public.candidatos.departamento, ''))) = upper(trim(profile.departamento))
        and upper(trim(coalesce(public.candidatos.ciudad, ''))) = upper(trim(profile.ciudad))
    )
  );

comment on policy "Perfiles activos pueden leer candidatos" on public.candidatos is
  'Admin ve todos. Referente activo solo ve candidatos activos de su departamento y ciudad operativa.';
