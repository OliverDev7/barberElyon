create table if not exists public.reservation_reminders (
  reservation_id uuid primary key references public.reservations(id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.reservation_reminders enable row level security;

revoke all on public.reservation_reminders from anon, authenticated;
grant all on public.reservation_reminders to service_role;