-- Im Supabase SQL Editor ausführen.
-- WICHTIG: DEINE_EMAIL@BEISPIEL.DE durch die E-Mail deines Supabase-Login-Kontos ersetzen.
create table if not exists public.map_state (
 id integer primary key check (id = 1),
 countries text[] not null default '{}',
 updated_at timestamptz not null default now()
);
insert into public.map_state(id,countries) values (1,'{}') on conflict (id) do nothing;
alter table public.map_state enable row level security;
drop policy if exists "Alle dürfen die Karte lesen" on public.map_state;
create policy "Alle dürfen die Karte lesen" on public.map_state for select to anon,authenticated using (true);
drop policy if exists "Nur Besitzer darf aktualisieren" on public.map_state;
create policy "Nur Besitzer darf aktualisieren" on public.map_state for update to authenticated
 using ((auth.jwt() ->> 'email') = 'DEINE_EMAIL@BEISPIEL.DE')
 with check ((auth.jwt() ->> 'email') = 'DEINE_EMAIL@BEISPIEL.DE');
grant select on public.map_state to anon,authenticated;
grant update on public.map_state to authenticated;
