import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { generateReportHTML, generateInsights } from '../services/report-engine.js'
import { fetchMetaInsights, getDemoMetrics as getMetaDemo } from '../services/meta.js'
import { fetchGoogleAdsMetrics } from '../services/google-ads.js'
import { fetchGoogleAnalyticsMetrics } from '../services/google-analytics.js'
import { randomUUID } from 'crypto'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*, clients(name, company)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ reports: data })
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*, clients(name, company, logo_url)')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Relatório não encontrado' })
  res.json({ report: data })
})

router.get('/:id/html', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Relatório não encontrado' })
  res.setHeader('Content-Type', 'text/html')
  res.send(data.html_content)
})

router.post('/generate', async (req, res) => {
  const { client_id, title, period_start, period_end, channels } = req.body
  if (!client_id || !period_start || !period_end) {
    return res.status(400).json({ error: 'client_id, period_start e period_end obrigatórios' })
  }

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    const { data: dash } = await supabase
      .from('dashboards')
      .select('config')
      .eq('client_id', client_id)
      .limit(1)
      .maybeSingle()

    const branding = {
      logoUrl: dash?.config?.branding?.logoUrl,
      primaryColor: dash?.config?.branding?.primaryColor,
      accentColor: dash?.config?.branding?.accentColor,
      companyName: dash?.config?.branding?.companyName,
    }

    const metrics = await collectMetrics(client_id, channels)

    const insights = generateInsights(metrics)

    const html = generateReportHTML({
      client,
      period: { start: period_start, end: period_end },
      meta: metrics.meta,
      googleAds: metrics.googleAds,
      analytics: metrics.analytics,
      insights,
      branding
    })

    const shareToken = randomUUID().replace(/-/g, '').slice(0, 16)

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        user_id: req.user.id,
        client_id,
        title: title || `Relatório ${period_start} a ${period_end}`,
        period_start,
        period_end,
        channels: channels || ['meta', 'google_ads', 'google_analytics'],
        metrics: { meta: metrics.meta, googleAds: metrics.googleAds, analytics: metrics.analytics, insights },
        status: 'generated',
        html_content: html,
        share_token: shareToken
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ report })
  } catch (err) {
    res.status(500).json({ error: `Erro ao gerar relatório: ${err.message}` })
  }
})

router.put('/:id', async (req, res) => {
  const { title, html_content, status } = req.body
  const { data, error } = await supabase
    .from('reports')
    .update({ title, html_content, status, updated_at: new Date() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ report: data })
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Relatório removido' })
})

router.post('/:id/send', async (req, res) => {
  const { email } = req.body
  const { data: report } = await supabase
    .from('reports')
    .select('*, clients(email, name)')
    .eq('id', req.params.id)
    .single()

  if (!report) return res.status(404).json({ error: 'Relatório não encontrado' })

  const to = email || report.clients?.email
  if (!to) return res.status(400).json({ error: 'Email do cliente não encontrado' })

  const shareUrl = `${req.protocol}://${req.get('host')}/r/${report.share_token}`

  await supabase.from('reports').update({ status: 'sent', updated_at: new Date() }).eq('id', report.id)

  res.json({
    message: 'Relatório enviado com sucesso',
    details: {
      to,
      shareUrl,
      via: 'Compartilhe o link abaixo (integração com email será configurada no próximo passo)'
    }
  })
})

router.get('/shared/:token', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('html_content, title, client_id, created_at')
    .eq('share_token', req.params.token)
    .single()
  if (error) return res.status(404).json({ error: 'Relatório não encontrado ou link inválido' })

  res.setHeader('Content-Type', 'text/html')
  res.send(data.html_content)
})

async function collectMetrics(clientId, channels) {
  const { data: accounts } = await supabase
    .from('api_accounts')
    .select('*')
    .eq('client_id', clientId)

  if (!accounts || accounts.length === 0) {
    return {
      meta: { metrics: getMetaDemo('meta_instagram'), ads: getMetaDemo('meta_ads') },
      googleAds: await fetchGoogleAdsMetrics({}),
      analytics: await fetchGoogleAnalyticsMetrics({})
    }
  }

  const result = { meta: null, googleAds: null, analytics: null }

  for (const account of accounts) {
    if (account.platform === 'meta_instagram' || account.platform === 'meta_ads') {
      const m = await fetchMetaInsights(account)
      if (account.platform === 'meta_instagram') {
        if (!result.meta) result.meta = {}
        result.meta['metrics'] = m
      } else {
        if (!result.meta) result.meta = {}
        result.meta['ads'] = m
      }
    } else if (account.platform === 'google_ads') {
      result.googleAds = await fetchGoogleAdsMetrics(account)
    } else if (account.platform === 'google_analytics') {
      result.analytics = await fetchGoogleAnalyticsMetrics(account)
    }
  }

  if (!result.meta) result.meta = { metrics: getMetaDemo('meta_instagram'), ads: getMetaDemo('meta_ads') }
  if (!result.googleAds) result.googleAds = await fetchGoogleAdsMetrics({})
  if (!result.analytics) result.analytics = await fetchGoogleAnalyticsMetrics({})

  return result
}

export default router
