import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { fetchMetaInsights } from '../services/meta.js'
import { fetchGoogleAdsMetrics } from '../services/google-ads.js'
import { fetchGoogleAnalyticsMetrics } from '../services/google-analytics.js'

const router = Router()
router.use(authenticate)

router.get('/client/:clientId', async (req, res) => {
  const { data, error } = await supabase
    .from('api_accounts')
    .select('*')
    .eq('client_id', req.params.clientId)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ accounts: data })
})

router.post('/connect', async (req, res) => {
  const { client_id, platform, account_name, account_id, access_token, refresh_token, metadata } = req.body
  if (!client_id || !platform) return res.status(400).json({ error: 'client_id e platform obrigatórios' })

  const existing = await supabase
    .from('api_accounts')
    .select('id')
    .eq('client_id', client_id)
    .eq('platform', platform)
    .single()

  const payload = {
    client_id, platform, account_name, account_id,
    access_token, refresh_token,
    metadata: metadata || {},
    connected: true,
    token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  }

  let result
  if (existing.data) {
    result = await supabase.from('api_accounts').update(payload).eq('id', existing.data.id).select().single()
  } else {
    result = await supabase.from('api_accounts').insert(payload).select().single()
  }

  if (result.error) return res.status(400).json({ error: result.error.message })
  res.json({ account: result.data })
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('api_accounts').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Conta desconectada' })
})

router.post('/:id/sync', async (req, res) => {
  const { data: account, error } = await supabase
    .from('api_accounts')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error || !account) return res.status(404).json({ error: 'Conta não encontrada' })

  try {
    let metrics
    const platform = account.platform
    if (platform === 'meta_instagram' || platform === 'meta_ads') {
      metrics = await fetchMetaInsights(account)
    } else if (platform === 'google_ads') {
      metrics = await fetchGoogleAdsMetrics(account)
    } else if (platform === 'google_analytics') {
      metrics = await fetchGoogleAnalyticsMetrics(account)
    } else {
      return res.status(400).json({ error: `Plataforma ${platform} não suportada ainda` })
    }

    const today = new Date().toISOString().split('T')[0]
    await supabase.from('metrics_cache').upsert({
      account_id: account.id,
      period: 'daily',
      date: today,
      data: metrics,
      created_at: new Date()
    }, { onConflict: 'account_id,period,date' })

    res.json({ metrics, cached: true })
  } catch (err) {
    res.status(500).json({ error: `Erro ao sincronizar: ${err.message}` })
  }
})

router.get('/:id/metrics', async (req, res) => {
  const { period, start, end } = req.query
  const query = supabase
    .from('metrics_cache')
    .select('*')
    .eq('account_id', req.params.id)
    .order('date', { ascending: true })

  if (period) query.eq('period', period)
  if (start) query.gte('date', start)
  if (end) query.lte('date', end)
  if (!start && !end) query.gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json({ metrics: data })
})

export default router
