function formatCurrency(val) {
  if (val == null) return 'R$ 0,00'
  return 'R$ ' + Number(val).toFixed(2).replace('.', ',')
}

function formatNumber(val) {
  if (val == null) return '0'
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.', ',') + 'k'
  return String(val)
}

function formatPercent(val) {
  if (val == null) return '0%'
  return (val > 0 ? '+' : '') + Number(val).toFixed(1).replace('.', ',') + '%'
}

function renderReportHtml({ client_name, title, period_start, period_end, data, generated_at }) {
  const m = data.meta_ads
  const ig = data.instagram
  const ga = data.google_ads
  const an = data.analytics

  const metaSection = m ? `
    <div style="margin-bottom:40px">
      <h2 style="color:#F5B113;margin-bottom:20px;font-size:1.3rem">📊 Meta Ads</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Investimento</div>
          <div style="font-size:1.2rem;font-weight:800">${formatCurrency(m.summary.spend)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(m.summary.spendChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Alcance</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(m.summary.reach)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(m.summary.reach)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">ROAS</div>
          <div style="font-size:1.2rem;font-weight:800">${m.summary.roas}x</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(m.summary.roasChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Conversões</div>
          <div style="font-size:1.2rem;font-weight:800">${m.summary.conversions}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(m.summary.conversionsChange)}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
        <thead><tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">Campanha</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">Inv.</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">ROAS</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">CTR</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">Conv.</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">CPA</th>
        </tr></thead>
        <tbody>
          ${m.campaigns.map(c => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${c.name}</strong></td>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right">${formatCurrency(c.spent)}</td>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right;color:#F5B113;font-weight:600">${c.roas}x</td>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right">${c.ctr}%</td>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right">${c.conversions}</td>
              <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right">${formatCurrency(c.cpa)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''

  const igSection = ig ? `
    <div style="margin-bottom:40px">
      <h2 style="color:#F5B113;margin-bottom:20px;font-size:1.3rem">📱 Instagram</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Seguidores</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(ig.summary.followers)}</div>
          <div style="font-size:0.7rem;color:#22C55E">+${ig.summary.followersGrowth}%</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Alcance</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(ig.summary.reach)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(ig.summary.reachChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Engajamento</div>
          <div style="font-size:1.2rem;font-weight:800">${ig.summary.engagement}%</div>
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.5)">${formatPercent(ig.summary.engagementChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Cliques Site</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(ig.summary.websiteClicks)}</div>
        </div>
      </div>
    </div>
  ` : ''

  const gaSection = ga ? `
    <div style="margin-bottom:40px">
      <h2 style="color:#F5B113;margin-bottom:20px;font-size:1.3rem">🔍 Google Ads</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Investimento</div>
          <div style="font-size:1.2rem;font-weight:800">${formatCurrency(ga.summary.spend)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(ga.summary.spendChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Cliques</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(ga.summary.clicks)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(ga.summary.clicksChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">CTR</div>
          <div style="font-size:1.2rem;font-weight:800">${ga.summary.ctr}%</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">ROAS</div>
          <div style="font-size:1.2rem;font-weight:800">${ga.summary.roas}x</div>
        </div>
      </div>
    </div>
  ` : ''

  const anSection = an ? `
    <div style="margin-bottom:40px">
      <h2 style="color:#F5B113;margin-bottom:20px;font-size:1.3rem">📈 Google Analytics</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Usuários</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(an.summary.users)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(an.summary.usersChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Sessões</div>
          <div style="font-size:1.2rem;font-weight:800">${formatNumber(an.summary.sessions)}</div>
          <div style="font-size:0.7rem;color:#22C55E">${formatPercent(an.summary.sessionChange)}</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Taxa Rejeição</div>
          <div style="font-size:1.2rem;font-weight:800">${an.summary.bounceRate}%</div>
        </div>
        <div style="background:#161616;border:1px solid #222;border-radius:10px;padding:14px">
          <div style="font-size:0.7rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px">Duração Média</div>
          <div style="font-size:1.2rem;font-weight:800">${Math.floor(an.summary.avgSessionDuration / 60)}m ${an.summary.avgSessionDuration % 60}s</div>
        </div>
      </div>
      ${an.sources ? `
        <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
          <thead><tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">Fonte</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">Usuários</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #222;color:rgba(255,255,255,0.5);font-size:0.65rem;text-transform:uppercase">%</th>
          </tr></thead>
          <tbody>
            ${an.sources.map(s => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)">${s.source}</td>
                <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right">${formatNumber(s.users)}</td>
                <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right">${s.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — ReportACT</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#0E0E0E;color:#fff;line-height:1.6;padding:40px 20px}
  .container{max-width:900px;margin:0 auto}
  h1{font-family:'Manrope',sans-serif;font-weight:900;letter-spacing:-0.5px;font-size:1.6rem;margin-bottom:4px}
  .report-header{margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #222}
  .report-meta{color:rgba(255,255,255,0.5);font-size:0.8rem}
  .report-client{color:#F5B113;font-size:0.9rem;margin-bottom:4px}
  @media print{body{background:#fff;color:#000}.report-meta{color:#666}.report-header{border-bottom-color:#ddd}}
</style>
</head>
<body>
<div class="container">
  <div class="report-header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <h1>${title}</h1>
        <div class="report-client">${client_name || '{{client_name}}'}</div>
        <div class="report-meta">${period_start} a ${period_end}</div>
      </div>
      <div style="text-align:right;font-size:0.75rem;color:rgba(255,255,255,0.4)">
        <div style="font-family:'Manrope',sans-serif;font-weight:900;color:#F5B113">ReportACT</div>
        Gerado em ${new Date(generated_at).toLocaleDateString('pt-BR')}
      </div>
    </div>
  </div>

  ${metaSection}
  ${igSection}
  ${gaSection}
  ${anSection}

  <div style="text-align:center;padding-top:24px;border-top:1px solid #222;font-size:0.75rem;color:rgba(255,255,255,0.3)">
    Relatório gerado por ReportACT — um produto ACT Control
  </div>
</div>
</body>
</html>`
}

function renderDashboardHtml({ client_name, title, slug, config, data }) {
  const charts = config.charts || ['overview', 'social', 'ads', 'analytics']
  const m = data.meta_ads
  const ig = data.instagram
  const ga = data.google_ads
  const an = data.analytics

  const dailyLabels = JSON.stringify((m?.daily || []).map(d => d.date.slice(5)))
  const dailySpend = JSON.stringify((m?.daily || []).map(d => d.spend))
  const dailyConversions = JSON.stringify((m?.daily || []).map(d => d.conversions))
  const follLabels = JSON.stringify((ig?.followersGrowth || []).map(f => f.date.slice(5)))
  const follData = JSON.stringify((ig?.followersGrowth || []).map(f => f.followers))

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — ReportACT</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><'/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#0E0E0E;color:#fff;line-height:1.6}
  .header{padding:24px;border-bottom:1px solid #222;background:#161616}
  .header h1{font-family:'Manrope',sans-serif;font-weight:900;font-size:1.3rem;letter-spacing:-0.3px}
  .header h1 em{font-style:normal;color:#F5B113}
  .header .sub{color:rgba(255,255,255,0.5);font-size:0.8rem;margin-top:2px}
  .content{padding:20px;max-width:1000px;margin:0 auto}
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px}
  .kpi{background:#161616;border:1px solid #222;border-radius:10px;padding:16px}
  .kpi .lb{font-size:0.65rem;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:4px}
  .kpi .vl{font-family:'Manrope',sans-serif;font-size:1.3rem;font-weight:800}
  .kpi .ch{font-size:0.7rem;color:#22C55E}
  .chart-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .chart-card{background:#161616;border:1px solid #222;border-radius:10px;padding:16px}
  .chart-card h3{font-size:0.85rem;font-weight:700;margin-bottom:12px;color:rgba(255,255,255,0.8)}
  .chart-card canvas{max-height:220px}
  .full{grid-column:1/-1}
  @media(max-width:640px){.chart-row{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="header">
  <h1><em>Report</em>ACT · ${title}</h1>
  <div class="sub">${client_name}</div>
</div>
<div class="content">
  ${m ? `
  <div class="kpi-grid">
    <div class="kpi"><div class="lb">Investimento</div><div class="vl">${formatCurrency(m.summary.spend)}</div><div class="ch">${formatPercent(m.summary.spendChange)}</div></div>
    <div class="kpi"><div class="lb">Alcance</div><div class="vl">${formatNumber(m.summary.reach)}</div><div class="ch">${formatPercent(m.summary.reach)}</div></div>
    <div class="kpi"><div class="lb">ROAS</div><div class="vl">${m.summary.roas}x</div><div class="ch">${formatPercent(m.summary.roasChange)}</div></div>
    <div class="kpi"><div class="lb">Conversões</div><div class="vl">${m.summary.conversions}</div><div class="ch">${formatPercent(m.summary.conversionsChange)}</div></div>
  </div>
  ` : ''}
  ${ig ? `
  <div class="kpi-grid">
    <div class="kpi"><div class="lb">Seguidores</div><div class="vl">${formatNumber(ig.summary.followers)}</div><div class="ch">+${ig.summary.followersGrowth}%</div></div>
    <div class="kpi"><div class="lb">Alcance</div><div class="vl">${formatNumber(ig.summary.reach)}</div></div>
    <div class="kpi"><div class="lb">Engajamento</div><div class="vl">${ig.summary.engagement}%</div></div>
    <div class="kpi"><div class="lb">Cliques Site</div><div class="vl">${formatNumber(ig.summary.websiteClicks)}</div></div>
  </div>
  ` : ''}
  ${an ? `
  <div class="kpi-grid">
    <div class="kpi"><div class="lb">Usuários</div><div class="vl">${formatNumber(an.summary.users)}</div><div class="ch">${formatPercent(an.summary.usersChange)}</div></div>
    <div class="kpi"><div class="lb">Sessões</div><div class="vl">${formatNumber(an.summary.sessions)}</div></div>
    <div class="kpi"><div class="lb">Taxa Rejeição</div><div class="vl">${an.summary.bounceRate}%</div></div>
    <div class="kpi"><div class="lb">Duração</div><div class="vl">${Math.floor(an.summary.avgSessionDuration / 60)}m ${an.summary.avgSessionDuration % 60}s</div></div>
  </div>
  ` : ''}

  <div class="chart-row">
    <div class="chart-card${charts.includes('overview') ? '' : ''}">
      <h3>Investimento Diário (Meta Ads)</h3>
      <canvas id="chartSpend"></canvas>
    </div>
    <div class="chart-card">
      <h3>Conversões Diárias</h3>
      <canvas id="chartConversions"></canvas>
    </div>
    ${ig ? `
    <div class="chart-card">
      <h3>Crescimento de Seguidores</h3>
      <canvas id="chartFollowers"></canvas>
    </div>
    ` : ''}
    ${an?.sources ? `
    <div class="chart-card">
      <h3>Tráfego por Fonte</h3>
      <canvas id="chartSources"></canvas>
    </div>
    ` : ''}
  </div>
</div>

<script>
new Chart(document.getElementById('chartSpend'), {
  type:'bar', data:{
    labels:${dailyLabels},
    datasets:[{label:'Investimento',data:${dailySpend},backgroundColor:'rgba(245,177,19,0.6)',borderColor:'#F5B113',borderWidth:1}]
  },
  options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.04)'}},x:{grid:{display:false}}}}
})
new Chart(document.getElementById('chartConversions'), {
  type:'line', data:{
    labels:${dailyLabels},
    datasets:[{label:'Conversões',data:${dailyConversions},borderColor:'#22C55E',backgroundColor:'rgba(34,197,94,0.1)',fill:true,tension:0.3}]
  },
  options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(255,255,255,0.04)'}},x:{grid:{display:false}}}}
})
${ig ? `
new Chart(document.getElementById('chartFollowers'), {
  type:'line', data:{
    labels:${follLabels},
    datasets:[{label:'Seguidores',data:${follData},borderColor:'#E1306C',backgroundColor:'rgba(225,48,108,0.1)',fill:true,tension:0.3}]
  },
  options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:false,grid:{color:'rgba(255,255,255,0.04)'}},x:{grid:{display:false}}}}
})
` : ''}
${an?.sources ? `
new Chart(document.getElementById('chartSources'), {
  type:'doughnut', data:{
    labels:${JSON.stringify(an.sources.map(s => s.source))},
    datasets:[{data:${JSON.stringify(an.sources.map(s => s.users))},backgroundColor:['#F5B113','#3B82F6','#22C55E','#EF4444','#8B5CF6','#EC4899','#6366F1']}]
  },
  options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'bottom',labels:{color:'rgba(255,255,255,0.7)',font:{size:11}}}}}
})
` : ''}
</script>
</body>
</html>`
}

module.exports = { renderReportHtml, renderDashboardHtml }
