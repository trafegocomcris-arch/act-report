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

async function fetchAdsInsights(token, adAccountId) {
  if (!token || !adAccountId) return getDemoMetrics('meta_ads')

  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const until = new Date().toISOString().split('T')[0]

    const { data } = await axios.get(`${GRAPH_API}/act_${adAccountId}/insights`, {
      params: {
        fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,conversions,cost_per_conversion',
        level: 'account',
        time_range: JSON.stringify({ since, until }),
        access_token: token
      }
    })

    const d = data.data?.[0] || {}
    return {
      platform: 'Meta Ads',
      period: '30d',
      spend: parseFloat(d.spend || 0),
      impressions: parseInt(d.impressions || 0),
      clicks: parseInt(d.clicks || 0),
      ctr: parseFloat(d.ctr || 0),
      cpc: parseFloat(d.cpc || 0),
      cpm: parseFloat(d.cpm || 0),
      reach: parseInt(d.reach || 0),
      frequency: parseFloat(d.frequency || 0),
      conversions: parseInt(d.conversions || 0),
      cost_per_conversion: parseFloat(d.cost_per_conversion || 0),
      fetched_at: new Date().toISOString()
    }
  } catch {
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
    fetched_at: new Date().toISOString()
  }
}
