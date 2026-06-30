import dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const sql = `
-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connected API accounts
CREATE TABLE IF NOT EXISTS api_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta_instagram','meta_ads','google_ads','google_analytics','google_search_console','youtube','linkedin','tiktok')),
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached metrics
CREATE TABLE IF NOT EXISTS metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES api_accounts(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly')),
  date DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, period, date)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  channels TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','generated','sent')),
  html_content TEXT,
  pdf_url TEXT,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboards (client-facing)
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  is_public BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{"charts":[],"branding":{}}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard access logs
CREATE TABLE IF NOT EXISTS dashboard_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share tokens for public report access
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_account ON metrics_cache(account_id);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_date ON metrics_cache(date);
CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_api_accounts_client ON api_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_client ON dashboards(client_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_logs_dash ON dashboard_logs(dashboard_id);
`;

async function run() {
  console.log('Running migrations...')
  const { error } = await supabase.rpc('exec_sql', { query: sql })
  if (error) {
    console.error('Migration error (rpc), trying direct SQL...')
    console.error(error)
    console.log('\nExecute o SQL acima manualmente no SQL Editor do Supabase.')
  } else {
    console.log('Migration completed successfully!')
  }
}

run()
