require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')

const { supabase } = require('./lib/db')

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({ origin: '*', credentials: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  res.set('X-Powered-By', 'ReportACT')
  next()
})

const authRoutes = require('./routes/auth')
const clientRoutes = require('./routes/clients')
const reportRoutes = require('./routes/reports')
const dashboardRoutes = require('./routes/dashboards')
const accountRoutes = require('./routes/accounts')
const publicRoutes = require('./routes/public')

app.use('/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/dashboards', dashboardRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/', publicRoutes)

const publicDir = path.join(__dirname, '..', 'public')
if (fs.existsSync(publicDir)) {
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicDir, 'admin.html'))
  })
  app.get('/login', (req, res) => {
    res.sendFile(path.join(publicDir, 'admin.html'))
  })
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
  app.use(express.static(publicDir, { index: false }))
}

function handleError(err, req, res, defaultMsg) {
  console.error(err)
  const msg = err?.message || ''
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return res.status(503).json({
      error: {
        message: 'Banco de dados não configurado. Execute a migration SQL no Supabase Dashboard.',
        hint: '/api/health'
      }
    })
  }
  res.status(500).json({ error: { message: defaultMsg || 'Erro interno do servidor' } })
}

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('reportact_clients').select('id').limit(1)
    res.json({
      status: error ? 'degraded' : 'ok',
      db: error ? `tables missing: ${error.message}` : 'connected',
      version: '1.0.0'
    })
  } catch {
    res.json({ status: 'degraded', db: 'connection error' })
  }
})

app.use((err, req, res, next) => {
  handleError(err, req, res)
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`ReportACT server running on port ${PORT}`)
  console.log(`http://localhost:${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  server.close(() => process.exit(0))
})

module.exports = app
