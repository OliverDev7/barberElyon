-- Synchronize the deployed business_settings table with the application schema.
-- Safe to run in Supabase SQL Editor. Existing values are preserved where possible.

alter table if exists business_settings
  add column if not exists whatsapp_phone text;

alter table if exists business_settings
  add column if not exists address text;

alter table if exists business_settings
  add column if not exists location_city text;

alter table if exists business_settings
  add column if not exists google_maps_embed_url text;

alter table if exists business_settings
  add column if not exists barber_name text;

alter table if exists business_settings
  add column if not exists business_name text;

update business_settings
set
  business_name = coalesce(nullif(business_name, ''), 'ELYON BARBER'),
  barber_name = coalesce(nullif(barber_name, ''), 'Barbero Alonso Salinas'),
  location_city = coalesce(nullif(location_city, ''), 'Melipilla, Chile'),
  address = coalesce(nullif(address, ''), 'Arturo Prat Arturo Prat 601, Melipilla, Chile Piso 2, Melipilla, Melipilla, Chile'),
  google_maps_embed_url = coalesce(nullif(google_maps_embed_url, ''), 'https://www.google.com/maps?q=Arturo%20Prat%20601%20Piso%202%2C%20Melipilla%2C%20Chile&output=embed'),
  whatsapp_phone = coalesce(nullif(whatsapp_phone, ''), '+56975305607');

alter table business_settings
  alter column business_name set default 'ELYON BARBER',
  alter column barber_name set default 'Barbero Alonso Salinas',
  alter column location_city set default 'Melipilla, Chile',
  alter column address set default 'Arturo Prat Arturo Prat 601, Melipilla, Chile Piso 2, Melipilla, Melipilla, Chile',
  alter column google_maps_embed_url set default 'https://www.google.com/maps?q=Arturo%20Prat%20601%20Piso%202%2C%20Melipilla%2C%20Chile&output=embed',
  alter column whatsapp_phone set default '+56975305607';
