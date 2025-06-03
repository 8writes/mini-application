import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_I;
const supabaseUltraSuperSecretKey = process.env.SUPABASE_SRV_I;

export const billzpaddiAuth = createClient(supabaseUrl, supabaseUltraSuperSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
