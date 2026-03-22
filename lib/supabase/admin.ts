import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client with service role key
// Used for Storage uploads and admin operations that bypass RLS
let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return adminClient;
}
