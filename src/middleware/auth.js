import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  const token = header.split(' ')[1]

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    req.user = data.user
    next()
  } catch {
    return res.status(401).json({ error: 'Erro de autenticação' })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null
    return next()
  }
  const token = header.split(' ')[1]
  supabase.auth.getUser(token).then(({ data }) => {
    req.user = data?.user || null
    next()
  }).catch(() => {
    req.user = null
    next()
  })
}
