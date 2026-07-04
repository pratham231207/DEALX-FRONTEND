-- Price history: one row per (product, platform) price check.
-- Lets you build price-drop charts, "lowest price in 30 days" badges,
-- and alerting later without changing the products table's shape.

create table if not exists price_history (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references products(id) on delete cascade,
  platform     text not null check (platform in ('amazon', 'flipkart')),
  price        numeric not null,
  checked_at   timestamptz not null default now()
);

create index if not exists price_history_product_id_idx
  on price_history (product_id);

create index if not exists price_history_product_platform_time_idx
  on price_history (product_id, platform, checked_at desc);

-- Read-only for anon/authenticated; only your backend (service role,
-- bypasses RLS) should be writing to this table.
alter table price_history enable row level security;

create policy "price_history is publicly readable"
  on price_history for select
  using (true);
