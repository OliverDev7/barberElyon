create table if not exists customer_reviews (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) >= 3),
  email text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null check (char_length(trim(review_text)) >= 10),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists customer_reviews_created_at_idx on customer_reviews (created_at desc);
create index if not exists customer_reviews_approved_created_at_idx on customer_reviews (approved, created_at desc);

alter table customer_reviews enable row level security;

drop policy if exists "Public can read approved customer reviews" on customer_reviews;
create policy "Public can read approved customer reviews"
on customer_reviews
for select
using (approved = true);
