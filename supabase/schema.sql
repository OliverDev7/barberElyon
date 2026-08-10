create extension if not exists "pgcrypto";

create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'ELYON BARBER',
  barber_name text not null default 'Barbero Alonso Salinas',
  location_city text not null default 'Melipilla, Chile',
  address text not null default 'Melipilla, Chile',
  google_maps_embed_url text not null default 'https://www.google.com/maps?q=Melipilla%2C%20Chile&output=embed',
  whatsapp_phone text not null default '+56975305607',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price integer not null check (price >= 0),
  description text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists availability_days (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null unique check (day_of_week between 0 and 6),
  active boolean not null default true,
  label text not null
);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6),
  time_24 time not null,
  period text not null check (period in ('morning', 'afternoon', 'night')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(day_of_week, time_24)
);

create table if not exists blocked_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_24 time not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(date, time_24)
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  service_price integer not null,
  service_duration_minutes integer not null,
  reservation_date date not null,
  reservation_time time not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  observations text,
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled')),
  created_at timestamptz not null default now(),
  unique(reservation_date, reservation_time)
);

insert into business_settings (business_name, barber_name, location_city, address, google_maps_embed_url, whatsapp_phone)
select 'ELYON BARBER', 'Barbero Alonso Salinas', 'Melipilla, Chile', 'Arturo Prat Arturo Prat 601, Melipilla, Chile Piso 2, Melipilla, Melipilla, Chile', 'https://www.google.com/maps?q=Arturo%20Prat%20601%20Piso%202%2C%20Melipilla%2C%20Chile&output=embed', '+56975305607'
where not exists (select 1 from business_settings);

insert into services (name, duration_minutes, price, description, sort_order)
values
  ('Corte de cabello', 60, 12000, 'Incluye perfilado de cejas', 1),
  ('Corte de cabello + barba', 90, 18000, 'Corte de cabello + arreglo de barba y perfilado de cejas', 2),
  ('Decoloracion global', 180, 70000, 'Decoloracion total, incluye corte de cabello', 3),
  ('Visos color', 180, 50000, 'Visos o mechas, incluye corte de cabello', 4)
on conflict do nothing;

insert into availability_days (day_of_week, active, label)
values
  (0, false, 'Domingo'),
  (1, true, 'Lunes'),
  (2, true, 'Martes'),
  (3, true, 'Miercoles'),
  (4, true, 'Jueves'),
  (5, true, 'Viernes'),
  (6, true, 'Sabado')
on conflict (day_of_week) do nothing;

insert into availability_slots (day_of_week, time_24, period)
select d.day_of_week, s.time_24::time, s.period
from availability_days d
cross join (
  values
    ('09:00', 'morning'),
    ('10:00', 'morning'),
    ('12:00', 'afternoon'),
    ('13:00', 'afternoon'),
    ('14:00', 'afternoon'),
    ('15:00', 'afternoon'),
    ('16:00', 'afternoon'),
    ('18:00', 'night'),
    ('19:00', 'night')
) as s(time_24, period)
where d.day_of_week between 1 and 6
on conflict (day_of_week, time_24) do nothing;
