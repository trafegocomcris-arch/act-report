import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', req.user.id)
    .order('name')
  if (error) return res.status(400).json({ error: error.message })
  res.json({ clients: data })
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*, api_accounts(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()
  if (error) return res.status(404).json({ error: 'Cliente não encontrado' })
  res.json({ client: data })
})

router.post('/', async (req, res) => {
  const { name, company, email, phone, website, notes } = req.body
  if (!name) return res.status(400).json({ error: 'Nome do cliente obrigatório' })
  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: req.user.id, name, company, email, phone, website, notes })
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ client: data })
})

router.put('/:id', async (req, res) => {
  const { name, company, email, phone, website, logo_url, notes } = req.body
  const { data, error } = await supabase
    .from('clients')
    .update({ name, company, email, phone, website, logo_url, notes, updated_at: new Date() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ client: data })
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Cliente removido' })
})

export default router
