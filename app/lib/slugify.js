// Matches the slug logic in supabase/migrations/002_product_slugs.sql —
// keep these two in sync if you ever change the algorithm.

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
