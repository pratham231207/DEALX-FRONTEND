import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://weymsprdagvwqrpdyveb.supabase.co";
const supabaseKey = "sb_publishable_P-Rk9MDlgQHJNHEW_UD2Cw_ZRLZN8LS";

export const supabase = createClient(supabaseUrl, supabaseKey);