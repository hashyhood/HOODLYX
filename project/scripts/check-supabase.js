/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const randomUserId = '00000000-0000-0000-0000-000000000000';
  const { data, error } = await supabase.rpc('get_follow_counts', { user_id: randomUserId });
  if (error) {
    console.error('RPC error:', error.message);
    process.exit(2);
  }
  console.log('RPC ok. counts =', data);
}

main().catch((e) => {
  console.error('Script error:', e);
  process.exit(3);
});
