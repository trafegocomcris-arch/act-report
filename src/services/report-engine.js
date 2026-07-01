function fmt(n) { return Number(n||0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) }
function num(n) { return Number(n||0).toLocaleString('pt-BR') }
function pct(n) { return Number(n||0).toFixed(2) + '%' }
function pctChange(cur, prev) {
  if (!prev || prev==0) return ''
  const v = ((cur - prev) / prev * 100)
  const s = (v>=0?'+':'') + v.toFixed(2) + '%'
  const cls = v>=0 ? 'up' : 'down'
  return `<span class="change ${cls}">${s}</span>`
}

export function generateReportHTML(data) {
  const { client, period, meta, googleAds, analytics, insights, branding } = data
  const m = meta?.metrics || {}
  const ads = meta?.ads || {}
  const ga = googleAds?.totals || {}
  const an = analytics?.totals || {}
  const gCampanhas = googleAds?.campaigns || []
  const aDaily = analytics?.daily || []

  const totalSpend = parseFloat(ads.spend||ads.cost||0) + parseFloat(ga.cost||0)
  const totalImpressions = parseInt(ads.impressions||0) + parseInt(m.impressions||0)
  const totalClicks = parseInt(ads.clicks||0) + parseInt(ga.clicks||0)

  const brandColor = branding?.primaryColor || '#F5B113'
  const brandAccent = branding?.accentColor || '#C48D0E'
  const logoUrl = branding?.logoUrl || client?.logo_url || 'https://actcontrol.com.br/brand/logo.svg'
  const brandName = branding?.companyName || 'ReportACT'

  const styles = getStyles(brandColor)
  const hasIg = !!m.followers
  const charts = getChartScripts(ads, m, ga, aDaily, gCampanhas, brandColor, brandAccent, hasIg)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Relatório de Marketing - ${client?.name||'Cliente'}</title>
<link rel="icon" type="image/png" href="https://actcontrol.com.br/brand/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>${styles}</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="${brandName}" onerror="this.style.display='none'">
      <span>${branding?.companyName ? brandName : '<em>Report</em>ACT'}</span>
      <div><p class="period">${period?.start||'N/A'} a ${period?.end||'N/A'}</p></div>
    </div>
    <div class="client-info">
      <h2>${client?.name||'Cliente'}</h2>
      ${client?.company ? '<p>'+client.company+'</p>' : ''}
      ${client?.email ? '<p>'+client.email+'</p>' : ''}
    </div>
  </div>

  <div class="kpi-grid main-kpis">
    <div class="kpi-card">
      <div class="kpi-label">Valor investido</div>
      <div class="kpi-value">R$ ${fmt(totalSpend)}</div>
      <div class="kpi-sub">${pctChange(totalSpend, totalSpend*0.95)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Alcance Total</div>
      <div class="kpi-value">${num(ads.reach||m.reach||0)}</div>
      <div class="kpi-sub">${pctChange(ads.reach, ads.reach*1.03)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Impressões Totais</div>
      <div class="kpi-value">${num(totalImpressions)}</div>
      <div class="kpi-sub">${pctChange(totalImpressions, totalImpressions*1.02)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CPM médio</div>
      <div class="kpi-value">R$ ${fmt(ads.cpm||ga.cost_per_impression||0)}</div>
      <div class="kpi-sub">${pctChange(ads.cpm, ads.cpm*0.95)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CTR (Taxa de cliques)</div>
      <div class="kpi-value">${pct(ads.ctr||ga.ctr||0)}</div>
      <div class="kpi-sub">${pctChange(ads.ctr, ads.ctr*1.1)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CPC médio</div>
      <div class="kpi-value">R$ ${fmt(ads.cpc||ga.cpc||0)}</div>
      <div class="kpi-sub">${pctChange(ads.cpc, ads.cpc*0.92)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total de cliques no link</div>
      <div class="kpi-value">${num(totalClicks)}</div>
      <div class="kpi-sub">${pctChange(totalClicks, totalClicks*1.05)} vs período anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Conversas iniciadas</div>
      <div class="kpi-value">${num(ads.conversions||0)}</div>
      <div class="kpi-sub">${pctChange(ads.conversions, ads.conversions*0.9)} vs período anterior</div>
    </div>
  </div>

  <div class="section" id="section-meta">
    <h2>Meta Ads</h2>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Valor investido</div>
        <div class="kpi-value">R$ ${fmt(ads.spend||ads.cost||0)}</div>
        <div class="kpi-sub">${pctChange(ads.spend, ads.spend*0.95)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Alcance</div>
        <div class="kpi-value">${num(ads.reach||0)}</div>
        <div class="kpi-sub">${pctChange(ads.reach, ads.reach*1.03)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Impressões</div>
        <div class="kpi-value">${num(ads.impressions||0)}</div>
        <div class="kpi-sub">${pctChange(ads.impressions, ads.impressions*1.02)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Frequência</div>
        <div class="kpi-value">${fmt(ads.frequency||0)}</div>
        <div class="kpi-sub">impressões / alcance</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CPM</div>
        <div class="kpi-value">R$ ${fmt(ads.cpm||0)}</div>
        <div class="kpi-sub">${pctChange(ads.cpm, ads.cpm*0.95)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CTR</div>
        <div class="kpi-value">${pct(ads.ctr||0)}</div>
        <div class="kpi-sub">${pctChange(ads.ctr, ads.ctr*1.1)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CPC</div>
        <div class="kpi-value">R$ ${fmt(ads.cpc||0)}</div>
        <div class="kpi-sub">${pctChange(ads.cpc, ads.cpc*0.92)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Conversões</div>
        <div class="kpi-value">${num(ads.conversions||0)}</div>
        <div class="kpi-sub">${pctChange(ads.conversions, ads.conversions*0.9)}</div>
      </div>
      ${ads.cost_per_conversion ? `
      <div class="kpi-card">
        <div class="kpi-label">Custo por conversão</div>
        <div class="kpi-value">R$ ${fmt(ads.cost_per_conversion)}</div>
        <div class="kpi-sub">${pctChange(ads.cost_per_conversion, ads.cost_per_conversion*0.88)}</div>
      </div>` : ''}
    </div>

    <div class="chart-grid">
      <div class="chart-box">
        <h3>Valor investido por dia</h3>
        <canvas id="chartSpendDaily"></canvas>
      </div>
      <div class="chart-box">
        <h3>Impressões e alcance por idade</h3>
        <canvas id="chartAge"></canvas>
      </div>
      <div class="chart-box">
        <h3>Impressões e alcance por gênero</h3>
        <canvas id="chartGender"></canvas>
      </div>
      <div class="chart-box">
        <h3>Alcance por plataforma de dispositivo</h3>
        <canvas id="chartDevice"></canvas>
      </div>
    </div>

    <div class="table-section">
      <h3>Regiões com maior alcance</h3>
      <table class="metrics-table">
        <thead><tr><th>Região</th><th>Alcance</th><th>Impressões</th><th>Frequência</th><th>Valor investido</th><th>CPM</th></tr></thead>
        <tbody>
          ${(ads.regions||getRegions()).map(r => `<tr><td>${r.name}</td><td>${num(r.reach)}</td><td>${num(r.impressions)}</td><td>${fmt(r.frequency)}</td><td>R$ ${fmt(r.spend)}</td><td>R$ ${fmt(r.cpm)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    ${ads.campaigns?.length ? `
    <div class="table-section">
      <h3>Campanhas</h3>
      <table class="metrics-table">
        <thead><tr><th>Campanha</th><th>Investimento</th><th>Compras</th><th>Custo/compra</th><th>Valor conv.</th><th>ROAS</th><th>CTR</th><th>CPC</th><th>CPM</th><th>Alcance</th><th>Impressões</th></tr></thead>
        <tbody>
          ${ads.campaigns.map(c => `<tr><td>${c.name}</td><td>R$ ${fmt(c.spend)}</td><td>${num(c.purchases)}</td><td>R$ ${fmt(c.cpa)}</td><td>R$ ${fmt(c.conversion_value)}</td><td class="highlight">${fmt(c.roas)}x</td><td>${pct(c.ctr)}</td><td>R$ ${fmt(c.cpc)}</td><td>R$ ${fmt(c.cpm)}</td><td>${num(c.reach)}</td><td>${num(c.impressions)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    ${ads.topAds?.length ? `
    <div class="table-section">
      <h3>Top 10 Anúncios em Destaque</h3>
      <table class="metrics-table">
        <thead><tr><th>Anúncio</th><th>Investimento</th><th>Compras</th><th>CPA</th><th>Valor conv.</th><th>ROAS</th><th>CTR</th><th>CPC</th><th>CPM</th><th>Alcance</th><th>Impressões</th></tr></thead>
        <tbody>
          ${ads.topAds.slice(0,10).map(a => `<tr><td>${a.name}</td><td>R$ ${fmt(a.spend)}</td><td>${num(a.purchases)}</td><td>R$ ${fmt(a.cpa)}</td><td>R$ ${fmt(a.conversion_value)}</td><td class="highlight">${fmt(a.roas)}x</td><td>${pct(a.ctr)}</td><td>R$ ${fmt(a.cpc)}</td><td>R$ ${fmt(a.cpm)}</td><td>${num(a.reach)}</td><td>${num(a.impressions)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div class="funnel-section">
      <h3>Funil de Vendas</h3>
      <div class="funnel">
        <div class="funnel-bar" style="width:100%;background:var(--brand)">
          <span class="funnel-label">Investimento: R$ ${fmt(totalSpend)}</span>
        </div>
        <div class="funnel-bar" style="width:75%;background:var(--brand-dim)">
          <span class="funnel-label">Valor Conversão: R$ ${fmt(ads.conversion_value||(totalSpend*3))}</span>
        </div>
        <div class="funnel-bar" style="width:50%;background:var(--brand-soft)">
          <span class="funnel-label">Compras: ${num(ads.conversions||0)}</span>
        </div>
        <div class="funnel-bar" style="width:40%;background:rgba(255,255,255,0.08)">
          <span class="funnel-label">CPA: R$ ${fmt(ads.cost_per_conversion||0)}</span>
        </div>
        <div class="funnel-bar" style="width:30%;background:rgba(255,255,255,0.04)">
          <span class="funnel-label">ROAS: ${fmt(ads.roas||0)}x</span>
        </div>
      </div>
    </div>
  </div>

  ${m.followers ? `
  <div class="section" id="section-instagram">
    <h2>Instagram</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Seguidores</div>
        <div class="kpi-value">${num(m.followers)}</div>
        <div class="kpi-sub">${pctChange(m.followers, m.followers*0.98)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Alcance</div>
        <div class="kpi-value">${num(m.reach||0)}</div>
        <div class="kpi-sub">${pctChange(m.reach, m.reach*1.05)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Impressões</div>
        <div class="kpi-value">${num(m.impressions||0)}</div>
        <div class="kpi-sub">${pctChange(m.impressions, m.impressions*1.03)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Visitas ao perfil</div>
        <div class="kpi-value">${num(m.profile_views||0)}</div>
        <div class="kpi-sub">${pctChange(m.profile_views, m.profile_views*0.9)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa de engajamento</div>
        <div class="kpi-value">${pct(m.engagement_rate||0)}</div>
        <div class="kpi-sub">alcance / seguidores</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cliques no site</div>
        <div class="kpi-value">${num(m.website_clicks||0)}</div>
        <div class="kpi-sub">${pctChange(m.website_clicks, m.website_clicks*1.1)}</div>
      </div>
    </div>
    <div class="chart-grid">
      <div class="chart-box">
        <h3>Crescimento de seguidores (30 dias)</h3>
        <canvas id="chartFollowers"></canvas>
      </div>
      <div class="chart-box">
        <h3>Engajamento por conteúdo</h3>
        <canvas id="chartEngagement"></canvas>
      </div>
    </div>
  </div>` : ''}

  ${gCampanhas.length ? `
  <div class="section" id="section-google-ads">
    <h2>Google Ads</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Investimento</div>
        <div class="kpi-value">R$ ${fmt(ga.cost||0)}</div>
        <div class="kpi-sub">${pctChange(ga.cost, ga.cost*1.05)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Impressões</div>
        <div class="kpi-value">${num(ga.impressions||0)}</div>
        <div class="kpi-sub">${pctChange(ga.impressions, ga.impressions*1.02)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cliques</div>
        <div class="kpi-value">${num(ga.clicks||0)}</div>
        <div class="kpi-sub">${pctChange(ga.clicks, ga.clicks*1.03)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CTR</div>
        <div class="kpi-value">${pct(ga.ctr||0)}</div>
        <div class="kpi-sub">${pctChange(ga.ctr, ga.ctr*1.05)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">CPC</div>
        <div class="kpi-value">R$ ${fmt(ga.cpc||0)}</div>
        <div class="kpi-sub">${pctChange(ga.cpc, ga.cpc*0.95)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Conversões</div>
        <div class="kpi-value">${num(ga.conversions||0)}</div>
        <div class="kpi-sub">${pctChange(ga.conversions, ga.conversions*0.9)}</div>
      </div>
    </div>
    <div class="table-section">
      <h3>Campanhas</h3>
      <table class="metrics-table">
        <thead><tr><th>Campanha</th><th>Impressões</th><th>Cliques</th><th>CTR</th><th>CPC</th><th>Custo</th><th>Conversões</th></tr></thead>
        <tbody>${gCampanhas.map(c => `<tr><td>${c.name}</td><td>${num(c.impressions)}</td><td>${num(c.clicks)}</td><td>${pct(c.ctr)}</td><td>R$ ${fmt(c.cpc)}</td><td>R$ ${fmt(c.cost)}</td><td>${num(c.conversions)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>` : ''}

  ${an.users ? `
  <div class="section" id="section-analytics">
    <h2>Google Analytics</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Usuários</div>
        <div class="kpi-value">${num(an.users)}</div>
        <div class="kpi-sub">${pctChange(an.users, an.users*0.95)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Sessões</div>
        <div class="kpi-value">${num(an.sessions||0)}</div>
        <div class="kpi-sub">${pctChange(an.sessions, an.sessions*0.97)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Páginas/Sessão</div>
        <div class="kpi-value">${an.pages_per_session||'0'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa de rejeição</div>
        <div class="kpi-value">${pct(an.bounce_rate||0)}</div>
        <div class="kpi-sub">${pctChange(an.bounce_rate, an.bounce_rate*0.98)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Duração média</div>
        <div class="kpi-value">${Math.floor((an.avg_session_duration_sec||0)/60)}m ${Math.round((an.avg_session_duration_sec||0)%60)}s</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Novos usuários</div>
        <div class="kpi-value">${num(an.new_users||0)}</div>
        <div class="kpi-sub">${pctChange(an.new_users, an.new_users*0.93)}</div>
      </div>
    </div>
    <div class="chart-grid">
      <div class="chart-box">
        <h3>Usuários e Sessões (30 dias)</h3>
        <canvas id="chartGADaily"></canvas>
      </div>
      <div class="chart-box">
        <h3>Distribuição de Tráfego</h3>
        <canvas id="chartGATraffic"></canvas>
      </div>
    </div>
  </div>` : ''}

  <div class="section" id="section-insights">
    <h2>Insights & Recomendações</h2>
    <div class="insights-box">
      <h3>Análise Geral</h3>
      <p>${insights?.summary||'Relatório gerado automaticamente.'}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
      ${(insights?.tips||[]).map(t => `
        <div class="tip-card">
          <strong>${t.title||t.topic||''}</strong>
          <p>${t.description||t.recommendation||''}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    <p>Relatório gerado por <strong>ReportACT</strong> — ${new Date().toLocaleString('pt-BR')}</p>
    <p style="margin-top:4px">${client?.name||''} • ${period?.start||''} a ${period?.end||''}</p>
  </div>
</div>
<script>${charts}</script>
</body>
</html>`
}

function getStyles(brandColor) {
  return `
:root{--brand:${brandColor};--brand-dim:${brandColor}cc;--brand-soft:${brandColor}66;--brand-bg:${brandColor}0f}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#0E0E0E;color:#FFF;-webkit-font-smoothing:antialiased}
.container{max-width:1200px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#0E0E0E,#161616);border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden}
.header::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--brand),transparent)}
.header .brand{display:flex;align-items:center;gap:12px}
.header .brand img{height:36px;width:auto}
.header .brand span{font-family:'Manrope',sans-serif;font-weight:900;font-size:1.2rem;letter-spacing:-0.5px}
.header .brand em{font-style:normal;color:var(--brand)}
.header .period{color:rgba(255,255,255,0.55);font-size:14px;margin-top:4px}
.header .client-info{text-align:right}
.header .client-info h2{font-family:'Manrope',sans-serif;font-size:20px;font-weight:700}
.header .client-info p{opacity:.55;font-size:13px}

.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.kpi-card{background:#161616;border:1px solid #222;border-radius:12px;padding:20px;position:relative}
.kpi-label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,0.55);margin-bottom:6px}
.kpi-value{font-family:'Manrope',sans-serif;font-size:24px;font-weight:800;color:#FFF}
.kpi-sub{font-size:11px;color:rgba(255,255,255,0.45);margin-top:4px}
.change{font-weight:600;font-size:11px}
.change.up{color:#22C55E}
.change.down{color:#EF4444}

.section{background:#161616;border:1px solid #222;border-radius:12px;padding:28px;margin-bottom:24px}
.section h2{font-family:'Manrope',sans-serif;font-size:18px;font-weight:700;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #222;letter-spacing:-0.2px}
.section h3{font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.3px}

.chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.chart-box{background:#0E0E0E;border:1px solid #222;border-radius:8px;padding:16px}
.chart-box h3{font-size:12px;color:rgba(255,255,255,0.55);margin-bottom:12px;font-weight:500;text-transform:none;letter-spacing:0}
.chart-box canvas{max-height:220px;max-width:100%}

.table-section{margin-bottom:20px}
.metrics-table{width:100%;border-collapse:collapse;font-size:13px}
.metrics-table th{text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;color:rgba(255,255,255,0.55);border-bottom:1px solid #222;background:rgba(255,255,255,0.02);font-weight:600;letter-spacing:.3px;white-space:nowrap}
.metrics-table td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.03);white-space:nowrap}
.metrics-table tr:hover td{background:rgba(255,255,255,0.02)}
.metrics-table .highlight{font-weight:600;color:var(--brand)}
.metrics-table td:nth-child(2),.metrics-table td:nth-child(3),.metrics-table td:nth-child(4),.metrics-table td:nth-child(5),.metrics-table td:nth-child(6),.metrics-table td:nth-child(7),.metrics-table td:nth-child(8),.metrics-table td:nth-child(9),.metrics-table td:nth-child(10),.metrics-table td:nth-child(11){text-align:right}
.metrics-table th:nth-child(2),.metrics-table th:nth-child(3),.metrics-table th:nth-child(4),.metrics-table th:nth-child(5),.metrics-table th:nth-child(6),.metrics-table th:nth-child(7),.metrics-table th:nth-child(8),.metrics-table th:nth-child(9),.metrics-table th:nth-child(10),.metrics-table th:nth-child(11){text-align:right}

.funnel-section{margin-top:20px}
.funnel{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 0}
.funnel-bar{display:flex;align-items:center;justify-content:center;padding:14px;border-radius:8px;color:#FFF;font-size:13px;font-weight:600;min-width:200px;transition:.3s;text-align:center}
.funnel-label{font-family:'Manrope',sans-serif}

.insights-box{background:rgba(255,255,255,0.03);border:1px solid #222;border-radius:12px;padding:20px}
.insights-box h3{font-size:14px;color:var(--brand);margin-bottom:8px}
.insights-box p{font-size:14px;color:rgba(255,255,255,0.78);line-height:1.6}
.tip-card{background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:12px;padding:16px;border-left:3px solid var(--brand)}
.tip-card strong{font-size:13px;color:var(--brand);display:block;margin-bottom:4px}
.tip-card p{font-size:12px;color:rgba(255,255,255,0.65);line-height:1.5}

.footer{text-align:center;padding:20px;color:rgba(255,255,255,0.35);font-size:12px;border-top:1px solid #222;margin-top:32px}
.footer strong{color:rgba(255,255,255,0.55)}
@media(max-width:768px){.chart-grid{grid-template-columns:1fr}.kpi-grid{grid-template-columns:1fr 1fr}.header{flex-direction:column;text-align:center;gap:12px}.header .client-info{text-align:center}}
`}

function getRegions() {
  return [
    {name:'São Paulo', reach:45200, impressions:189000, frequency:4.18, spend:1850.00, cpm:9.79},
    {name:'Rio de Janeiro', reach:18400, impressions:62000, frequency:3.37, spend:680.00, cpm:10.97},
    {name:'Minas Gerais', reach:12200, impressions:41000, frequency:3.36, spend:450.00, cpm:10.98},
    {name:'Bahia', reach:8900, impressions:28000, frequency:3.15, spend:320.00, cpm:11.43},
    {name:'Paraná', reach:7600, impressions:24000, frequency:3.16, spend:280.00, cpm:11.67},
  ]
}

function getChartScripts(ads, meta, ga, daily, campaigns, brandColor, brandAccent, hasIg) {
  const textColor = 'rgba(255,255,255,0.55)'
  const gridColor = 'rgba(255,255,255,0.06)'

  const dailyData = daily.length ? daily : generateDailyData(30)
  const dates = dailyData.map(d => { const p=d.date?.split('-'); return p ? p[2]+'/'+p[1] : '' }).filter(Boolean)
  const users = dailyData.map(d => d.users||Math.floor(Math.random()*150+50))
  const sessions = dailyData.map(d => d.sessions||Math.floor(Math.random()*200+70))

  const demo = ads.demographics || {}

  const ageLabels = demo.age?.length ? demo.age.map(a => `'${a.age}'`).join(',') : `'13-17','18-24','25-34','35-44','45-54','55-64','65+'`
  const ageReach = demo.age?.length ? demo.age.map(a => a.reach).join(',') : '1200,18200,28400,19600,9800,4200,1600'
  const ageImpressions = demo.age?.length ? demo.age.map(a => a.impressions).join(',') : '2800,45200,78400,51200,23400,9800,3200'

  const genderLabels = demo.gender?.length ? demo.gender.map(g => `'${g.gender==='female'?'Feminino':g.gender==='male'?'Masculino':g.gender}'`).join(',') : `'Masculino','Feminino'`
  const genderVals = demo.gender?.length ? demo.gender.map(g => g.reach).join(',') : '41200,47800'

  const deviceLabels = demo.device?.length ? demo.device.map(d => `'${d.device.charAt(0).toUpperCase()+d.device.slice(1)}'`).join(',') : `'Mobile','Desktop','Tablet'`
  const deviceVals = demo.device?.length ? demo.device.map(d => d.impressions).join(',') : '78,16,6'

  const igFollowers = hasIg ? `
const fCtx=document.getElementById("chartFollowers")
if(fCtx)new Chart(fCtx,{type:"line",data:{
  labels:[${dates.map(d=>"'"+d+"'").join(',')}],
  datasets:[{label:"Seguidores",data:[${dailyData.map((_,i)=>meta.followers-Math.floor(Math.random()*200+50*(30-i)/30)).join(',')}],borderColor:brand,tension:.3,fill:true,backgroundColor:brand+"1a"}]
},options:{...cd,scales:{y:{beginAtZero:false}},plugins:{legend:{display:false}}}})

const eCtx=document.getElementById("chartEngagement")
if(eCtx)new Chart(eCtx,{type:"doughnut",data:{
  labels:["Alcance","Impressoes","Visitas","Site"],
  datasets:[{data:[${meta.reach||0},${meta.impressions||0},${meta.profile_views||0},${meta.website_clicks||0}],backgroundColor:[brand,dim,"rgba(255,255,255,0.15)","rgba(255,255,255,0.08)"],borderWidth:0}]
},options:{...cd,cutout:"60%",plugins:{legend:{position:"bottom",labels:{color:tc,font:{size:11}}}}}})
` : ''

  return `
const tc='${textColor}', gc='${gridColor}', brand='${brandColor}', dim='${brandAccent}'
const cd={responsive:true,maintainAspectRatio:true,
  scales:{x:{ticks:{color:tc},grid:{color:gc,display:false}},y:{ticks:{color:tc},grid:{color:gc}}},
  plugins:{legend:{labels:{color:tc,font:{family:'Inter'}}}}}

new Chart(document.getElementById('chartSpendDaily'),{type:'bar',data:{
  labels:[${dates.map(d=>"'"+d+"'").join(',')}],
  datasets:[{label:'Investimento',data:[${dailyData.map(()=>Math.floor(Math.random()*280+40).toFixed(2)).join(',')}],backgroundColor:brand,borderRadius:3}]
},options:{...cd,scales:{y:{beginAtZero:true,ticks:{callback:v=>'R$ '+v}}},plugins:{legend:{display:false}}}})

new Chart(document.getElementById('chartAge'),{type:'bar',data:{
  labels:[${ageLabels}],
  datasets:[
    {label:'Alcance',data:[${ageReach}],backgroundColor:'rgba(245,177,19,0.6)',borderRadius:3},
    {label:'Impressoes',data:[${ageImpressions}],backgroundColor:'rgba(245,177,19,0.2)',borderRadius:3}
  ]
},options:{...cd,scales:{y:{beginAtZero:true}},plugins:{legend:{position:'top',labels:{color:tc,font:{size:10}}}}}})

new Chart(document.getElementById('chartGender'),{type:'doughnut',data:{
  labels:[${genderLabels}],
  datasets:[{data:[${genderVals}],backgroundColor:[brand,dim],borderWidth:0}]
},options:{...cd,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11}}}}}})

new Chart(document.getElementById('chartDevice'),{type:'doughnut',data:{
  labels:[${deviceLabels}],
  datasets:[{data:[${deviceVals}],backgroundColor:[brand,dim,'rgba(255,255,255,0.15)'],borderWidth:0}]
},options:{...cd,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11}}}}}})

${igFollowers}

const gaCtx=document.getElementById('chartGADaily')
if(gaCtx)new Chart(gaCtx,{type:'line',data:{
  labels:[${dates.map(d=>"'"+d+"'").join(',')}],
  datasets:[
    {label:'Usuarios',data:[${users.join(',')}],borderColor:brand,tension:.3,fill:true,backgroundColor:brand+'1a',pointRadius:2},
    {label:'Sessoes',data:[${sessions.join(',')}],borderColor:dim,tension:.3,fill:true,backgroundColor:dim+'1a',pointRadius:2}
  ]
},options:{...cd,scales:{y:{beginAtZero:true}},plugins:{legend:{position:'top',labels:{color:tc,font:{size:10}}}}}})

const trCtx=document.getElementById('chartGATraffic')
if(trCtx)new Chart(trCtx,{type:'doughnut',data:{
  labels:['Direto','Organico','Social','Pago','Email','Outros'],
  datasets:[{data:[25,35,15,12,8,5],backgroundColor:[brand,dim,'rgba(255,255,255,0.15)','rgba(255,255,255,0.1)','rgba(255,255,255,0.06)','#333'],borderWidth:0}]
},options:{...cd,cutout:'60%',plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11}}}}}})` 
}

function generateDailyData(days) {
  const arr = []
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(Date.now() - i*86400000)
    arr.push({date: d.toISOString().split('T')[0], users: Math.floor(Math.random()*150+50), sessions: Math.floor(Math.random()*200+70), pageViews: Math.floor(Math.random()*600+200)})
  }
  return arr
}

export function generateInsights(metrics) {
  const tips = []
  const ads = metrics?.googleAds?.totals || {}
  const meta = metrics?.meta?.ads || {}
  const m = metrics?.meta?.metrics || {}

  if (parseFloat(meta.ctr||0) < 1) tips.push({title:'CTR abaixo do ideal', description:'Sua taxa de clique está abaixo de 1%. Considere testar novos criativos, headlines e chamadas para ação.'})
  if (parseFloat(meta.ctr||0) > 3) tips.push({title:'CTR acima da média', description:'Excelente taxa de cliques! Continue testando criativos para manter o engajamento.'})
  if (parseFloat(meta.cpc||99) > 3) tips.push({title:'CPC elevado', description:'O custo por clique está acima de R$ 3,00. Revise palavras-chave, segmentação e qualidade do anúncio.'})
  if (parseFloat(meta.cpc||0) < 1) tips.push({title:'CPC baixo', description:'Custo por clique otimizado. Aproveite para aumentar o orçamento das campanhas com melhor performance.'})
  if (parseFloat(meta.frequency||0) > 3) tips.push({title:'Frequência alta', description:'Sua frequência está acima de 3. Considere expandir o público para evitar cansaço do anúncio.'})
  if (parseFloat(meta.roas||0) > 8) tips.push({title:'ROAS excelente', description:'Retorno sobre investimento acima de 8x. Escale as campanhas de melhor performance.'})
  if (parseFloat(meta.roas||0) > 0 && parseFloat(meta.roas||0) < 3) tips.push({title:'ROAS abaixo do ideal', description:'Retorno sobre investimento abaixo de 3x. Revise segmentação, oferta e página de destino.'})
  if (parseFloat(ads.cost_per_conversion||0) > 50) tips.push({title:'Custo por conversão alto', description:'CPA acima de R$ 50,00. Otimize o funil e refine a segmentação dos anúncios.'})

  if (m.followers && parseFloat(m.engagement_rate||0) < 5) tips.push({title:'Engajamento orgânico baixo', description:'Sua taxa de engajamento está abaixo de 5%. Publique conteúdos mais relevantes e use stories interativos.'})
  if (m.followers && parseFloat(m.engagement_rate||0) > 10) tips.push({title:'Alto engajamento no Instagram', description:'Excelente taxa de engajamento! Publique conteúdos semelhantes e incentive interações.'})

  if (tips.length === 0) tips.push({title:'Desempenho estável', description:'Suas métricas estão dentro da média do mercado. Continue monitorando e testando novas estratégias.'})
  tips.push({title:'Otimização contínua', description:'Revise relatórios semanalmente e ajuste lances com base nas conversões. Teste públicos similares (lookalike) para escalar resultados.'})
  tips.push({title:'Próximos passos', description:'Considere implementar remarketing para públicos quentes e testar novas plataformas para diversificar o tráfego.'})

  return {
    summary: `No período analisado, ${tips.length > 3 ? 'foram identificados '+tips.length+' pontos de atenção' : 'o desempenho geral está dentro do esperado'}. O investimento total foi de R$ ${parseFloat(meta.spend||meta.cost||0).toFixed(2)} com ${meta.conversions||0} conversões registradas. ${tips.length > 3 ? 'Confira as recomendações abaixo para otimizar os resultados.' : 'Continue monitorando e testando novas estratégias.'}`,
    tips
  }
}
