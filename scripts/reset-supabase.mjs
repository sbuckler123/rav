/**
 * Truncates all data tables — run this before re-running import if the first run partially failed.
 * Usage: node scripts/reset-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Order matters — children first (FK dependencies)
const TABLES = ['answers', 'gallery', 'questions', 'shiurim', 'videos', 'articles', 'events', 'users', 'categories'];

for (const t of TABLES) {
  const { error } = await sb.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.error(`❌ ${t}:`, error.message);
  else console.log(`✓ Cleared ${t}`);
}
console.log('\n✅ All tables cleared.');
