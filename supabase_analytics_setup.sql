create extension if not exists "pgcrypto";

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  listing_id uuid null,
  session_id text not null,
  constraint app_events_event_type_check check (
    event_type in (
      'lease_analyzed',
      'clause_explained',
      'question_asked',
      'exit_listing_created',
      'exit_listing_viewed'
    )
  )
);

create index if not exists app_events_created_at_idx
  on public.app_events (created_at desc);

create index if not exists app_events_event_type_idx
  on public.app_events (event_type);

create index if not exists app_events_listing_id_idx
  on public.app_events (listing_id);

alter table public.app_events enable row level security;

create policy "Allow public insert" on public.app_events
  for insert to anon, authenticated
  with check (true);

create or replace function public.get_app_stats()
returns table (
  leases_analyzed bigint,
  listings_created bigint,
  listings_viewed bigint
)
language sql
security definer
as $$
  select
    count(*) filter (where event_type = 'lease_analyzed') as leases_analyzed,
    count(*) filter (where event_type = 'exit_listing_created') as listings_created,
    count(*) filter (where event_type = 'exit_listing_viewed') as listings_viewed
  from public.app_events;
$$;

grant execute on function public.get_app_stats() to anon, authenticated;
