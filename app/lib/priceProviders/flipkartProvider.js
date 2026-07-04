// ─── FLIPKART PROVIDER (Affiliate API 1.0) ─────────────────────────────────
//
// Heads up: Flipkart paused DIRECT public affiliate signups back in 2018
// and hasn't reopened them. New affiliates generally go through approved
// intermediary networks (Cuelinks, vCommission, etc.) instead — but those
// give you trackable checkout LINKS, not the Affiliate Tracking ID + API
// Token this file needs for live price/feed access. So in practice, this
// provider may simply be unreachable for a new site right now.
//
// Given that, PRICE_PROVIDER for Flipkart will likely stay "scraper" (see
// scraperProvider.js) for the foreseeable future — this file is here for
// the day Flipkart reopens direct registration, or if you land a direct
// relationship some other way. Not something to build around happening
// soon.
//
// If you DO get direct access:
//   1. Register at https://affiliate.flipkart.com/registerme
//   2. Go to API > API Token in the affiliate dashboard, generate your
//      Affiliate Tracking ID + API Token.
//
// Required env vars:
//   FLIPKART_AFFILIATE_ID
//   FLIPKART_AFFILIATE_TOKEN
//
// Rate limit: 20 calls/second per Flipkart's API Terms of Use — batch
// product lookups don't need per-request delays the way scraping does.
//
// Product identity note: the Flipkart Affiliate API returns category feeds
// (bulk JSON dumps), not single-product lookups by URL. The practical
// pattern is: pull the relevant category feed periodically, then match
// products by Flipkart product ID (the last path segment before the query
// string in a flipkart.com product URL) rather than re-fetching per item.

export async function fetchPrices(product) {
  const id = process.env.FLIPKART_AFFILIATE_ID;
  const token = process.env.FLIPKART_AFFILIATE_TOKEN;

  if (!id || !token) {
    console.warn("[flipkartProvider] Missing FLIPKART_AFFILIATE_ID/TOKEN — skipping");
    return { flipkartPrice: null };
  }

  // TODO once approved: fetch the category feed for this product (see note
  // above) and look up product.flipkartProductId within it, rather than
  // making one request per product. Example shape:
  //
  // const res = await fetch(categoryFeedUrl, {
  //   headers: {
  //     "Fk-Affiliate-Id": id,
  //     "Fk-Affiliate-Token": token,
  //   },
  // });
  // const feed = await res.json();
  // const match = feed.productInfoList.find(
  //   (p) => p.productBaseInfoV1.productId === product.flipkartProductId
  // );
  // const price = match?.productBaseInfoV1?.flipkartSpecialPrice?.amount ?? null;
  // return { flipkartPrice: price };

  throw new Error("flipkartProvider not wired up yet — waiting on affiliate approval");
}
