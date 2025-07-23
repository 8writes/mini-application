import { createClient } from "@supabase/supabase-js";

export const billzpaddiAuth = createClient(
  process.env.SUPABASE_URL_I,
  process.env.SUPABASE_SRV_I,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
