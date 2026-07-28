import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(url, key);

async function main() {
  const { data: news, error: ne } = await supabase.from('news_updates').select('*').limit(1);
  const { data: ann, error: ae } = await supabase.from('company_announcements').select('*').limit(1);
  const { data: tmpl, error: te } = await supabase.from('status_templates').select('*').limit(1);
  
  console.log("news_updates error:", ne?.message || "exists");
  console.log("company_announcements error:", ae?.message || "exists");
  console.log("status_templates error:", te?.message || "exists");
}

main().catch(console.error);
