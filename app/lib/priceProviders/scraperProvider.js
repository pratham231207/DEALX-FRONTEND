// ─── SCRAPER PROVIDER (bridge, until Amazon/Flipkart APIs are approved) ───
//
// Wire your existing scraper(s) in here. This file is the ONLY place that
// needs to know your scraper's function signature — everything else in the
// app just calls fetchPrices(product) and gets { amazonPrice, flipkartPrice }.
//
// Two things worth keeping in mind while this is the active provider:
//  1. Scraping Amazon/Flipkart pages is against both platforms' Terms of
//     Service. Treat this strictly as a temporary bridge, not the
//     long-term source — swap PRICE_PROVIDER the moment you're approved.
//  2. Space out requests. Hammering every product back-to-back is the
//     fastest way to get IP-blocked or CAPTCHA'd. The delay below is a
//     starting point, not a guarantee.

// TODO: replace these two imports with your actual scraper functions.
// e.g. import { scrapeAmazonPrice } from "@/scrapers/amazon";
//      import { scrapeFlipkartPrice } from "@/scrapers/flipkart";
async function scrapeAmazonPrice(url) {
  throw new Error("scrapeAmazonPrice not wired up yet — plug in your scraper here");
}
async function scrapeFlipkartPrice(url) {
  throw new Error("scrapeFlipkartPrice not wired up yet — plug in your scraper here");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Small jittered delay so a batch run doesn't fire every request at once.
async function politeDelay() {
  const ms = 800 + Math.random() * 700; // 0.8–1.5s
  await sleep(ms);
}

export async function fetchPrices(product) {
  const result = { amazonPrice: null, flipkartPrice: null };

  if (product.amazonLink) {
    try {
      await politeDelay();
      result.amazonPrice = await scrapeAmazonPrice(product.amazonLink);
    } catch (err) {
      console.error(`[scraperProvider] Amazon fetch failed for "${product.name}":`, err.message);
    }
  }

  if (product.flipkartLink) {
    try {
      await politeDelay();
      result.flipkartPrice = await scrapeFlipkartPrice(product.flipkartLink);
    } catch (err) {
      console.error(`[scraperProvider] Flipkart fetch failed for "${product.name}":`, err.message);
    }
  }

  return result;
}
