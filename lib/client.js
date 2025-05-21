import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_I;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY_I;

export const billzpaddi = createClient(supabaseUrl, supabaseKey);
