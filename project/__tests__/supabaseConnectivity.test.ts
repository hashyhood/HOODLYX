// Create a lightweight integration test to verify Supabase connectivity and key RPCs
import { createClient } from '@supabase/supabase-js';

// Skip if env not present at runtime to avoid hard failures in CI
const hasEnv = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

(describe as jest.Describe)('Supabase connectivity', () => {
  (it as jest.It)(hasEnv ? 'connects and can call RPCs' : 'skipped (no env provided)', async () => {
    if (!hasEnv) {
      // eslint-disable-next-line no-console
      console.log('Skipping integration test: missing SUPABASE_URL or SUPABASE_ANON_KEY');
      return;
    }
    const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string);

    // 2) Can run a harmless RPC that exists (get_follow_counts with a random UUID)
    const randomUserId = '00000000-0000-0000-0000-000000000000';
    const { data: counts, error: countsError } = await supabase.rpc('get_follow_counts', {
      user_id: randomUserId,
    });

    // Either returns counts or an error if function missing; both should not crash the client
    expect(countsError ?? null).toBeNull();
    expect(counts).toBeDefined();
  }, 20000);
});
