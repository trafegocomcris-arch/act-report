const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { supabase, dbErrorResponse } = require('../lib/db')
const { authMiddleware } = require('../middleware/auth')
const {
  getDemoMetaAds,
  getDemoInstagram,
  getDemoGoogleAds,
  getDemoAnalytics,
} = require('../services/demo')
const { renderReportHtml } = require('../services/templates')

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_reports')
      .select('*, clients:client_id(name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ reports: data || [] })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao listar relatórios')
    res.status(r.status).json(r.json)
  }
})

router.post('/generate', async (req, res) => {
  try {
    const { client_id, title, period_start, period_end, channels } = req.body
    if (!client_id || !period_start || !period_end) {
      return res.status(400).json({ error: { message: 'Cliente, período início e fim obrigatórios' } })
    }

    const selChannels = channels || ['meta', 'google_ads', 'google_analytics']
    const metaData = selChannels.includes('meta') ? getDemoMetaAds(period_start, period_end) : null
    const instagramData = selChannels.includes('meta') ? getDemoInstagram(period_start, period_end) : null
    const googleAdsData = selChannels.includes('google_ads') ? getDemoGoogleAds(period_start, period_end) : null
    const analyticsData = selChannels.includes('google_analytics') ? getDemoAnalytics(period_start, period_end) : null

    const reportData = {
      meta_ads: metaData,
      instagram: instagramData,
      google_ads: googleAdsData,
      analytics: analyticsData,
    }

    const html = renderReportHtml({
      client_name: '',
      title: title || 'Relatório de Marketing',
      period_start,
      period_end,
      data: reportData,
      generated_at: new Date().toISOString(),
    })

    const shareToken = crypto.randomBytes(16).toString('hex')

    const { data, error } = await supabase
      .from('reportact_reports')
      .insert({
        user_id: req.user.id,
        client_id,
        title: title || 'Relatório de Marketing',
        period_start,
        period_end,
        channels: selChannels,
        status: 'generated',
        html_content: html,
        share_token: shareToken,
        report_data: reportData,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('Generate report error:', err)
    const r = dbErrorResponse(err, 'Erro ao gerar relatório')
    res.status(r.status).json(r.json)
  }
})

router.get('/:id/html', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_reports')
      .select('html_content, clients:client_id(name)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error || !data) {
      return res.status(404).json({ error: { message: 'Relatório não encontrado' } })
    }
    let html = data.html_content || '<p>Relatório vazio</p>'
    if (data.clients?.name) {
      html = html.replace('{{client_name}}', data.clients.name)
    }
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao carregar relatório')
    res.status(r.status).json(r.json)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reportact_reports')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ message: 'Relatório removido' })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao remover relatório')
    res.status(r.status).json(r.json)
  }
})

module.exports = router
