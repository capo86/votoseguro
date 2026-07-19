drop policy if exists "Equipo autenticado puede actualizar voto seguro" on public.votoseguro;
create policy "Equipo autenticado puede actualizar voto seguro propio"
  on public.votoseguro
  for update
  to authenticated
  using (loaded_by = auth.uid())
  with check (loaded_by = auth.uid());

drop policy if exists "Equipo autenticado puede eliminar voto seguro" on public.votoseguro;
create policy "Equipo autenticado puede eliminar voto seguro propio"
  on public.votoseguro
  for delete
  to authenticated
  using (loaded_by = auth.uid());
