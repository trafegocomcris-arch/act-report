const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/db')
const { generateToken, verifyToken } = require('../middleware/auth')

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email e senha obrigatórios' } })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return res.status(401).json({ error: { message: 'Email ou senha inválidos' } })
    }

    return res.json({
      session: {
        access_token: data.session.access_token,
        user: { id: data.user.id, email: data.user.email }
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: { message: 'Erro interno do servidor' } })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email e senha obrigatórios' } })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: { message: 'Senha deve ter no mínimo 6 caracteres' } })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || '' } }
    })
    if (error) {
      return res.status(400).json({ error: { message: error.message } })
    }

    return res.json({
      user: { id: data.user.id, email: data.user.email },
      message: 'Conta criada! Verifique seu email para confirmar.'
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: { message: 'Erro interno do servidor' } })
  }
})

router.post('/recover', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: { message: 'Email obrigatório' } })

    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return res.status(400).json({ error: { message: error.message } })

    return res.json({ message: 'Email de recuperação enviado' })
  } catch (err) {
    console.error('Recover error:', err)
    return res.status(500).json({ error: { message: 'Erro interno do servidor' } })
  }
})

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Não autenticado' } })
  }
  const token = auth.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: { message: 'Token inválido' } })
  }
  const userData = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || '',
    created_at: data.user.created_at,
  }
  res.json({ user: userData })
})

router.put('/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'Não autenticado' } })
  const token = auth.slice(7)

  const { name } = req.body
  const { error } = await supabase.auth.updateUser(
    { data: { name } },
    { jwt: token }
  )
  if (error) return res.status(400).json({ error: { message: error.message } })
  res.json({ message: 'Perfil atualizado' })
})

module.exports = router
