revoke execute on function public.buscar_padron_por_cedula(numeric) from public;
revoke execute on function public.buscar_padron_por_cedula(numeric) from anon;
grant execute on function public.buscar_padron_por_cedula(numeric) to authenticated;
grant execute on function public.buscar_padron_por_cedula(numeric) to service_role;
