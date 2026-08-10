alter table business_settings
add column if not exists whatsapp_phone text not null default '+56975305607';

update business_settings
set
  address = 'Arturo Prat Arturo Prat 601, Melipilla, Chile Piso 2, Melipilla, Melipilla, Chile',
  location_city = 'Melipilla, Chile',
  google_maps_embed_url = 'https://www.google.com/maps?q=Arturo%20Prat%20601%20Piso%202%2C%20Melipilla%2C%20Chile&output=embed',
  whatsapp_phone = '+56975305607',
  updated_at = now()
where business_name = 'ELYON BARBER';
