import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY
const serviceKey = process.env.SUPABASE_SERVICE_KEY

class SupabaseMock {
  constructor() { this._err = new Error('Supabase não configurado. Configure SUPABASE_URL e SUPABASE_KEY no .env') }
  from() { return this }
  select() { return this }
  insert() { return this }
  update() { return this }
  delete() { return this }
  upsert() { return this }
  eq() { return this }
  order() { return this }
  single() { return this }
  limit() { return this }
  gte() { return this }
  lte() { return this }
  then(resolve) { resolve({ data: null, error: this._err }) }
}

const mock = new SupabaseMock()

export const supabase = url && key
  ? createClient(url, key)
  : mock

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey)
  : mock
