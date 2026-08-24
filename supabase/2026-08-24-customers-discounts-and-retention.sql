-- ELYON BARBER
-- Customer normalization, service discounts and 12-month reservation retention.
-- Safe to run after the existing Supabase schema/migrations.

alter table public.services add column if not exists discount_price integer, add column if not exists discount_active boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_discount_price_nonnegative' and conrelid = 'public.services'::regclass) then
    alter table public.services add constraint services_discount_price_nonnegative check (discount_price is null or discount_price >= 0);
  end if;
end $$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null,
  email text not null, phone text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists customers_email_lower_uidx on public.customers (lower(trim(email)));
create index if not exists customers_phone_idx on public.customers (phone);
alter table public.customers enable row level security;
revoke all on public.customers from anon, authenticated;
grant all on public.customers to service_role;

alter table public.reservations add column if not exists customer_id uuid references public.customers(id) on delete restrict, add column if not exists service_original_price integer;
create index if not exists reservations_customer_id_idx on public.reservations (customer_id);
create index if not exists reservations_date_idx on public.reservations (reservation_date desc);

insert into public.customers (first_name, last_name, email, phone)
select distinct on (lower(trim(r.email))) trim(r.first_name), trim(r.last_name), lower(trim(r.email)), trim(r.phone)
from public.reservations r
where trim(coalesce(r.email, '')) <> ''
order by lower(trim(r.email)), r.created_at asc, r.id
on conflict ((lower(trim(email)))) do update set first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone, updated_at = now();

update public.reservations r
set customer_id = c.id, service_original_price = coalesce(r.service_original_price, r.service_price)
from public.customers c
where lower(trim(c.email)) = lower(trim(r.email)) and r.customer_id is null;

alter table public.reservations alter column first_name drop not null;
alter table public.reservations alter column last_name drop not null;
alter table public.reservations alter column email drop not null;
alter table public.reservations alter column phone drop not null;

drop function if exists public.create_reservation_v2(text, text, integer, integer, text, text, text, text, text, text, text, text);
create or replace function public.create_reservation_v2(p_service_id text, p_service_name text, p_service_price integer, p_service_duration_minutes integer, p_reservation_date text, p_reservation_time text, p_first_name text, p_last_name text, p_email text, p_phone text, p_observations text, p_status text default 'confirmed')
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_customer_id uuid; v_service_id uuid; v_base_price integer; v_final_price integer; v_reservation_id uuid; v_email text := lower(trim(p_email)); v_phone text := trim(p_phone);
begin
  delete from public.reservations where reservation_date < (current_date - interval '12 months');
  select s.id, s.price, case when s.discount_active and s.discount_price is not null and s.discount_price < s.price then s.discount_price else s.price end into v_service_id, v_base_price, v_final_price from public.services s where s.id = p_service_id::uuid and s.active = true;
  if v_service_id is null then raise exception 'SERVICE_NOT_AVAILABLE'; end if;
  select c.id into v_customer_id from public.customers c where lower(trim(c.email)) = v_email or trim(c.phone) = v_phone order by case when lower(trim(c.email)) = v_email then 0 else 1 end limit 1;
  if v_customer_id is null then insert into public.customers (first_name, last_name, email, phone) values (trim(p_first_name), trim(p_last_name), v_email, v_phone) returning id into v_customer_id; else update public.customers set first_name = trim(p_first_name), last_name = trim(p_last_name), email = v_email, phone = v_phone, updated_at = now() where id = v_customer_id; end if;
  insert into public.reservations (service_id, service_name, service_price, service_original_price, service_duration_minutes, reservation_date, reservation_time, customer_id, observations, status) values (v_service_id, p_service_name, v_final_price, v_base_price, p_service_duration_minutes, p_reservation_date::date, p_reservation_time::time, v_customer_id, nullif(trim(p_observations), ''), coalesce(nullif(trim(p_status), ''), 'confirmed')) returning id into v_reservation_id;
  return jsonb_build_object('id', v_reservation_id, 'customer_id', v_customer_id, 'service_id', v_service_id, 'service_name', p_service_name, 'service_price', v_final_price, 'service_original_price', v_base_price, 'service_duration_minutes', p_service_duration_minutes, 'reservation_date', p_reservation_date, 'reservation_time', p_reservation_time, 'status', coalesce(nullif(trim(p_status), ''), 'confirmed'));
