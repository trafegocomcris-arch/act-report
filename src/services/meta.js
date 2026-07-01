import axios from 'axios'

const GRAPH_API = 'https://graph.facebook.com/v19.0'

export async function fetchMetaInsights(account) {
  const token = account.access_token
  const accountId = account.account_id
  const platform = account.platform

  try {
    if (platform === 'meta_instagram') {
      return await fetchInstagramStats(token, accountId)
    } else {
      return await fetchAdsInsights(token, accountId)
    }
  } catch (err) {
    console.error(`Meta API error: ${err.message}`)
    return getDemoMetrics(platform)
  }
}

async function fetchInstagramStats(token, pageId) {
  if (!token || !pageId) return getDemoMetrics('meta_instagram')

  try {
    const { data: page } = await axios.get(`${GRAPH_API}/${pageId}`, {
      params: { fields: 'name,username,followers_count', access_token: token }
    })

    const since = Math.floor((Date.now() - 30 * 86400000) / 1000)
    const until = Math.floor(Date.now() / 1000)

    const { data: insights } = await axios.get(`${GRAPH_API}/${pageId}/insights`, {
      params: {
        metric: 'reach,impressions,profile_views,email_contacts,phone_call_clicks,website_clicks',
        period: 'day',
        since, until,
        access_token: token
      }
    })

    const metrics = { page_name: page.name, username: page.username, followers: page.followers_count }
    if (insights?.data) {
      insights.data.forEach(m => {
        metrics[m.name] = m.values?.reduce((sum, v) => sum + (v.value || 0), 0) || 0
      })
    }

    return {
      platform: 'Instagram',
      period: '30d',
      ...metrics,
      engagement_rate: metrics.reach ? ((metrics.reach / metrics.followers) * 100).toFixed(2) : '0',
      fetched_at: new Date().toISOString()
    }
  } catch {
    return getDemoMetrics('meta_instagram')
  }
}

function extractPurchases(actions, actionValues) {
  const purchase = (actions || []).find(a => a.action_type === 'purchase')
  const purchaseVal = (actionValues || []).find(a => a.action_type === 'purchase')
  return {
    purchases: parseInt(purchase?.value || 0),
    conversion_value: parseFloat(purchaseVal?.value || 0)
  }
}

function calcROAS(spend, conversionValue) {
  return parseFloat(spend) > 0 ? (conversionValue / parseFloat(spend)) : 0
}

