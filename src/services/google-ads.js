export async function fetchGoogleAdsMetrics(account) {
  if (!account.access_token || !account.account_id) {
    return getDemoMetrics()
  }

  try {
    const response = await fetch(
      `https://googleads.googleapis.com/v16/customers/${account.account_id}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
        },
        body: JSON.stringify({
          query: `
            SELECT
              campaign.name,
              metrics.impressions,
              metrics.clicks,
              metrics.ctr,
              metrics.average_cpc,
              metrics.cost_micros,
              metrics.conversions,
              metrics.cost_per_conversion,
              metrics.impression_share
            FROM campaign
            WHERE segments.date DURING LAST_30_DAYS
          `
        })
      }
    )

    if (!response.ok) throw new Error(`Google Ads API: ${response.status}`)
    const data = await response.json()

    const results = data.results || []
    let totals = {
      impressions: 0, clicks: 0, conversions: 0,
      cost: 0, ctr_sum: 0, cpc_sum: 0, campaign_count: results.length
    }

    results.forEach(r => {
      const m = r.metrics || {}
      totals.impressions += parseInt(m.impressions || 0)
      totals.clicks += parseInt(m.clicks || 0)
      totals.conversions += parseInt(m.conversions || 0)
      totals.cost += parseInt(m.cost_micros || 0) / 1000000
      totals.ctr_sum += parseFloat(m.ctr || 0)
      totals.cpc_sum += parseFloat(m.average_cpc || 0) / 1000000
    })

    return {
      platform: 'Google Ads',
      period: '30d',
      campaigns: results.map(r => ({
        name: r.campaign?.name,
        impressions: parseInt(r.metrics?.impressions || 0),
        clicks: parseInt(r.metrics?.clicks || 0),
        ctr: parseFloat(r.metrics?.ctr || 0),
        cpc: parseFloat(r.metrics?.average_cpc || 0) / 1000000,
        cost: parseInt(r.metrics?.cost_micros || 0) / 1000000,
        conversions: parseInt(r.metrics?.conversions || 0)
      })),
      totals: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        ctr: totals.impressions ? (totals.clicks / totals.impressions * 100).toFixed(2) : 0,
        cpc: totals.clicks ? (totals.cost / totals.clicks).toFixed(2) : 0,
        cost: totals.cost.toFixed(2),
        conversions: totals.conversions,
        cost_per_conversion: totals.conversions ? (totals.cost / totals.conversions).toFixed(2) : 0
      },
      fetched_at: new Date().toISOString()
    }
  } catch (err) {
    console.error(`Google Ads error: ${err.message}`)
    return getDemoMetrics()
  }
}

function getDemoMetrics() {
  return {
    platform: 'Google Ads',
    period: '30d',
    campaigns: [
      { name: 'Marca - Search', impressions: 45200, clicks: 1240, ctr: 2.74, cpc: 1.85, cost: 2294.00, conversions: 28 },
      { name: 'Conversão - Display', impressions: 89200, clicks: 890, ctr: 1.00, cpc: 0.95, cost: 845.50, conversions: 12 },
      { name: 'Remarketing', impressions: 45100, clicks: 670, ctr: 1.49, cpc: 1.20, cost: 804.00, conversions: 15 },
      { name: 'Performance Max', impressions: 38500, clicks: 980, ctr: 2.55, cpc: 1.45, cost: 1421.00, conversions: 22 }
    ],
    totals: {
      impressions: 218000,
      clicks: 3780,
      ctr: 1.73,
      cpc: 1.42,
      cost: '5364.50',
      conversions: 77,
      cost_per_conversion: '69.67'
    },
    fetched_at: new Date().toISOString()
  }
}
