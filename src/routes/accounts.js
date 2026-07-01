const express = require('express')
const router = express.Router()
const { supabase, dbErrorResponse } = require('../lib/db')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

router.get('/client/:clientId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_accounts')
      .select('*')
      .eq('client_id', req.params.clientId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ accounts: data || [] })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao listar contas')
    res.status(r.status).json(r.json)
  }
})

router.post('/connect', async (req, res) => {
  try {
    const { client_id, platform, account_name, account_id, access_token } = req.body
    if (!client_id || !platform) {
      return res.status(400).json({ error: { message: 'Cliente e plataforma obrigatórios' } })
    }
    const isDemo = !access_token
    const { data, error } = await supabase
      .from('reportact_accounts')
      .insert({
        user_id: req.user.id,
        client_id,
        platform,
        account_name: account_name || `${platform} - ${account_id || 'Demo'}`,
        account_id: account_id || '',
        access_token: access_token || '',
        connected: !isDemo,
        is_demo: isDemo,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao conectar conta')
    res.status(r.status).json(r.json)
  }
})

router.post('/:id/sync', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_accounts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error || !data) {
      return res.status(404).json({ error: { message: 'Conta não encontrada' } })
    }
    const lastSync = new Date().toISOString()
    await supabase
      .from('reportact_accounts')
      .update({ last_sync: lastSync, connected: true })
      .eq('id', req.params.id)
    res.json({ message: 'Sincronizado', last_sync: lastSync })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao sincronizar')
    res.status(r.status).json(r.json)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reportact_accounts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ message: 'Conta desconectada' })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao desconectar')
    res.status(r.status).json(r.json)
  }
})

module.exports = router
