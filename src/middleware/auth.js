const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'reportact-jwt-secret-2026'

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Token não fornecido' } })
  }
  const decoded = verifyToken(auth.slice(7))
  if (!decoded) {
    return res.status(401).json({ error: { message: 'Token inválido ou expirado' } })
  }
  req.user = decoded
  next()
}

module.exports = { generateToken, verifyToken, authMiddleware }
