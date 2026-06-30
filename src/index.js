import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import clientRoutes from './routes/clients.js'
import accountRoutes from './routes/accounts.js'
import reportRoutes from './routes/reports.js'
import dashboardRoutes from './routes/dashboard.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/dashboards', dashboardRoutes)

import { supabase, supabaseAdmin } from './config/supabase.js'

app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown', dbError = null
  let adminStatus = 'unknown', adminError = null
  try {
    const { data, error } = await supabase.from('clients').select('*').limit(1)
    dbStatus = error ? 'erro:' + error.message : 'ok'
    dbError = error?.message || null
  } catch (e) { dbStatus = 'crash'; dbError = e.message }
  try {
    const { data, error } = await supabaseAdmin.from('clients').select('*').limit(1)
    adminStatus = error ? 'erro:' + error.message : 'ok'
    adminError = error?.message || null
  } catch (e) { adminStatus = 'crash'; adminError = e.message }
  res.json({
    status: 'ok',
    version: '1.0.0',
    env: {
      url: !!process.env.SUPABASE_URL,
      key: !!process.env.SUPABASE_KEY,
      key_starts: (process.env.SUPABASE_KEY || 'vazio').substring(0, 3),
      service: !!process.env.SUPABASE_SERVICE_KEY,
      service_starts: (process.env.SUPABASE_SERVICE_KEY || 'vazio').substring(0, 3)
    },
    anon_db: dbStatus,
    anon_error: dbError,
    admin_db: adminStatus,
    admin_error: adminError
  })
})

app.get('/d/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'client-dashboard.html'))
})

app.get('/r/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'shared-report.html'))
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
})

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
})

try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ACT Report rodando em http://0.0.0.0:${PORT}`)
    console.log(`Supabase: ${process.env.SUPABASE_URL ? 'configurado' : 'FALTANDO!'}`)
  })
} catch (err) {
  console.error('Erro ao iniciar servidor:', err)
  process.exit(1)
}
