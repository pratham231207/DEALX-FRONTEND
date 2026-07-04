// ─── AMAZON PROVIDER (Product Advertising API 5.0) ─────────────────────────
//
// Not usable until:
//   1. Your Amazon Associates account has 3 qualifying sales within 180 days
//      of joining, which unlocks PA-API access.
//   2. You've generated an Access Key / Secret Key from Associates Central.
//
// PA-API requests must be signed with AWS Signature v4. Rather than
// hand-rolling that, use the official SDK once you're approved:
//   npm install paapi5-nodejs-sdk
//
// Required env vars (add to .env.local / Vercel project settings):
//   AMAZON_ACCESS_KEY
//   AMAZON_SECRET_KEY
//   AMAZON_PARTNER_TAG      (your Associates tracking ID)
//   AMAZON_HOST             ("webservices.amazon.in" for India)
//   AMAZON_REGION           ("eu-west-1" for India marketplace)
//
// ASIN note: PA-API keys products by ASIN, not URL. You'll want an `asin`
// column on `products` (extract it from the amazonLink you already store,
// e.g. the /dp/ASIN/ segment) so lookups are a single GetItems call instead
// of URL parsing.

export async function fetchPrices(product) {
  if (!product.asin) {
    console.warn(`[amazonProvider] No ASIN stored for "${product.name}" — skipping`);
    return { amazonPrice: null };
  }

  // TODO once PA-API access is granted:
  //
  // import { ApiClient, DefaultApi, GetItemsRequest, GetItemsResource, PartnerType } from "paapi5-nodejs-sdk";
  //
  // const client = ApiClient.instance;
  // client.accessKey = process.env.AMAZON_ACCESS_KEY;
  // client.secretKey = process.env.AMAZON_SECRET_KEY;
  // client.host = process.env.AMAZON_HOST;
  // client.region = process.env.AMAZON_REGION;
  //
  // const api = new DefaultApi();
  // const request = new GetItemsRequest();
  // request.PartnerTag = process.env.AMAZON_PARTNER_TAG;
  // request.PartnerType = PartnerType.ASSOCIATES;
  // request.ItemIds = [product.asin];
  // request.Resources = [GetItemsResource.OFFERS_LISTINGS_PRICE];
  //
  // const response = await api.getItems(request);
  // const price = response?.ItemsResult?.Items?.[0]?.Offers?.Listings?.[0]?.Price?.Amount ?? null;
  // return { amazonPrice: price };

  throw new Error("amazonProvider not wired up yet — waiting on PA-API approval");
}
