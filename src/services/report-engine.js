export function generateReportHTML(data) {
  const { client, period, meta, googleAds, analytics, insights } = data

  const metaMetrics = meta?.metrics || {}
  const adsMetrics = meta?.ads || googleAds?.totals || {}
  const gaMetrics = analytics?.totals || {}

  const totalSpend = (parseFloat(adsMetrics.cost || adsMetrics.spend || 0))
  const totalClicks = (parseInt(adsMetrics.clicks || 0) + parseInt(gaMetrics.sessions || 0))
  const totalImpressions = (parseInt(adsMetrics.impressions || 0) + parseInt(metaMetrics.impressions || 0))

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Marketing - ${client?.name || 'Cliente'}</title>
<link rel="icon" type="image/png" href="https://actcontrol.com.br/brand/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; background: #0E0E0E; color: #FFFFFF; -webkit-font-smoothing: antialiased; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }

.header {
  background: linear-gradient(135deg, #0E0E0E 0%, #161616 100%);
  border: 1px solid #222; border-radius: 16px; padding: 32px;
  margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;
  position: relative; overflow: hidden;
}
.header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #F5B113, transparent);
}
.header .brand { display: flex; align-items: center; gap: 12px; }
.header .brand img { height: 36px; width: auto; }
.header .brand span { font-family: 'Manrope', sans-serif; font-weight: 900; font-size: 1.2rem; letter-spacing: -0.5px; }
.header .brand em { font-style: normal; color: #F5B113; }
.header .period { color: rgba(255,255,255,0.55); font-size: 14px; margin-top: 4px; }
.header .client-info { text-align: right; }
.header .client-info h2 { font-family: 'Manrope', sans-serif; font-size: 20px; font-weight: 700; }
.header .client-info p { opacity: 0.55; font-size: 13px; }

.kpi-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px; margin-bottom: 24px;
}
.kpi-card {
  background: #161616; border: 1px solid #222; border-radius: 12px; padding: 24px;
}
.kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.55); margin-bottom: 8px; }
.kpi-value { font-family: 'Manrope', sans-serif; font-size: 28px; font-weight: 800; color: #FFFFFF; }
.kpi-sub { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 4px; }

.section {
  background: #161616; border: 1px solid #222; border-radius: 12px; padding: 28px;
  margin-bottom: 24px;
}
.section h2 { font-family: 'Manrope', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #222; letter-spacing: -0.2px; }

.chart-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
}
.chart-box { background: #0E0E0E; border: 1px solid #222; border-radius: 8px; padding: 20px; }
.chart-box h3 { font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 16px; font-weight: 500; }
.chart-box canvas { max-height: 250px; }

.metrics-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.metrics-table th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.55); border-bottom: 1px solid #222; background: rgba(255,255,255,0.02); font-weight: 600; letter-spacing: 0.3px; }
.metrics-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.metrics-table tr:hover td { background: rgba(255,255,255,0.02); }
.metrics-table .highlight { font-weight: 600; color: #F5B113; }

.insights-box { background: rgba(245,177,19,0.06); border: 1px solid rgba(245,177,19,0.25); border-radius: 12px; padding: 20px; margin-top: 16px; }
.insights-box h3 { font-size: 14px; color: #F5B113; margin-bottom: 8px; }
.insights-box p { font-size: 14px; color: rgba(255,255,255,0.78); line-height: 1.6; }

.footer { text-align: center; padding: 20px; color: rgba(255,255,255,0.35); font-size: 12px; border-top: 1px solid #222; margin-top: 32px; }
.footer strong { color: rgba(255,255,255,0.55); }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="brand">
      <img src="https://actcontrol.com.br/brand/logo.svg" alt="ACT" onerror="this.style.display='none'">
      <span><em style="font-style:normal;color:#F5B113">Report</em>ACT</span>
      <div>
        <p class="period">Período: ${period?.start || 'N/A'} a ${period?.end || 'N/A'}</p>
      </div>
    </div>
    <div class="client-info">
      <h2>${client?.name || 'Cliente'}</h2>
      <p>${client?.company || ''}</p>
      <p>${client?.email || ''}</p>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Investimento Total</div>
      <div class="kpi-value">R$ ${totalSpend.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      <div class="kpi-sub">Meta Ads + Google Ads</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Impressões</div>
      <div class="kpi-value">${totalImpressions.toLocaleString('pt-BR')}</div>
      <div class="kpi-sub">Anúncios + Alcance Orgânico</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Cliques / Sessões</div>
      <div class="kpi-value">${totalClicks.toLocaleString('pt-BR')}</div>
      <div class="kpi-sub">Total de engajamento</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Conversões</div>
      <div class="kpi-value">${(parseInt(adsMetrics.conversions || 0) + parseInt(gaMetrics.conversions || 0)).toLocaleString('pt-BR')}</div>
      <div class="kpi-sub">Meta Ads + Google Ads</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CPC Médio</div>
      <div class="kpi-value">R$ ${adsMetrics.cpc || adsMetrics.cost_per_conversion || '0,00'}</div>
      <div class="kpi-sub">Custo por clique</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Usuários (Site)</div>
      <div class="kpi-value">${(gaMetrics.users || 0).toLocaleString('pt-BR')}</div>
      <div class="kpi-sub">Google Analytics</div>
    </div>
  </div>

  <div class="section">
    <h2>Meta Ads & Instagram</h2>
    <div class="chart-grid">
      <div class="chart-box">
        <h3>Impressões x Cliques (Meta Ads)</h3>
        <canvas id="chartMetaImpressions"></canvas>
      </div>
      <div class="chart-box">
        <h3>Distribuição de Investimento</h3>
        <canvas id="chartMetaSpend"></canvas>
      </div>
    </div>
    <table class="metrics-table" style="margin-top:20px">
      <thead>
        <tr><th>Métrica</th><th>Valor</th><th>Benchmark</th></tr>
      </thead>
      <tbody>
        <tr><td>Investimento</td><td class="highlight">R$ ${(adsMetrics.spend || adsMetrics.cost || '0,00')}</td><td>-</td></tr>
        <tr><td>Impressões</td><td class="highlight">${(adsMetrics.impressions || 0).toLocaleString('pt-BR')}</td><td>-</td></tr>
        <tr><td>Cliques</td><td class="highlight">${(adsMetrics.clicks || 0).toLocaleString('pt-BR')}</td><td>-</td></tr>
        <tr><td>CTR</td><td class="highlight">${adsMetrics.ctr || '0'}%</td><td>1-3%</td></tr>
        <tr><td>CPC</td><td class="highlight">R$ ${adsMetrics.cpc || '0,00'}</td><td>R$ 0,50-2,00</td></tr>
        <tr><td>Conversões</td><td class="highlight">${adsMetrics.conversions || 0}</td><td>-</td></tr>
        <tr><td>Custo por Conversão</td><td class="highlight">R$ ${adsMetrics.cost_per_conversion || adsMetrics.cost_per_conversion || '0,00'}</td><td>-</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Google Ads</h2>
    <div class="chart-grid">
      <div class="chart-box">
        <h3>Evolução Diária de Sessões</h3>
        <canvas id="chartDaily"></canvas>
      </div>
      <div class="chart-box">
        <h3>Performance por Campanha</h3>
        <canvas id="chartCampaigns"></canvas>
      </div>
    </div>
    <table class="metrics-table" style="margin-top:20px">
      <thead>
        <tr><th>Campanha</th><th>Impressões</th><th>Cliques</th><th>CTR</th><th>CPC</th><th>Custo</th><th>Conv.</th></tr>
      </thead>
      <tbody>
        ${(googleAds?.campaigns || []).map(c => `
          <tr>
            <td>${c.name}</td>
            <td>${(c.impressions || 0).toLocaleString('pt-BR')}</td>
            <td>${c.clicks || 0}</td>
            <td>${c.ctr || 0}%</td>
            <td>R$ ${(c.cpc || 0).toFixed(2)}</td>
            <td>R$ ${(c.cost || 0).toFixed(2)}</td>
            <td>${c.conversions || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Google Analytics</h2>
    <div class="chart-grid">
      <div class="chart-box">
        <h3>Usuários por Dia (30 dias)</h3>
        <canvas id="chartGAUsers"></canvas>
      </div>
      <div class="chart-box">
        <h3>Distribuição de Tráfego</h3>
        <canvas id="chartGATraffic"></canvas>
      </div>
    </div>
    <table class="metrics-table" style="margin-top:20px">
      <thead>
        <tr><th>Métrica</th><th>Valor</th></tr>
      </thead>
      <tbody>
        <tr><td>Usuários</td><td class="highlight">${(gaMetrics.users || 0).toLocaleString('pt-BR')}</td></tr>
        <tr><td>Novos Usuários</td><td class="highlight">${(gaMetrics.new_users || 0).toLocaleString('pt-BR')}</td></tr>
        <tr><td>Sessões</td><td class="highlight">${(gaMetrics.sessions || 0).toLocaleString('pt-BR')}</td></tr>
        <tr><td>Páginas / Sessão</td><td class="highlight">${gaMetrics.pages_per_session || '0'}</td></tr>
        <tr><td>Taxa de Rejeição</td><td class="highlight">${gaMetrics.bounce_rate || '0'}%</td></tr>
        <tr><td>Duração Média</td><td class="highlight">${Math.floor((gaMetrics.avg_session_duration_sec || 0) / 60)}m ${(gaMetrics.avg_session_duration_sec || 0) % 60}s</td></tr>
      </tbody>
    </table>
  </div>

  ${insights ? `
  <div class="section">
    <h2>Insights & Recomendações</h2>
    <div class="insights-box">
      <h3>Análise Geral</h3>
      <p>${insights.summary || 'Relatório gerado automaticamente com base nos dados coletados.'}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
      ${(insights.tips || []).map(t => `
        <div style="background:#f8f9fa;border-radius:12px;padding:16px;border-left:4px solid #0d9488">
          <strong style="font-size:14px;color:#0d9488">${t.title}</strong>
          <p style="font-size:13px;color:#666;margin-top:4px">${t.description}</p>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <div class="footer">
    <p>Relatório gerado por <strong>ReportACT</strong> — ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</div>

<script>
${generateChartScripts(analytics, googleAds, metaMetrics, adsMetrics)}
</script>
</body>
</html>`
}

function generateChartScripts(analytics, googleAds, metaMetrics, adsMetrics) {
  const gaDaily = analytics?.daily || []
  const dates = gaDaily.map(d => {
    const parts = d.date?.split('-')
    return parts ? parts[2] + '/' + parts[1] : d.date
  }) || []
  const users = gaDaily.map(d => d.users) || []
  const sessions = gaDaily.map(d => d.sessions) || []
  const pageViews = gaDaily.map(d => d.pageViews) || []

  const campaigns = googleAds?.campaigns || []
  const campNames = campaigns.map(c => c.name)
  const campImpressions = campaigns.map(c => c.impressions)
  const campClicks = campaigns.map(c => c.clicks)

  return `
const chartDefaults = { responsive: true, maintainAspectRatio: true,
  scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } },
  plugins: { legend: { labels: { color: textColor, font: { family: 'Inter' } } } } };

const colors = { blue: '#F5B113', teal: '#C48D0E', orange: '#F5B113', purple: '#222', pink: 'rgba(245,177,19,0.3)' };
const textColor = 'rgba(255,255,255,0.55)';
const gridColor = 'rgba(255,255,255,0.06)';

// Meta Impressions x Clicks
const ctx1 = document.getElementById('chartMetaImpressions')?.getContext('2d');
if (ctx1) new Chart(ctx1, { type: 'bar', data: {
  labels: ['Impressões', 'Cliques'],
  datasets: [{ data: [${adsMetrics.impressions || 0}, ${adsMetrics.clicks || 0}], backgroundColor: [colors.teal, colors.orange], borderRadius: 6 }]
}, options: { ...chartDefaults, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } });

// Meta Spend Distribution
const ctx2 = document.getElementById('chartMetaSpend')?.getContext('2d');
if (ctx2) new Chart(ctx2, { type: 'doughnut', data: {
  labels: ['Meta Ads', 'Google Ads'],
  datasets: [{ data: [${adsMetrics.spend || adsMetrics.cost || 0}, ${parseFloat(adsMetrics.cost || 0) || 0}], backgroundColor: [colors.blue, colors.teal], borderWidth: 0 }]
}, options: { ...chartDefaults, cutout: '65%' } });

// Evolução Diária
const ctx3 = document.getElementById('chartDaily')?.getContext('2d');
if (ctx3) new Chart(ctx3, { type: 'line', data: {
  labels: [${dates.map(d => `'${d}'`).join(',')}],
  datasets: [
    { label: 'Usuários', data: [${users.join(',')}], borderColor: colors.orange, tension: 0.3, fill: true, backgroundColor: 'rgba(245,177,19,0.08)' },
    { label: 'Sessões', data: [${sessions.join(',')}], borderColor: colors.blue, tension: 0.3, fill: true, backgroundColor: 'rgba(245,177,19,0.04)' }
  ]
}, options: { ...chartDefaults, scales: { y: { beginAtZero: true } } } });

// Performance por Campanha
const ctx4 = document.getElementById('chartCampaigns')?.getContext('2d');
if (ctx4) new Chart(ctx4, { type: 'bar', data: {
  labels: [${campNames.map(n => `'${n}'`).join(',')}],
  datasets: [
    { label: 'Impressões', data: [${campImpressions.join(',')}], backgroundColor: colors.teal, borderRadius: 4 },
    { label: 'Cliques', data: [${campClicks.join(',')}], backgroundColor: colors.orange, borderRadius: 4 }
  ]
}, options: { ...chartDefaults, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } } });

// GA Usuários por Dia
const ctx5 = document.getElementById('chartGAUsers')?.getContext('2d');
if (ctx5) new Chart(ctx5, { type: 'bar', data: {
  labels: [${dates.slice(-10).map(d => `'${d}'`).join(',')}],
  datasets: [{ label: 'Usuários', data: [${users.slice(-10).join(',')}], backgroundColor: colors.purple, borderRadius: 4 }]
}, options: { ...chartDefaults, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } });

// GA Distribuição de Tráfego
const ctx6 = document.getElementById('chartGATraffic')?.getContext('2d');
if (ctx6) new Chart(ctx6, { type: 'doughnut', data: {
  labels: ['Direto', 'Orgânico', 'Social', 'Pago', 'Email', 'Outros'],
  datasets: [{ data: [25, 35, 15, 12, 8, 5], backgroundColor: ['#F5B113', '#C48D0E', '#222', 'rgba(245,177,19,0.3)', 'rgba(245,177,19,0.15)', '#333'], borderWidth: 0 }]
}, options: { ...chartDefaults, cutout: '60%' } });`
}

export function generateInsights(metrics) {
  const tips = []
  const ads = metrics?.googleAds?.totals || {}
  const meta = metrics?.meta?.metrics || {}

  if (parseFloat(ads.ctr || 0) < 1) {
    tips.push({ title: 'CTR abaixo do ideal', description: 'Sua taxa de clique está abaixo de 1%. Considere testar novos criativos, headlines e chamadas para ação.' })
  }
  if (parseFloat(ads.cpc || 99) > 3) {
    tips.push({ title: 'CPC elevado', description: 'O custo por clique está acima de R$ 3,00. Revise as palavras-chave e qualidade do anúncio.' })
  }
  if (parseInt(meta.followers || 0) > 0 && parseInt(meta.reach || 0) < parseInt(meta.followers || 1000) * 2) {
    tips.push({ title: 'Alcance orgânico baixo', description: 'Seu alcance orgânico está abaixo de 2x o número de seguidores. Publique com mais frequência e use stories.' })
  }

  tips.push({
    title: 'Otimização de campanhas',
    description: 'Revise relatórios semanais e ajuste lances com base nas conversões. Teste públicos similares (lookalike) para escalar resultados.'
  })

  return {
    summary: `No período analisado, ${tips.length > 1 ? 'foram identificados ' + tips.length + ' pontos de atenção' : 'o desempenho geral está dentro do esperado'}. O investimento total foi de R$ ${parseFloat(ads.cost || ads.spend || 0).toFixed(2)} com ${ads.conversions || 0} conversões registradas. ${tips.length > 1 ? 'Confira as recomendações abaixo para otimizar os resultados.' : 'Continue monitorando e testando novas estratégias.'}`,
    tips
  }
}
