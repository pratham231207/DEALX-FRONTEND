import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const { data, error } = await supabase
    .from("clicks")
    .select("productName, created_at");

  if (error) {
    return Response.json({ error: error.message });
  }

  const now = new Date();

  const recentCounts = {};

  data.forEach((item) => {
    const clickTime = new Date(item.created_at);
    const diff = (now - clickTime) / 1000; // seconds

    if (diff < 300) { // last 5 minutes
      recentCounts[item.productName] =
        (recentCounts[item.productName] || 0) + 1;
    }
  });

  return Response.json(recentCounts);
}