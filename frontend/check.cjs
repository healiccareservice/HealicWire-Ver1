const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function check() {
  const tables = ['treatment_update', 'scientific_events', 'drugs', 'current_guidelines', 'providers'];
  for (const t of tables) {
    const res = await fetch(supabaseUrl + '/rest/v1/' + t + '?spotlight=eq.true', {
      headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey }
    });
    const data = await res.json();
    console.log(t, data ? data.length : 0, data ? data.map(d => d.headline || d.title || d.name) : 'none');
  }
}
check();
