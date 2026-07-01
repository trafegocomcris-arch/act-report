const express = require('express')
const router = express.Router()
const { supabase, isMissingTable } = require('../lib/db')
const { getDemoMetaAds, getDemoInstagram, getDemoGoogleAds, getDemoAnalytics } = require('../services/demo')
const { renderDashboardHtml } = require('../services/templates')

router.get('/r/:share_token', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_reports')
      .select('title, period_start, period_end, html_content, clients:client_id(name)')
      .eq('share_token', req.params.share_token)
      .single()
    if (error || !data) {
      return res.status(404).send('<h1>Relatório não encontrado</h1>')
    }
    let html = data.html_content || '<p>Relatório vazio</p>'
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    console.error(err)
    if (isMissingTable(err)) {
      return res.status(503).send('<h1>ReportACT — Banco em configuração</h1><p>Execute a migration SQL no Supabase Dashboard.</p>')
    }
    res.status(500).send('<h1>Erro ao carregar relatório</h1>')
  }
})

router.get('/d/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_dashboards')
      .select('*, clients:client_id(name)')
      .eq('slug', req.params.slug)
      .eq('is_public', true)
      .single()
    if (error || !data) {
      return res.status(404).send('<h1>Dashboard não encontrado</h1>')
    }
    const periodStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const periodEnd = new Date().toISOString().split('T')[0]
    const demoMeta = getDemoMetaAds(periodStart, periodEnd)
    const demoIg = getDemoInstagram(periodStart, periodEnd)
    const demoGoogle = getDemoGoogleAds(periodStart, periodEnd)
    const demoAnalytics = getDemoAnalytics(periodStart, periodEnd)

    const html = renderDashboardHtml({
      client_name: data.clients?.name || 'Cliente',
      title: data.title || 'Dashboard',
      slug: data.slug,
      config: data.config || {},
      data: {
        meta_ads: demoMeta,
        instagram: demoIg,
        google_ads: demoGoogle,
        analytics: demoAnalytics,
      }
    })
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    console.error(err)
    if (isMissingTable(err)) {
      return res.status(503).send('<h1>ReportACT — Banco em configuração</h1><p>Execute a migration SQL no Supabase Dashboard.</p>')
    }
    res.status(500).send('<h1>Erro ao carregar dashboard</h1>')
  }
})

module.exports = router
