import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<any, "public", any>;

declare global {
  // eslint-disable-next-line no-var
  var __supabaseAdminClient__: AdminClient | undefined;
}

export type SupabaseAdminClient = AdminClient;

export const getSupabaseAdminClient = (): AdminClient => {
  if (globalThis.__supabaseAdminClient__) {
    return globalThis.__supabaseAdminClient__;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
  }

  const client = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

globalThis.__supabaseAdminClient__ = client;
  return client;
};

export {};
