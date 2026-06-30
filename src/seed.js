import dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const demoUserId = '00000000-0000-0000-0000-000000000000'

async function seed() {
  console.log('Criando dados de demonstração...')

  const { data: user } = await supabase.auth.admin.createUser({
    email: 'demo@actreport.com',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: { name: 'Usuário Demo' }
  })

  const uid = user?.user?.id || demoUserId

  const clients = [
    { user_id: uid, name: 'Agência Criativa', company: 'Agência Criativa Ltda', email: 'contato@agencia.com', phone: '(11) 99999-0001' },
    { user_id: uid, name: 'Studio Design', company: 'Studio Design ME', email: 'ola@studiodesign.com', phone: '(11) 99999-0002' },
    { user_id: uid, name: 'Tech Solutions', company: 'Tech Solutions SA', email: 'contato@techsolutions.com', phone: '(11) 99999-0003' },
  ]

  for (const c of clients) {
    const { data: client } = await supabase.from('clients').insert(c).select().single()
    if (client) {
      console.log(`Cliente criado: ${client.name}`)
      // Criar dashboards demo
      await supabase.from('dashboards').insert({
        client_id: client.id,
        user_id: uid,
        title: `Dashboard ${client.name}`,
        slug: client.name.toLowerCase().replace(/\s+/g, '-'),
        is_public: true,
        config: { charts: ['overview', 'social', 'ads', 'analytics'], branding: {} }
      })
    }
  }

  console.log('\n✅ Dados de demonstração criados!')
  console.log('\nLogin: demo@actreport.com / demo123456')
}

seed().catch(console.error)
