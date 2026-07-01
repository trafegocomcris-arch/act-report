-- ReportACT - Supabase Migration
-- Run this SQL in the Supabase SQL Editor

-- Clients table
CREATE TABLE IF NOT EXISTS reportact_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON reportact_clients(user_id);

-- Accounts (connected platforms)
CREATE TABLE IF NOT EXISTS reportact_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES reportact_clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta_instagram','meta_ads','google_ads','google_analytics')),
  account_name TEXT NOT NULL,
  account_id TEXT DEFAULT '',
  access_token TEXT DEFAULT '',
  connected BOOLEAN DEFAULT false,
  is_demo BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_client ON reportact_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON reportact_accounts(user_id);

-- Reports
CREATE TABLE IF NOT EXISTS reportact_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES reportact_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Relatório de Marketing',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  channels TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated','sent')),
  html_content TEXT,
  report_data JSONB DEFAULT '{}',
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON reportact_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_client ON reportact_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_share ON reportact_reports(share_token);

-- Dashboards
CREATE TABLE IF NOT EXISTS reportact_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES reportact_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_user ON reportact_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_slug ON reportact_dashboards(slug);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_clients_updated
  BEFORE UPDATE ON reportact_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_dashboards_updated
  BEFORE UPDATE ON reportact_dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE reportact_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportact_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportact_dashboards ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can CRUD own clients" ON reportact_clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own accounts" ON reportact_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own reports" ON reportact_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own dashboards" ON reportact_dashboards
  FOR ALL USING (auth.uid() = user_id);

-- Allow public read for shared reports and dashboards
CREATE POLICY "Public can read shared reports" ON reportact_reports
  FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Public can read public dashboards" ON reportact_dashboards
  FOR SELECT USING (is_public = true);
