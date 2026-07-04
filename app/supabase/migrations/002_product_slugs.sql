-- Adds a URL-safe slug per product, e.g. "iphone-15-pro-256gb" so products
-- can have real, indexable, shareable pages at /product/[slug] instead of
-- only existing inside the client-side modal.

alter table products add column if not exists slug text;

-- Backfill existing rows: lowercase, strip non-alphanumerics to hyphens.
update products
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null;

-- Disambiguate any collisions (two products producing the same slug) by
-- appending their id to all but the first.
with dupes as (
  select id, slug,
         row_number() over (partition by slug order by id) as rn
  from products
)
update products p
set slug = p.slug || '-' || p.id
from dupes d
where p.id = d.id and d.rn > 1;

alter table products alter column slug set not null;

create unique index if not exists products_slug_idx on products (slug);

-- New products going forward: generate slug at insert time the same way
-- your scraper/API code should — see app/lib/slugify.js in the Next.js
-- project for the matching JS implementation.
