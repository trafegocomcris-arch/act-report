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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' })
})

app.get('/d/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'client-dashboard.html'))
})

app.get('/r/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'shared-report.html'))
})

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
})

app.listen(PORT, () => {
  console.log(`ACT Report rodando em http://localhost:${PORT}`)
})
