# DealX India — Price Comparison Platform

> Compare live Amazon & Flipkart prices, track price history, and find the best deal across India's two biggest e-commerce platforms.

---

## What it does

DealX is a full-stack Next.js price comparison platform that:

- **Compares Amazon vs Flipkart prices** side by side for 45+ product categories
- **Shows price history charts** so you can see if a "deal" is actually a discount
- **Calculates a DealX Trust Score** — a weighted cross-platform community rating from combined Amazon + Flipkart reviews
- **Watchlist** — users can sign in and save products to track
- **Trending section** — surfaces the most-clicked products in real time
- **SEO-optimised product pages** with per-product OG tags, JSON-LD structured data (Google rich snippets), auto-generated sitemap, and ISR (revalidates every hour)
- **Haptic feedback** on mobile for a native app feel
- **Dark/light mode** with Apple-style spring animations via Framer Motion

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Price data | Custom Python scrapers (see dealx-scrapers repo) |
| Deployment | Vercel |

---

## Project structure

```
app/
├── page.js                        # Homepage — search, filters, product grid
├── product/[slug]/
│   ├── page.js                    # Product detail — price comparison + JSON-LD
│   └── PriceHistoryChart.js       # Interactive price history chart
├── api/
│   ├── products/route.js          # Fetch all products
│   ├── trending/route.js          # Trending products by click count
│   ├── click/route.js             # Track affiliate link clicks
│   ├── recent-clicks/route.js     # Recently clicked products
│   ├── price-history/[id]/route.js# Price history for a product
│   └── update-prices/route.js     # Cron-triggered price refresh
├── lib/
│   └── priceProviders/            # Amazon + Flipkart price provider modules
├── supabase/migrations/           # SQL migrations for price history + slugs
├── robots.js                      # SEO robots config
└── sitemap.js                     # Auto-generated sitemap from Supabase
```

---

## Getting started

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

```bash
git clone https://github.com/pratham231207/dealx-web.git
cd dealx-web

npm install

cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL        — Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   — Your Supabase anon key
```

### Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### Supabase migrations

Run the SQL files in order to set up price history and product slugs:

```
app/supabase/migrations/001_price_history.sql
app/supabase/migrations/002_product_slugs.sql
```

---

## Related repos

- [dealx-scrapers](https://github.com/pratham231207/dealx-bot) — Python scrapers that populate the Supabase products table with live Amazon & Flipkart prices

---

## Built by

Pratham — [GitHub](https://github.com/pratham231207)
