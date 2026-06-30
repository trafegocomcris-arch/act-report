import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/client/:slug', async (req, res) => {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*, clients(name, company, logo_url)')
    .eq('slug', req.params.slug)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Dashboard não encontrado' })
  }

  if (!data.is_public) {
    return res.status(403).json({ error: 'Dashboard não está público' })
  }

  const metrics = await fetchDashboardMetrics(data.client_id, data.config)
  const { error: logError } = await supabase
    .from('dashboard_logs')
    .insert({
      dashboard_id: data.id,
      ip: req.ip,
      user_agent: req.headers['user-agent']
    })

  if (logError) console.error('Log error:', logError)

  res.json({
    dashboard: {
      id: data.id,
      title: data.title,
      client: data.clients,
      config: data.config,
      metrics,
      updated_at: data.updated_at
    }
  })
})

router.get('/client/:slug/metrics', async (req, res) => {
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select('id, client_id, config')
    .eq('slug', req.params.slug)
    .single()

  if (!dashboard) return res.status(404).json({ error: 'Dashboard não encontrado' })

  const metrics = await fetchDashboardMetrics(dashboard.client_id, dashboard.config)
  res.json({ metrics })
})

router.post('/create', authenticate, async (req, res) => {
  const { client_id, title, config } = req.body
  if (!client_id || !title) return res.status(400).json({ error: 'client_id e title obrigatórios' })

  const slug = generateSlug(title)

  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      client_id,
      user_id: req.user.id,
      title,
      slug,
      config: config || { charts: [], branding: {} }
    })
    .select()
    .single()

  if (error) {
    if (error.message?.includes('duplicate')) {
      const { data: d2 } = await supabase
        .from('dashboards')
        .insert({
          client_id, user_id: req.user.id, title,
          slug: slug + '-' + Math.random().toString(36).slice(2, 6),
          config: config || { charts: [], branding: {} }
        })
        .select()
        .single()
      return res.status(201).json({ dashboard: d2 })
    }
    return res.status(400).json({ error: error.message })
  }

  res.status(201).json({ dashboard: data })
})

router.put('/:id', authenticate, async (req, res) => {
  const { title, config, is_public, password_hash } = req.body
  const updates = { updated_at: new Date() }
  if (title !== undefined) updates.title = title
  if (config !== undefined) updates.config = config
  if (is_public !== undefined) updates.is_public = is_public
  if (password_hash !== undefined) updates.password_hash = password_hash
  const { data, error } = await supabase
    .from('dashboards')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ dashboard: data?.[0] || updates })
})

router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*, clients(name)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ dashboards: data })
})

router.delete('/:id', authenticate, async (req, res) => {
  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Dashboard removido' })
})

async function fetchDashboardMetrics(clientId, config) {
  const { data: accounts } = await supabase
    .from('api_accounts')
    .select('*')
    .eq('client_id', clientId)

  if (!accounts || accounts.length === 0) return null

  const result = { accounts: [], overview: {} }
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0

  for (const account of accounts) {
    const { data: cache } = await supabase
      .from('metrics_cache')
      .select('data')
      .eq('account_id', account.id)
      .eq('period', 'daily')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    let accountData = { platform: account.platform, account_name: account.account_name, metrics: cache?.data || {} }
    result.accounts.push(accountData)

    const m = cache?.data || {}
    totalSpend += parseFloat(m.spend || m.cost || 0)
    totalImpressions += parseInt(m.impressions || 0)
    totalClicks += parseInt(m.clicks || 0)
    totalConversions += parseInt(m.conversions || 0)
  }

  result.overview = {
    total_spend: totalSpend,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    total_conversions: totalConversions,
    updated_at: new Date().toISOString()
  }

  return result
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export default router
