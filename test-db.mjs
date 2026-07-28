import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

fetch(url + '/rest/v1/?apikey=' + key)
  .then(r => r.json())
  .then(data => console.log(Object.keys(data.definitions)))
  .catch(console.error);
