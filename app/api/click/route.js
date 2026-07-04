import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const body = await req.json();

  const { error } = await supabase
    .from("clicks")
    .insert([body]);

  if (error) {
    return Response.json({ error: error.message });
  }

  return Response.json({ success: true });
}