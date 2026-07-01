const crypto = require('crypto')

function generateToken(len = 24) {
  return crypto.randomBytes(len).toString('hex')
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatCurrency(val) {
  return 'R$ ' + val.toFixed(2).replace('.', ',')
}

const demoCampaigns = [
  { name: '[CBO] [VENDAS] [AUTO] Novos', spent: 3150, roas: 13.4, ctr: 0.68, conversions: 42, cpa: 75 },
  { name: '[CBO] [VENDAS] [M] Envolvimento', spent: 907, roas: 8.7, ctr: 0.58, conversions: 18, cpa: 50.39 },
  { name: '[CBO] [VENDAS] [F] Produtos', spent: 463, roas: 7.4, ctr: 0.72, conversions: 9, cpa: 51.44 },
  { name: '[CBO] [LANÇAMENTO] Curso', spent: 1200, roas: 5.2, ctr: 0.91, conversions: 15, cpa: 80 },
  { name: '[CBO] [TRÁFEGO] Blog', spent: 350, roas: 2.1, ctr: 1.2, conversions: 5, cpa: 70 },
  { name: '[CBO] [VENDAS] [IG] Stories', spent: 680, roas: 6.3, ctr: 0.45, conversions: 11, cpa: 61.82 },
  { name: '[CBO] [VENDAS] [GWP] Produto X', spent: 890, roas: 9.1, ctr: 0.55, conversions: 20, cpa: 44.50 },
]

function getDemoMetaAds(periodStart, periodEnd) {
  const days = Math.max(1, Math.ceil((new Date(periodEnd) - new Date(periodStart)) / 86400000))
  const totalSpent = demoCampaigns.reduce((s, c) => s + c.spent, 0)
  const totalConversions = demoCampaigns.reduce((s, c) => s + c.conversions, 0)
  const weightedRoas = demoCampaigns.reduce((s, c) => s + c.roas * c.spent, 0) / totalSpent

  return {
    summary: {
      spend: totalSpent,
      impressions: randomBetween(80000, 120000),
      reach: randomBetween(55000, 89000),
      clicks: randomBetween(2500, 4000),
      conversions: totalConversions,
      roas: parseFloat(weightedRoas.toFixed(2)),
      ctr: parseFloat((demoCampaigns.reduce((s, c) => s + c.ctr * c.spent, 0) / totalSpent).toFixed(2)),
      cpc: parseFloat((totalSpent / randomBetween(2500, 4000)).toFixed(2)),
      cpa: parseFloat((totalSpent / totalConversions).toFixed(2)),
      spendChange: randomBetween(-5, 15),
      conversionsChange: randomBetween(-3, 12),
      roasChange: randomBetween(-8, 15),
    },
    campaigns: demoCampaigns.map(c => ({
      ...c,
      impressions: randomBetween(5000, 50000),
      reach: randomBetween(3000, 35000),
      clicks: randomBetween(100, 1200),
      cpc: parseFloat((c.spent / Math.max(1, randomBetween(100, 1200))).toFixed(2)),
      frequency: parseFloat((Math.random() * 2 + 1).toFixed(1)),
    })),
    daily: Array.from({ length: days }, (_, i) => {
      const d = new Date(periodStart)
      d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().split('T')[0],
        spend: randomBetween(100, 500),
        impressions: randomBetween(2000, 8000),
        clicks: randomBetween(80, 400),
        conversions: randomBetween(2, 10),
      }
    }),
    demographics: {
      age: [
        { range: '18-24', percentage: 22, spend: randomBetween(500, 1500) },
        { range: '25-34', percentage: 38, spend: randomBetween(1000, 2500) },
        { range: '35-44', percentage: 24, spend: randomBetween(600, 1800) },
        { range: '45-54', percentage: 11, spend: randomBetween(300, 800) },
        { range: '55+', percentage: 5, spend: randomBetween(100, 400) },
      ],
      gender: [
        { type: 'Masculino', percentage: 42, spend: randomBetween(1500, 3000) },
        { type: 'Feminino', percentage: 58, spend: randomBetween(2000, 3500) },
      ],
      regions: [
        { name: 'São Paulo', percentage: 28, spend: randomBetween(800, 1500) },
        { name: 'Rio de Janeiro', percentage: 15, spend: randomBetween(400, 800) },
        { name: 'Minas Gerais', percentage: 12, spend: randomBetween(300, 700) },
        { name: 'Paraná', percentage: 8, spend: randomBetween(200, 500) },
        { name: 'Rio Grande do Sul', percentage: 7, spend: randomBetween(150, 400) },
        { name: 'Bahia', percentage: 6, spend: randomBetween(150, 350) },
        { name: 'Outros', percentage: 24, spend: randomBetween(500, 1000) },
      ],
      devices: [
        { type: 'Mobile', percentage: 72, spend: randomBetween(2000, 3500) },
        { type: 'Desktop', percentage: 20, spend: randomBetween(500, 1200) },
        { type: 'Tablet', percentage: 8, spend: randomBetween(150, 400) },
      ],
    },
  }
}

