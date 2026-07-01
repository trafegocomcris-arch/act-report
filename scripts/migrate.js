/**
 * ReportACT — Database Migration Script
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate.js
 * 
 * Or add to .env:
 *   SUPABASE_SERVICE_ROLE_KEY=seu_token
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PAT = process.env.SUPABASE_ACCESS_TOKEN
const REF = URL?.match(/(?:\/\/|^)([^.]+)\./)?.[1]

if (!URL) {
  console.error('❌ SUPABASE_URL não definido no .env')
  process.exit(1)
}

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migration.sql'), 'utf8')

  // Method 1: Management API (requires SUPABASE_ACCESS_TOKEN)
  if (PAT && REF) {
    console.log('⚡ Using Management API...')
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/sql`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    })
    if (res.ok) { console.log('✅ Migration complete!'); return }
    console.log('⚠️ Management API failed:', await res.text())
  }

  // Method 2: Service role key + exec_sql RPC
  if (KEY) {
    console.log('⚡ Using service_role key...')
    const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (!error) { console.log('✅ Migration complete!'); return }
    console.log('⚠️ RPC failed:', error.message)
  }

  printInstructions()
}

function printInstructions() {
  console.log(`
❌ Could not run migration automatically.

To run it manually:
  1. Open https://supabase.com/dashboard/project/${REF || 'aowxvgaglwckztomoziq'}/sql/new
  2. Paste the content of supabase/migration.sql
  3. Click "Run"
  4. Verify tables were created in Table Editor

For automatic migration in the future:
  a) Create a Personal Access Token at Supabase Dashboard → Settings → API → Access Tokens
  b) Add to .env: SUPABASE_ACCESS_TOKEN=seu_token
  
  OR

  a) Copy the service_role key from Project Settings → API
  b) Add to .env: SUPABASE_SERVICE_ROLE_KEY=seu_token
`)
  process.exit(1)
}

main()
