import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import PriceHistoryChart from "./PriceHistoryChart";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getProduct(slug) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data;
}

// ─── SEO METADATA (per-product title, description, OG tags) ────────────────
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found — DEALX INDIA" };

  const best = Math.min(
    ...[product.amazonPrice, product.flipkartPrice].filter((p) => p > 0)
  );
  const title = `${product.name} — Best Price ₹${best.toLocaleString("en-IN")} | DEALX INDIA`;
  const description = `Compare ${product.name} prices across Amazon and Flipkart. Best current price: ₹${best.toLocaleString("en-IN")}. Updated ${product.lastUpdated}.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.image ? [{ url: product.image }] : [],
      type: "website",
    },
  };
}

// So Next.js pre-renders known product pages at build time instead of
// only on first request — better for both SEO crawl speed and TTFB.
export async function generateStaticParams() {
  const { data } = await supabase.from("products").select("slug");
  return (data || []).map((p) => ({ slug: p.slug }));
}

export const revalidate = 3600; // re-check for price/content changes hourly

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const offers = [
    { platform: "Amazon", price: product.amazonPrice, link: product.amazonLink },
    { platform: "Flipkart", price: product.flipkartPrice, link: product.flipkartLink },
  ].filter((o) => o.price > 0);

  const best = offers.reduce((a, b) => (b.price < a.price ? b : a), offers[0]);
  const worst = offers.reduce((a, b) => (b.price > a.price ? b : a), offers[0]);
  const savings = worst.price - best.price;

  // JSON-LD structured data — this is what lets Google show price/rating
  // rich snippets directly in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    brand: product.brand,
    offers: offers.map((o) => ({
      "@type": "Offer",
      url: o.link,
      priceCurrency: "INR",
      price: o.price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: o.platform },
    })),
    ...(product.dealxScore > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.dealxScore,
        reviewCount: product.totalCommunityReviews || 1,
      },
    }),
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 px-4 py-8 sm:px-8 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to all deals
      </Link>

      <div className="mt-6 flex flex-col sm:flex-row gap-6">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="w-full sm:w-64 h-64 object-contain bg-gray-50 rounded-2xl border border-gray-100"
          />
        )}

        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {product.category}
          </p>
          <h1 className="text-2xl font-bold mt-1 mb-3">{product.name}</h1>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black">₹{best.price.toLocaleString("en-IN")}</span>
            <span className="text-sm text-gray-500">on {best.platform}</span>
          </div>
          {savings > 0 && (
            <p className="text-sm text-emerald-600 font-medium mb-4">
              Save ₹{savings.toLocaleString("en-IN")} vs {worst.platform}
            </p>
          )}

          <a
            href={best.link}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Buy on {best.platform} — ₹{best.price.toLocaleString("en-IN")}
          </a>

          <p className="text-xs text-gray-400 mt-3">Last checked {product.lastUpdated}</p>
        </div>
      </div>

      {/* All offers */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Compare prices</h2>
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {offers
            .sort((a, b) => a.price - b.price)
            .map((o) => (
              <a
                key={o.platform}
                href={o.link}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{o.platform}</span>
                <span className="font-semibold">₹{o.price.toLocaleString("en-IN")}</span>
              </a>
            ))}
        </div>
      </section>

      {/* Real price history — replaces the old simulated sparkline */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Price history</h2>
        <PriceHistoryChart productId={product.id} />
      </section>
    </main>
  );
}
