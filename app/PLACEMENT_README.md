# Where each piece goes in your project

your-project/
├── app/                          ← replace your existing `app` folder with this one
│   ├── api/
│   │   ├── click/route.js
│   │   ├── products/route.js
│   │   ├── recent-clicks/route.js
│   │   ├── trending/route.js
│   │   ├── update-prices/route.js       (real prices via provider, not random)
│   │   └── price-history/[productId]/route.js   (NEW: feeds the real chart)
│   ├── lib/
│   │   ├── slugify.js                   (NEW: matches the SQL slug logic)
│   │   └── priceProviders/              (swappable price-source layer)
│   │       ├── index.js
│   │       ├── scraperProvider.js
│   │       ├── amazonProvider.js
│   │       └── flipkartProvider.js
│   ├── product/[slug]/                  (NEW: real, indexable product pages)
│   │   ├── page.js                      (SEO metadata + JSON-LD + real price history)
│   │   └── PriceHistoryChart.js         (client component, no new dependencies)
│   ├── sitemap.js                       (NEW: auto-lists homepage + every product)
│   ├── robots.js                        (NEW: points crawlers at the sitemap)
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.js
│   └── page.js                          (small edits: share now shares the
│                                          product page URL, not a raw affiliate
│                                          link; modal links to the new page)
│
├── vercel.json                  ← project ROOT, not inside app/
│
└── supabase/
    └── migrations/
        ├── 001_price_history.sql        ← run in Supabase SQL editor
        └── 002_product_slugs.sql        ← NEW, run this too (adds+backfills
                                            the `slug` column product pages
                                            and the sitemap rely on)

Run migrations in order: 001 before 002.

Your Python scrapers still live entirely outside this folder — see the
separate dealx-price-scrapers.zip and its README. No change there.
