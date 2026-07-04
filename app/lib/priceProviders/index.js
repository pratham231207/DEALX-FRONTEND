// ─── PRICE PROVIDER REGISTRY ───────────────────────────────────────────────
//
// Every provider implements the same shape:
//
//   async function fetchPrices(product) -> {
//     amazonPrice:   number | null,   // null = couldn't fetch, leave unchanged
//     flipkartPrice: number | null,
//   }
//
// `product` is a row from the `products` table (has amazonLink, flipkartLink,
// amazonPrice, flipkartPrice, etc).
//
// Swap providers by changing PRICE_PROVIDER in your env — no other code
// in the app needs to change.
//
//   PRICE_PROVIDER=scraper   -> your existing scraper (today)
//   PRICE_PROVIDER=amazonPA  -> Amazon Product Advertising API (after 3 sales)
//   PRICE_PROVIDER=flipkart  -> Flipkart Affiliate API (after approval)
//   PRICE_PROVIDER=mixed     -> Flipkart via official API, Amazon via scraper
//                               (useful since Flipkart approval has no sales
//                               gate, so it'll likely be ready first)

import { fetchPrices as scraperFetch } from "./scraperProvider";
import { fetchPrices as amazonFetch } from "./amazonProvider";
import { fetchPrices as flipkartFetch } from "./flipkartProvider";

async function mixedFetch(product) {
  const [amz, fk] = await Promise.all([
    amazonFetch(product).catch(() => ({ amazonPrice: null })),
    flipkartFetch(product).catch(() => ({ flipkartPrice: null })),
  ]);
  return {
    amazonPrice: amz.amazonPrice,
    flipkartPrice: fk.flipkartPrice,
  };
}

const PROVIDERS = {
  scraper: scraperFetch,
  amazonPA: amazonFetch,
  flipkart: flipkartFetch,
  mixed: mixedFetch,
};

export function getActiveProvider() {
  const key = process.env.PRICE_PROVIDER || "scraper";
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(
      `Unknown PRICE_PROVIDER "${key}". Valid options: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  return provider;
}