function getDemoInstagram(periodStart, periodEnd) {
  const days = Math.max(1, Math.ceil((new Date(periodEnd) - new Date(periodStart)) / 86400000))
  return {
    summary: {
      followers: randomBetween(3500, 12000),
      followersGrowth: randomBetween(2, 8),
      reach: randomBetween(30000, 80000),
      reachChange: randomBetween(-5, 15),
      impressions: randomBetween(50000, 120000),
      engagement: parseFloat((Math.random() * 3 + 1.5).toFixed(1)),
      engagementChange: randomBetween(-10, 10),
      profileVisits: randomBetween(2000, 6000),
      websiteClicks: randomBetween(500, 2000),
    },
    content: [
      { type: 'Reels', count: randomBetween(8, 20), reach: randomBetween(15000, 40000), engagement: parseFloat((Math.random() * 5 + 2).toFixed(1)) },
      { type: 'Carrossel', count: randomBetween(4, 12), reach: randomBetween(8000, 20000), engagement: parseFloat((Math.random() * 4 + 1.5).toFixed(1)) },
      { type: 'Imagem', count: randomBetween(6, 15), reach: randomBetween(5000, 15000), engagement: parseFloat((Math.random() * 3 + 1).toFixed(1)) },
      { type: 'Stories', count: randomBetween(15, 40), reach: randomBetween(10000, 25000), engagement: parseFloat((Math.random() * 2 + 0.5).toFixed(1)) },
    ],
    followersGrowth: Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const d = new Date(periodEnd)
      d.setDate(d.getDate() - (Math.min(days, 30) - 1 - i))
      return {
        date: d.toISOString().split('T')[0],
        followers: randomBetween(3500, 12000),
      }
    }),
  }
}

function getDemoGoogleAds(periodStart, periodEnd) {
  return {
    summary: {
      spend: randomBetween(1500, 3500),
      impressions: randomBetween(30000, 70000),
      clicks: randomBetween(800, 2500),
      conversions: randomBetween(15, 45),
      ctr: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      cpc: parseFloat((Math.random() * 3 + 1).toFixed(2)),
      roas: parseFloat((Math.random() * 6 + 2).toFixed(1)),
      spendChange: randomBetween(-8, 12),
      clicksChange: randomBetween(-5, 10),
      conversionsChange: randomBetween(-3, 15),
    },
    campaigns: [
      { name: 'Search - Palavras-chave', type: 'Search', spend: randomBetween(500, 1200), impressions: randomBetween(8000, 20000), clicks: randomBetween(200, 600), conversions: randomBetween(5, 15), ctr: parseFloat((Math.random() * 3 + 1).toFixed(2)) },
      { name: 'Display - Remarketing', type: 'Display', spend: randomBetween(300, 800), impressions: randomBetween(15000, 30000), clicks: randomBetween(100, 300), conversions: randomBetween(3, 8), ctr: parseFloat((Math.random() * 1 + 0.3).toFixed(2)) },
      { name: 'Performance Max', type: 'PMax', spend: randomBetween(400, 1000), impressions: randomBetween(10000, 25000), clicks: randomBetween(150, 400), conversions: randomBetween(4, 12), ctr: parseFloat((Math.random() * 2 + 0.5).toFixed(2)) },
    ],
  }
}

function getDemoAnalytics(periodStart, periodEnd) {
  const days = Math.max(1, Math.ceil((new Date(periodEnd) - new Date(periodStart)) / 86400000))
  return {
    summary: {
      users: randomBetween(3000, 8000),
      usersChange: randomBetween(-3, 12),
      sessions: randomBetween(4000, 10000),
      pageviews: randomBetween(10000, 25000),
      bounceRate: parseFloat((Math.random() * 20 + 30).toFixed(1)),
      bounceChange: randomBetween(-5, 5),
      avgSessionDuration: randomBetween(120, 300),
      sessionChange: randomBetween(-5, 10),
    },
    sources: [
      { source: 'Organic Search', users: randomBetween(1000, 3000), percentage: randomBetween(25, 40) },
      { source: 'Direct', users: randomBetween(500, 1500), percentage: randomBetween(15, 25) },
      { source: 'Social', users: randomBetween(800, 2000), percentage: randomBetween(20, 30) },
      { source: 'Referral', users: randomBetween(200, 800), percentage: randomBetween(5, 12) },
      { source: 'Email', users: randomBetween(100, 500), percentage: randomBetween(3, 8) },
    ],
    daily: Array.from({ length: days }, (_, i) => {
      const d = new Date(periodStart)
      d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().split('T')[0],
        users: randomBetween(80, 400),
        sessions: randomBetween(100, 500),
        pageviews: randomBetween(300, 1200),
      }
    }),
  }
}

module.exports = {
  generateToken,
  getDemoMetaAds,
  getDemoInstagram,
  getDemoGoogleAds,
  getDemoAnalytics,
  demoCampaigns,
}