async function fetchAdsInsights(token, adAccountId) {
  if (!token || !adAccountId) return getDemoMetrics('meta_ads')

  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const until = new Date().toISOString().split('T')[0]
    const timeRange = JSON.stringify({ since, until })
    const base = { time_range: timeRange, access_token: token }
    const fields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,conversions,cost_per_conversion,conversion_value,actions,action_values'

    const [accountRes, campaignRes, adRes, regionRes, demoRes, deviceRes] = await Promise.allSettled([
      // 1. Account-level summary
      axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
        params: { ...base, level: 'account', fields }
      }),
      // 2. Campaign-level
      axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
        params: { ...base, level: 'campaign', fields: 'campaign_name,' + fields }
      }),
      // 3. Top 10 ads by spend
      axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
        params: {
          ...base, level: 'ad',
          fields: 'ad_name,' + fields,
          sort: JSON.stringify([{ field: 'spend', direction: 'descending' }]),
          limit: 10
        }
      }),
      // 4. Region breakdown
      axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
        params: { ...base, level: 'account', fields: 'reach,impressions,frequency,spend,cpm', breakdowns: JSON.stringify(['region']) }
      }),
      // 5. Age + Gender breakdown
      axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
        params: { ...base, level: 'account', fields: 'reach,impressions,spend', breakdowns: JSON.stringify(['age', 'gender']) }
      }),
      // 6. Device platform breakdown
      axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
        params: { ...base, level: 'account', fields: 'impressions,reach', breakdowns: JSON.stringify(['device_platform']) }
      })
    ])

    // ── Account level ──
    const accountRow = accountRes.status === 'fulfilled' ? accountRes.value.data.data?.[0] : {}
    const accountActions = accountRow.actions || []
    const accountActionVals = accountRow.action_values || []
    const accountPurchases = extractPurchases(accountActions, accountActionVals)
    const spend = parseFloat(accountRow.spend || 0)

    const result = {
      platform: 'Meta Ads',
      period: '30d',
      spend,
      impressions: parseInt(accountRow.impressions || 0),
      clicks: parseInt(accountRow.clicks || 0),
      ctr: parseFloat(accountRow.ctr || 0),
      cpc: parseFloat(accountRow.cpc || 0),
      cpm: parseFloat(accountRow.cpm || 0),
      reach: parseInt(accountRow.reach || 0),
      frequency: parseFloat(accountRow.frequency || 0),
      conversions: parseInt(accountRow.conversions || 0),
      cost_per_conversion: parseFloat(accountRow.cost_per_conversion || 0),
      conversion_value: accountPurchases.conversion_value,
      roas: calcROAS(spend, accountPurchases.conversion_value),
      campaigns: [],
      topAds: [],
      regions: [],
      demographics: { age: [], gender: [], device: [] },
      fetched_at: new Date().toISOString()
    }

    // ── Campaigns ──
    if (campaignRes.status === 'fulfilled') {
      const rows = campaignRes.value.data.data || []
      result.campaigns = rows.map(r => {
        const a = r.actions || []
        const av = r.action_values || []
        const p = extractPurchases(a, av)
        const s = parseFloat(r.spend || 0)
        return {
          name: r.campaign_name || 'Sem nome',
          spend: s,
          purchases: p.purchases,
          cpa: p.purchases > 0 ? (s / p.purchases) : 0,
          conversion_value: p.conversion_value,
          roas: calcROAS(s, p.conversion_value),
          ctr: parseFloat(r.ctr || 0),
          cpc: parseFloat(r.cpc || 0),
          cpm: parseFloat(r.cpm || 0),
          reach: parseInt(r.reach || 0),
          impressions: parseInt(r.impressions || 0)
        }
      })
    }

    // ── Top Ads ──
    if (adRes.status === 'fulfilled') {
      const rows = adRes.value.data.data || []
      result.topAds = rows.map(r => {
        const a = r.actions || []
        const av = r.action_values || []
        const p = extractPurchases(a, av)
        const s = parseFloat(r.spend || 0)
        return {
          name: r.ad_name || 'Sem nome',
          spend: s,
          purchases: p.purchases,
          cpa: p.purchases > 0 ? (s / p.purchases) : 0,
          conversion_value: p.conversion_value,
          roas: calcROAS(s, p.conversion_value),
          ctr: parseFloat(r.ctr || 0),
          cpc: parseFloat(r.cpc || 0),
          cpm: parseFloat(r.cpm || 0),
          reach: parseInt(r.reach || 0),
          impressions: parseInt(r.impressions || 0)
        }
      })
    }

    // ── Regions ──
    if (regionRes.status === 'fulfilled') {
      const rows = regionRes.value.data.data || []
      result.regions = rows.map(r => ({
        name: r.region || 'Desconhecida',
        reach: parseInt(r.reach || 0),
        impressions: parseInt(r.impressions || 0),
        frequency: parseFloat(r.frequency || 0),
        spend: parseFloat(r.spend || 0),
        cpm: parseFloat(r.cpm || 0)
      }))
    }

    // ── Age + Gender ──
    if (demoRes.status === 'fulfilled') {
      const rows = demoRes.value.data.data || []
      const ageMap = {}
      const genderMap = {}
      for (const r of rows) {
        const age = r.age || 'desconhecida'
        const gender = r.gender || 'unknown'
        if (!ageMap[age]) ageMap[age] = { reach: 0, impressions: 0, spend: 0 }
        ageMap[age].reach += parseInt(r.reach || 0)
        ageMap[age].impressions += parseInt(r.impressions || 0)
        ageMap[age].spend += parseFloat(r.spend || 0)
        if (!genderMap[gender]) genderMap[gender] = { reach: 0, impressions: 0 }
        genderMap[gender].reach += parseInt(r.reach || 0)
        genderMap[gender].impressions += parseInt(r.impressions || 0)
      }
      result.demographics.age = Object.entries(ageMap).map(([k, v]) => ({ age: k, ...v }))
      result.demographics.gender = Object.entries(genderMap).map(([k, v]) => ({ gender: k, ...v }))
    }

    // ── Device ──
    if (deviceRes.status === 'fulfilled') {
      const rows = deviceRes.value.data.data || []
      result.demographics.device = rows.map(r => ({
        device: r.device_platform || 'desconhecido',
        impressions: parseInt(r.impressions || 0),
        reach: parseInt(r.reach || 0)
      }))
    }

    return result
  } catch (err) {
    console.error(`Meta Ads API error: ${err.message}`)
    return getDemoMetrics('meta_ads')
  }
}

