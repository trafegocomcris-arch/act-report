import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' })
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: error.message })
  res.json({ session: data.session, user: data.user })
})

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' })
  }
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } }
  })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ user: data.user, message: 'Verifique seu email para confirmar o cadastro' })
})

router.post('/logout', async (req, res) => {
  const header = req.headers.authorization
  const token = header?.split(' ')[1]
  if (token) {
    await supabase.auth.admin.signOut(token)
  }
  res.json({ message: 'Deslogado com sucesso' })
})

router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Não autenticado' })
  const token = header.split(' ')[1]
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: 'Token inválido' })
  res.json({ user: data.user })
})

router.post('/magic-link', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email obrigatório' })
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Link mágico enviado para seu email' })
})

export default router
