-- ELYON BARBER
-- Manual admin reservations, customer records without contact data, and review click aggregation.
-- Run after 2026-08-24-customers-discounts-and-retention.sql.

alter table public.customers
  alter column email drop not null,
  alter column phone drop not null;

alter table public.reservations
  add column if not exists reservation_source text not null default 'online';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reservations_reservation_source_check'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_reservation_source_check
      check (reservation_source in ('online', 'admin'));
  end if;
end $$;

create index if not exists reservations_source_idx
  on public.reservations (reservation_source, reservation_date desc);

create table if not exists public.review_click_stats (
  id boolean primary key default true check (id = true),
  total_clicks bigint not null default 0 check (total_clicks >= 0),
  updated_at timestamptz not null default now()
);

insert into public.review_click_stats (id, total_clicks)
values (true, 0)
on conflict (id) do nothing;

alter table public.review_click_stats enable row level security;
revoke all on public.review_click_stats from anon, authenticated;
grant all on public.review_click_stats to service_role;

create or replace function public.increment_review_clicks()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
begin
  update public.review_click_stats
  set total_clicks = total_clicks + 1,
      updated_at = now()
  where id = true
  returning total_clicks into v_total;

  if v_total is null then
    insert into public.review_click_stats (id, total_clicks)
    values (true, 1)
    on conflict (id) do update
      set total_clicks = public.review_click_stats.total_clicks + 1,
          updated_at = now()
    returning total_clicks into v_total;
  end if;

  return v_total;
end;
$$;

revoke all on function public.increment_review_clicks() from public, anon, authenticated;
grant execute on function public.increment_review_clicks() to service_role;