export function getDemoMetrics(platform) {
  if (platform === 'meta_instagram') {
    return {
      platform: 'Instagram',
      period: '30d',
      page_name: 'Minha Empresa',
      username: '@minhaempresa',
      followers: 5840,
      reach: 45200,
      impressions: 68200,
      profile_views: 1890,
      email_contacts: 45,
      phone_call_clicks: 28,
      website_clicks: 312,
      engagement_rate: '7.74',
      fetched_at: new Date().toISOString()
    }
  }
  return {
    platform: 'Meta Ads',
    period: '30d',
    spend: 4520.00,
    impressions: 145000,
    clicks: 4200,
    ctr: 2.90,
    cpc: 1.08,
    cpm: 31.17,
    reach: 89000,
    frequency: 1.63,
    conversions: 84,
    cost_per_conversion: 53.81,
    conversion_value: 32450.00,
    roas: 7.18,
    fetched_at: new Date().toISOString(),
    campaigns: [
      {name:'[CBO] [VENDAS] [AUTO] Novos', spend:3150.00, purchases:312, cpa:10.10, conversion_value:42150.00, roas:13.38, ctr:0.68, cpc:0.35, cpm:5.60, reach:88600, impressions:563000},
      {name:'[CBO] [VENDAS] [M] Envolvimento', spend:907.03, purchases:65, cpa:13.95, conversion_value:7888.93, roas:8.70, ctr:0.58, cpc:0.29, cpm:4.06, reach:36773, impressions:223171},
      {name:'[CBO] [VENDAS] [F] Produtos', spend:462.97, purchases:28, cpa:16.53, conversion_value:3410.57, roas:7.37, ctr:0.72, cpc:0.31, cpm:4.89, reach:22100, impressions:94700}
    ],
    topAds: [
      {name:'AD28 - Conjunto Coração', spend:2909.59, purchases:280, cpa:10.39, conversion_value:35082.65, roas:12.06, ctr:0.63, cpc:0.44, cpm:5.75, reach:88990, impressions:506249},
      {name:'COLAR-PERFEITO-ABR-C1', spend:1130.72, purchases:76, cpa:14.88, conversion_value:9795.64, roas:8.66, ctr:0.67, cpc:0.27, cpm:5.37, reach:56798, impressions:210571},
      {name:'AD26 - Kit Perfeito', spend:461.22, purchases:34, cpa:13.57, conversion_value:4683.52, roas:10.15, ctr:0.74, cpc:0.35, cpm:5.51, reach:32580, impressions:83714},
      {name:'Coleção Pérolas Biwa', spend:343.01, purchases:31, cpa:11.06, conversion_value:4102.84, roas:11.96, ctr:0.49, cpc:0.38, cpm:4.78, reach:16971, impressions:71807},
      {name:'AD29 - Nova Coleção Pulseiras', spend:216.18, purchases:26, cpa:8.31, conversion_value:3537.51, roas:16.36, ctr:0.65, cpc:0.44, cpm:6.02, reach:14239, impressions:35896},
      {name:'ANEL-ABR-C1-ST', spend:154.99, purchases:12, cpa:12.92, conversion_value:1453.52, roas:9.38, ctr:1.17, cpc:0.19, cpm:5.59, reach:16055, impressions:27731},
      {name:'Caixinha de Brinco', spend:107.33, purchases:11, cpa:9.76, conversion_value:1672.50, roas:15.58, ctr:0.60, cpc:0.33, cpm:5.05, reach:12137, impressions:21242},
      {name:'AD33 - Pulseiras Pingentes', spend:44.26, purchases:10, cpa:4.43, conversion_value:1175.22, roas:26.55, ctr:0.64, cpc:0.38, cpm:5.07, reach:5408, impressions:8728},
      {name:'COLAR-PERFEITO-ABR-C2', spend:61.43, purchases:8, cpa:7.68, conversion_value:630.00, roas:10.26, ctr:0.78, cpc:0.23, cpm:4.27, reach:8162, impressions:14389},
      {name:'CONJUNTO-OVAL-ABR-C1', spend:79.34, purchases:8, cpa:9.92, conversion_value:826.92, roas:10.42, ctr:0.60, cpc:0.45, cpm:6.41, reach:6967, impressions:12374}
    ],
    regions: [
      {name:'São Paulo', reach:45200, impressions:189000, frequency:4.18, spend:1850.00, cpm:9.79},
      {name:'Rio de Janeiro', reach:18400, impressions:62000, frequency:3.37, spend:680.00, cpm:10.97},
      {name:'Minas Gerais', reach:12200, impressions:41000, frequency:3.36, spend:450.00, cpm:10.98},
      {name:'Bahia', reach:8900, impressions:28000, frequency:3.15, spend:320.00, cpm:11.43},
      {name:'Paraná', reach:7600, impressions:24000, frequency:3.16, spend:280.00, cpm:11.67}
    ],
    demographics: {
      age: [
        {age:'13-17', reach:1200, impressions:2800, spend:45},
        {age:'18-24', reach:18200, impressions:45200, spend:980},
        {age:'25-34', reach:28400, impressions:78400, spend:1520},
        {age:'35-44', reach:19600, impressions:51200, spend:1080},
        {age:'45-54', reach:9800, impressions:23400, spend:520},
        {age:'55-64', reach:4200, impressions:9800, spend:240},
        {age:'65+', reach:1600, impressions:3200, spend:85}
      ],
      gender: [
        {gender:'female', reach:47800, impressions:124000},
        {gender:'male', reach:41200, impressions:108000}
      ],
      device: [
        {device:'mobile', impressions:113100, reach:69420},
        {device:'desktop', impressions:23200, reach:14240},
        {device:'tablet', impressions:8700, reach:5340}
      ]
    }
  }
}
