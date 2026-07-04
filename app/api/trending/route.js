import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const { data, error } = await supabase
    .from("clicks")
    .select("productName");

  if (error) {
    return Response.json({ error: error.message });
  }

  // count clicks
  const counts = {};
  data.forEach((item) => {
    counts[item.productName] = (counts[item.productName] || 0) + 1;
  });

  return Response.json(counts);
}