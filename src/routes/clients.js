const express = require('express')
const router = express.Router()
const { supabase, dbErrorResponse } = require('../lib/db')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_clients')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ clients: data || [] })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao listar clientes')
    res.status(r.status).json(r.json)
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, company, email, phone, website } = req.body
    if (!name) return res.status(400).json({ error: { message: 'Nome obrigatório' } })
    const { data, error } = await supabase
      .from('reportact_clients')
      .insert({ user_id: req.user.id, name, company, email, phone, website })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao criar cliente')
    res.status(r.status).json(r.json)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, company, email, phone, website } = req.body
    if (!name) return res.status(400).json({ error: { message: 'Nome obrigatório' } })
    const { data, error } = await supabase
      .from('reportact_clients')
      .update({ name, company, email, phone, website })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: { message: 'Cliente não encontrado' } })
    res.json(data)
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao atualizar cliente')
    res.status(r.status).json(r.json)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await supabase
      .from('reportact_accounts')
      .delete()
      .eq('client_id', req.params.id)
      .eq('user_id', req.user.id)
    await supabase
      .from('reportact_dashboards')
      .delete()
      .eq('client_id', req.params.id)
      .eq('user_id', req.user.id)
    await supabase
      .from('reportact_reports')
      .delete()
      .eq('client_id', req.params.id)
      .eq('user_id', req.user.id)
    const { error } = await supabase
      .from('reportact_clients')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ message: 'Cliente removido' })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao remover cliente')
    res.status(r.status).json(r.json)
  }
})

module.exports = router
