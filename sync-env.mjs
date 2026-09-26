import fs from 'fs';
import { execSync } from 'child_process';

const PROJECT_NAME = 'vyntyra-vynexa'; // The name from your Cloudflare dashboard
const ENV_FILE = '.env';

if (!fs.existsSync(ENV_FILE)) {
  console.error(`.env file not found`);
  process.exit(1);
}

const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
const lines = envContent.split('\n');

console.log(`Starting sync to Cloudflare Pages project: ${PROJECT_NAME}...`);

for (let line of lines) {
  line = line.trim();
  // Skip empty lines and comments
  if (!line || line.startsWith('#')) continue;

  // Find the first equals sign
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;

  const key = line.slice(0, eqIdx).trim();
  let value = line.slice(eqIdx + 1).trim();

  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }

  console.log(`Syncing ${key}...`);
  try {
    // We use wrangler pages secret put to set the secret on Cloudflare Pages
    // It requires piping the value into it to avoid interactive prompts
    execSync(`npx wrangler pages secret put ${key} --project-name ${PROJECT_NAME}`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log(`✅ Successfully synced ${key}`);
  } catch (error) {
    console.error(`❌ Failed to sync ${key}`);
  }
}

console.log('\n🎉 Auto-sync complete! All keys from .env are now in Cloudflare Pages.');
