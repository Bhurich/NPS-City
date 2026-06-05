create table if not exists public.game_rooms (
  room_code text primary key,
  city_name text not null,
  game_state text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  player_count integer not null default 1
);

alter table public.game_rooms enable row level security;

create or replace function public.update_game_rooms_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists game_rooms_updated_at on public.game_rooms;

create trigger game_rooms_updated_at
  before update on public.game_rooms
  for each row
  execute function public.update_game_rooms_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'game_rooms'
      and policyname = 'Anyone can read game rooms'
  ) then
    create policy "Anyone can read game rooms"
      on public.game_rooms
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'game_rooms'
      and policyname = 'Anyone can create game rooms'
  ) then
    create policy "Anyone can create game rooms"
      on public.game_rooms
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'game_rooms'
      and policyname = 'Anyone can update game rooms'
  ) then
    create policy "Anyone can update game rooms"
      on public.game_rooms
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
