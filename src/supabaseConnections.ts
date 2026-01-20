import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type GmailTokens = Record<string, any>;

export type GmailConnection = {
  id: string;
  user_id: string;
  email: string;
  tokens: GmailTokens;
  history_id: string | null;
  watch_expiration: string | null;
};

/**
 * Create a Supabase admin client for background work.
 */
export function createSupabaseClient(
  supabaseUrl: string,
  serviceRoleKey: string
): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Normalize email casing for stable comparisons.
 */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Merge refreshed token fields while preserving refresh tokens.
 */
export function mergeTokens(existing: GmailTokens, next: GmailTokens): GmailTokens {
  const merged = { ...existing, ...next };
  if (!merged.refresh_token && existing?.refresh_token) {
    merged.refresh_token = existing.refresh_token;
  }
  return merged;
}

/**
 * Check whether persisted tokens differ from new credentials.
 */
export function tokensChanged(existing: GmailTokens, next: GmailTokens): boolean {
  const keys = [
    "access_token",
    "refresh_token",
    "expiry_date",
    "scope",
    "token_type",
    "id_token",
  ];
  return keys.some((key) => (existing?.[key] ?? null) !== (next?.[key] ?? null));
}

/**
 * Persist token updates only when refresh tokens rotate.
 */
export async function persistTokensIfChanged(
  supabase: SupabaseClient,
  connection: GmailConnection,
  nextTokens: GmailTokens
) {
  const merged = mergeTokens(connection.tokens, nextTokens);
  if (!tokensChanged(connection.tokens, merged)) {
    return connection;
  }
  const { data, error } = await supabase
    .from("gmail_connections")
    .update({ tokens: merged })
    .eq("id", connection.id)
    .select("*")
    .single();
  if (error) {
    console.warn("Failed to persist refreshed tokens:", error);
    return connection;
  }
  return data as GmailConnection;
}

/**
 * Fetch all Gmail connection records from Supabase.
 */
export async function fetchConnections(
  supabase: SupabaseClient
): Promise<GmailConnection[]> {
  const { data, error } = await supabase.from("gmail_connections").select("*");
  if (error) {
    throw new Error(`Failed to fetch gmail_connections: ${error.message}`);
  }
  return (data ?? []) as GmailConnection[];
}

/**
 * Load a Gmail connection by normalized email address.
 */
export async function fetchConnectionByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<GmailConnection | null> {
  const { data, error } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to fetch gmail_connections: ${error.message}`);
  }
  return (data as GmailConnection) ?? null;
}

/**
 * Update a Gmail connection with new metadata.
 */
export async function updateConnection(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<GmailConnection>
) {
  const { error } = await supabase.from("gmail_connections").update(updates).eq("id", id);
  if (error) {
    throw new Error(`Failed to update gmail_connections: ${error.message}`);
  }
}
