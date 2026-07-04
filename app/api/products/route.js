import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json(data);
}
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);