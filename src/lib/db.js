const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
})

function isMissingTable(err) {
  const msg = err?.message || err?.error?.message || ''
  return msg.includes('relation') && msg.includes('does not exist')
}

function dbErrorResponse(err, defaultMsg = 'Erro interno') {
  if (isMissingTable(err)) {
    return {
      status: 503,
      json: {
        error: {
          message: 'Sistema em configuração. Execute a migration SQL no Supabase Dashboard.',
          hint: 'Abra o SQL Editor do Supabase e execute supabase/migration.sql'
        }
      }
    }
  }
  return { status: 500, json: { error: { message: defaultMsg } } }
}

module.exports = { supabase, isMissingTable, dbErrorResponse }
