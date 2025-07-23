import { createClient } from "@supabase/supabase-js";

export const billzpaddi = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_I,
  process.env.NEXT_PUBLIC_SUPABASE_KEY_I
);
