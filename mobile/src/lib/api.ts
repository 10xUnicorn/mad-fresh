import { supabase } from './supabase';

export { ApiError } from '@shared/api';
export * from '@shared/api';

/**
 * Get the current user's access token for authenticated API calls.
 * Returns null if not logged in.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
