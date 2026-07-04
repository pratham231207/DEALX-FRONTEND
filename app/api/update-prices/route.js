import { createClient } from "@supabase/supabase-js";
import { getActiveProvider } from "@/lib/priceProviders";

// This route hits real price sources now (via whichever provider is set in
// PRICE_PROVIDER), instead of randomly jittering numbers. It's meant to be
// triggered by a scheduled job (see vercel.json) rather than by users.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = "force-dynamic"; // never cache — this must run fresh each time

export async function GET(req) {
  // Basic protection so randoms can't trigger your scraping/API usage by
  // hitting this URL. Set CRON_SECRET in your env and in vercel.json's
  // cron config header, or call this route with ?secret=... .
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fetchPrices = getActiveProvider();

  const { data: products, error } = await supabase.from("products").select("*");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const product of products) {
    const oldBest = Math.min(product.amazonPrice, product.flipkartPrice);

    let fetched;
    try {
      fetched = await fetchPrices(product);
    } catch (err) {
      console.error(`[update-prices] Failed for "${product.name}":`, err.message);
      results.push({ product: product.name, status: "error", message: err.message });
      continue;
    }

    // Only overwrite a price if the provider actually returned one — a
    // failed/partial fetch shouldn't wipe out a known-good price.
    const newAmazon = fetched.amazonPrice ?? product.amazonPrice;
    const newFlipkart = fetched.flipkartPrice ?? product.flipkartPrice;
    const newBest = Math.min(newAmazon, newFlipkart);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        previousPrice: oldBest,
        amazonPrice: newAmazon,
        flipkartPrice: newFlipkart,
        lastUpdated: new Date().toLocaleTimeString(),
      })
      .eq("id", product.id);

    if (updateError) {
      results.push({ product: product.name, status: "error", message: updateError.message });
      continue;
    }

    // Log to price_history for charts/alerts later. Best-effort — don't
    // fail the whole run if this insert has an issue.
    const historyRows = [];
    if (fetched.amazonPrice != null) {
      historyRows.push({ product_id: product.id, platform: "amazon", price: fetched.amazonPrice });
    }
    if (fetched.flipkartPrice != null) {
      historyRows.push({ product_id: product.id, platform: "flipkart", price: fetched.flipkartPrice });
    }
    if (historyRows.length) {
      const { error: historyError } = await supabase.from("price_history").insert(historyRows);
      if (historyError) {
        console.error(`[update-prices] price_history insert failed for "${product.name}":`, historyError.message);
      }
    }

    results.push({ product: product.name, status: "ok", newBest });
  }

  return Response.json({ success: true, checked: results.length, results });
}
