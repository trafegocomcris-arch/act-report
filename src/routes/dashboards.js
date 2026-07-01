const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const { supabase, dbErrorResponse } = require('../lib/db')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

function generateSlug() {
  return crypto.randomBytes(6).toString('hex')
}

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reportact_dashboards')
      .select('*, clients:client_id(name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ dashboards: data || [] })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao listar dashboards')
    res.status(r.status).json(r.json)
  }
})

router.post('/create', async (req, res) => {
  try {
    const { client_id, title, config } = req.body
    if (!client_id || !title) {
      return res.status(400).json({ error: { message: 'Cliente e título obrigatórios' } })
    }
    const slug = generateSlug()
    const { data, error } = await supabase
      .from('reportact_dashboards')
      .insert({
        user_id: req.user.id,
        client_id,
        title,
        slug,
        config: config || { charts: ['overview', 'social', 'ads', 'analytics'], branding: {} },
        is_public: false,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao criar dashboard')
    res.status(r.status).json(r.json)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { is_public, title, config } = req.body
    const updates = {}
    if (is_public !== undefined) updates.is_public = is_public
    if (title !== undefined) updates.title = title
    if (config !== undefined) updates.config = config

    const { data, error } = await supabase
      .from('reportact_dashboards')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: { message: 'Dashboard não encontrado' } })
    res.json(data)
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao atualizar dashboard')
    res.status(r.status).json(r.json)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reportact_dashboards')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ message: 'Dashboard removido' })
  } catch (err) {
    console.error(err)
    const r = dbErrorResponse(err, 'Erro ao remover dashboard')
    res.status(r.status).json(r.json)
  }
})

module.exports = router
