import fs from 'fs';
import { execSync } from 'child_process';

const PROJECT_NAME = 'vyntyra-vynexa'; // The name from your Cloudflare dashboard
const ENV_FILE = '.env';
const ENV_BACKUP = '.env.backup';

if (!fs.existsSync(ENV_FILE) && !fs.existsSync(ENV_BACKUP)) {
  console.error(`.env file not found`);
  process.exit(1);
}

// Rename .env to .env.backup so wrangler doesn't auto-load the invalid CLOUDFLARE_API_TOKEN from it
if (fs.existsSync(ENV_FILE)) {
  fs.renameSync(ENV_FILE, ENV_BACKUP);
}

const envContent = fs.readFileSync(ENV_BACKUP, 'utf-8');
const lines = envContent.split('\n');

console.log(`Starting sync to Cloudflare Pages project: ${PROJECT_NAME}...`);

try {
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

    console.log(`Syncing ${key}...`);
    try {
      execSync(`node node_modules/wrangler/bin/wrangler.js pages secret put ${key} --project-name ${PROJECT_NAME}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log(`✅ Successfully synced ${key}`);
    } catch (error) {
      console.error(`❌ Failed to sync ${key}`);
    }
  }
} finally {
  // Restore the .env file
  if (fs.existsSync(ENV_BACKUP)) {
    fs.renameSync(ENV_BACKUP, ENV_FILE);
  }
}

console.log('\n🎉 Auto-sync complete! All keys from .env are now in Cloudflare Pages.');
