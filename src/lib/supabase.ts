import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sets the RLS user context for the current request chain.
 * Must be called before any data operation.
 */
export async function setUserContext(userId: number): Promise<void> {
  await supabase.rpc('set_config', {
    setting_name:  'app.current_user_id',
    setting_value: String(userId),
    is_local:      true,
  });
}