end;
$$;
revoke all on function public.create_reservation_v2(text, text, integer, integer, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_reservation_v2(text, text, integer, integer, text, text, text, text, text, text, text, text) to service_role;

drop function if exists public.admin_search_reservations_v2(text, integer, integer);
create or replace function public.admin_search_reservations_v2(p_search text default '', p_page integer default 1, p_page_size integer default 5)
returns table (id uuid, first_name text, last_name text, email text, phone text, service_name text, service_price integer, service_duration_minutes integer, reservation_date date, reservation_time time, observations text, status text, total_count bigint)
language sql security definer set search_path = public
as $$
  with filtered as (select r.id, c.first_name, c.last_name, c.email, c.phone, r.service_name, r.service_price, r.service_duration_minutes, r.reservation_date, r.reservation_time, r.observations, r.status, count(*) over () as total_count from public.reservations r join public.customers c on c.id = r.customer_id where nullif(trim(p_search), '') is null or lower(c.first_name || ' ' || c.last_name) like '%' || lower(trim(p_search)) || '%' or lower(c.email) like '%' || lower(trim(p_search)) || '%' or c.phone like '%' || trim(p_search) || '%' or lower(r.service_name) like '%' || lower(trim(p_search)) || '%' order by r.reservation_date desc, r.reservation_time desc offset greatest(0, (p_page - 1) * p_page_size) limit greatest(1, least(100, p_page_size))) select * from filtered;
$$;
revoke all on function public.admin_search_reservations_v2(text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_search_reservations_v2(text, integer, integer) to service_role;

drop function if exists public.admin_search_clients_v2(text, integer, integer);
create or replace function public.admin_search_clients_v2(p_search text default '', p_page integer default 1, p_page_size integer default 10)
returns table (email text, first_name text, last_name text, phone text, last_service text, last_reservation_date date, reservations_count bigint, total_count bigint)
language sql security definer set search_path = public
as $$
  with customer_rows as (select c.id, c.email, c.first_name, c.last_name, c.phone, latest.service_name as last_service, latest.reservation_date as last_reservation_date, count(r.id) filter (where r.status <> 'cancelled') as reservations_count, count(*) over () as total_count from public.customers c left join public.reservations r on r.customer_id = c.id left join lateral (select r2.service_name, r2.reservation_date, r2.reservation_time from public.reservations r2 where r2.customer_id = c.id and r2.status <> 'cancelled' order by r2.reservation_date desc, r2.reservation_time desc limit 1) latest on true where nullif(trim(p_search), '') is null or lower(c.first_name || ' ' || c.last_name) like '%' || lower(trim(p_search)) || '%' or lower(c.email) like '%' || lower(trim(p_search)) || '%' or c.phone like '%' || trim(p_search) || '%' group by c.id, c.email, c.first_name, c.last_name, c.phone, latest.service_name, latest.reservation_date, latest.reservation_time) select email, first_name, last_name, phone, last_service, last_reservation_date, reservations_count, total_count from customer_rows order by last_reservation_date desc nulls last, first_name, last_name offset greatest(0, (p_page - 1) * p_page_size) limit greatest(1, least(100, p_page_size));
$$;
revoke all on function public.admin_search_clients_v2(text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_search_clients_v2(text, integer, integer) to service_role;

create or replace function public.cleanup_old_reservations(p_keep_months integer default 12)
returns integer language plpgsql security definer set search_path = public
as $$
declare v_deleted integer;
begin delete from public.reservations where reservation_date < (current_date - make_interval(months => greatest(1, p_keep_months))); get diagnostics v_deleted = row_count; return v_deleted; end;
$$;
revoke all on function public.cleanup_old_reservations(integer) from public, anon, authenticated;
grant execute on function public.cleanup_old_reservations(integer) to service_role;