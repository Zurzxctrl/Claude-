-- unheard: global leaderboard schema for Supabase.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Also enable anonymous sign-ins: Authentication → Sign In / Providers → "Allow anonymous sign-ins".

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  avatar smallint not null default 0 check (avatar between 0 and 63),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rounds (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  points smallint not null check (points between 0 and 15),
  won boolean not null,
  genre text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create index if not exists rounds_created_at_idx on public.rounds (created_at desc);
create index if not exists rounds_player_idx on public.rounds (player_id, created_at desc);

alter table public.players enable row level security;
alter table public.rounds enable row level security;

drop policy if exists "players are public" on public.players;
create policy "players are public" on public.players for select using (true);

drop policy if exists "insert own player" on public.players;
create policy "insert own player" on public.players for insert with check (auth.uid() = id);

drop policy if exists "update own player" on public.players;
create policy "update own player" on public.players for update using (auth.uid() = id) with check (auth.uid() = id);

-- Rounds are written only through submit_round(), which validates them.
drop policy if exists "read own rounds" on public.rounds;
create policy "read own rounds" on public.rounds for select using (auth.uid() = player_id);

create or replace function public.submit_round(p_points int, p_won boolean, p_genre text, p_difficulty text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  max_points int;
  last_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  max_points := 5 * case p_difficulty when 'easy' then 1 when 'medium' then 2 when 'hard' then 3 else 0 end;
  if max_points = 0 or p_points < 0 or p_points > max_points or (not p_won and p_points <> 0) then
    raise exception 'invalid round';
  end if;

  -- A round takes at least a few seconds to play; reject bursts.
  select max(created_at) into last_at from rounds where player_id = auth.uid();
  if last_at is not null and last_at > now() - interval '3 seconds' then
    raise exception 'too many rounds';
  end if;

  insert into rounds (player_id, points, won, genre, difficulty)
  values (auth.uid(), p_points, p_won, left(p_genre, 32), p_difficulty);
end;
$$;

create or replace function public.get_leaderboard(p_period text default 'week', p_country text default null, p_limit int default 50)
returns table (player_id uuid, name text, country text, avatar smallint, points bigint, rank bigint)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select r.player_id, sum(r.points)::bigint as points
    from rounds r
    where p_period = 'all' or r.created_at >= date_trunc('week', now())
    group by r.player_id
  )
  select p.id, p.name, p.country, p.avatar, s.points, rank() over (order by s.points desc)
  from scored s
  join players p on p.id = s.player_id
  where p_country is null or p.country = p_country
  order by s.points desc, p.created_at asc
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.get_my_rank(p_period text default 'week', p_country text default null)
returns table (rank bigint, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select r.player_id, sum(r.points)::bigint as points
    from rounds r
    where p_period = 'all' or r.created_at >= date_trunc('week', now())
    group by r.player_id
  ),
  ranked as (
    select s.player_id, s.points, rank() over (order by s.points desc) as rank
    from scored s
    join players p on p.id = s.player_id
    where p_country is null or p.country = p_country
  )
  select ranked.rank, ranked.points from ranked where ranked.player_id = auth.uid();
$$;

create or replace function public.delete_me()
returns void
language sql
security definer
set search_path = public
as $$
  delete from players where id = auth.uid();
$$;

revoke all on function public.submit_round(int, boolean, text, text) from public;
revoke all on function public.delete_me() from public;
grant execute on function public.submit_round(int, boolean, text, text) to authenticated;
grant execute on function public.delete_me() to authenticated;
grant execute on function public.get_leaderboard(text, text, int) to anon, authenticated;
grant execute on function public.get_my_rank(text, text) to anon, authenticated;
