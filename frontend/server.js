import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", true);
app.use((req, res, next) => {
  if (req.secure) {
    return next();
  }
  const forwarded = req.headers["x-forwarded-proto"];
  if (forwarded && forwarded !== "https") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  return next();
});
app.use(express.static(__dirname));

const renderLayout = ({ title, section, content, extraScript = "" }) => `
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} • Painel CDV</title>
      <style>
        :root {
          --bg: #0f0f10;
          --panel: #151518;
          --text: #f5f5f7;
          --muted: #b8b8c1;
          --accent: #f32015;
          --accent-strong: #ff6a00;
          --accent-soft: rgba(243, 32, 21, 0.18);
          --border: #232327;
          --success: #1bd96a;
          --warning: #ffbf00;
          --danger: #ff4d4f;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          background: radial-gradient(circle at top left, rgba(243, 32, 21, 0.12), transparent 40%),
            var(--bg);
          color: var(--text);
        }
        .layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100vh;
        }
        .sidebar {
          background: linear-gradient(180deg, #111115, #0b0b0c);
          border-right: 1px solid var(--border);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .logo-image {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }
        .logo-text strong {
          display: block;
          font-size: 18px;
          letter-spacing: 0.08em;
        }
        .logo-text span {
          color: var(--muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }
        .nav {
          display: grid;
          gap: 12px;
        }
        .nav a {
          color: var(--text);
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          padding: 10px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 1px solid transparent;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .icon {
          color: #fff;
        }
        .nav a.active,
        .nav a:hover {
          background: linear-gradient(135deg, var(--accent), var(--accent-strong));
          border-color: transparent;
          box-shadow: 0 10px 24px rgba(243, 32, 21, 0.25);
          transform: translateX(2px);
        }
        .filter-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          display: grid;
          gap: 12px;
        }
        .filter-panel h4 {
          margin: 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
        }
        .filter-buttons {
          display: grid;
          gap: 8px;
        }
        .filter-buttons button {
          border: 1px solid var(--border);
          background: #111115;
          color: var(--text);
          padding: 8px 10px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .filter-buttons button.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-strong));
          border-color: transparent;
        }
        .filter-custom {
          display: grid;
          gap: 8px;
        }
        .filter-custom input {
          background: #0f0f10;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 10px;
          border-radius: 10px;
        }
        .content {
          padding: 32px 40px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .badge {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent-strong));
          color: #fff;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .logout-button {
          border: none;
          cursor: pointer;
          text-decoration: none;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .card {
          background: var(--panel);
          border: 1px solid var(--border);
          padding: 18px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }
        .card h3 {
          margin: 0 0 8px;
          font-size: 16px;
        }
        .card p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }
        .filter-bar {
          margin: 24px 0 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        .filter-bar button {
          border: 1px solid var(--border);
          background: #111115;
          color: var(--text);
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 600;
          cursor: pointer;
        }
        .filter-bar button.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-strong));
          border-color: transparent;
        }
        .filter-bar .custom-range {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-bar input {
          background: #0f0f10;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 10px;
          border-radius: 10px;
        }
        .timeline {
          margin-top: 20px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 20px;
          display: grid;
          gap: 16px;
        }
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .timeline-header h3 {
          margin: 0;
        }
        .chart {
          width: 100%;
          height: 200px;
          background: linear-gradient(180deg, rgba(243, 32, 21, 0.18), transparent);
          border-radius: 14px;
          border: 1px solid rgba(243, 32, 21, 0.2);
          position: relative;
          overflow: hidden;
        }
        .chart svg {
          position: absolute;
          inset: 0;
        }
        .timeline-list {
          display: grid;
          gap: 8px;
        }
        .timeline-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--muted);
          font-size: 13px;
        }
        .status-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-ok { background: rgba(27, 217, 106, 0.2); color: var(--success); }
        .status-warn { background: rgba(255, 191, 0, 0.2); color: var(--warning); }
        .status-down { background: rgba(255, 77, 79, 0.2); color: var(--danger); }
        .health {
          margin-top: 28px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        .health span {
          color: var(--muted);
        }
        .button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, var(--accent), var(--accent-strong));
          text-decoration: none;
          border: none;
          box-shadow: 0 8px 18px rgba(243, 32, 21, 0.24);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(243, 32, 21, 0.32);
        }
        @media (max-width: 960px) {
          .layout { grid-template-columns: 1fr; }
          .sidebar { border-right: none; border-bottom: 1px solid var(--border); }
          .content { padding: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="layout">
        <aside class="sidebar">
          <div class="logo">
            <img
              class="logo-image"
              src="/Logo.webp"
              alt="Logo CDV"
              onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/tulio1004/cdv-dashboard/main/frontend/Logo.webp';"
            />
            <div class="logo-text">
              <strong>CDV</strong>
              <span>Painel</span>
            </div>
          </div>
          <nav class="nav">
            <a href="/" class="${section === "overview" ? "active" : ""}"><span class="icon">🏠</span> Visão geral</a>
            <a href="/funnel" class="${section === "funnel" ? "active" : ""}"><span class="icon">📉</span> Funil</a>
            <a href="/receita" class="${section === "receita" ? "active" : ""}"><span class="icon">💰</span> Receita</a>
            <a href="/operations" class="${section === "operations" ? "active" : ""}"><span class="icon">🛠️</span> Operações</a>
            <a href="/community" class="${section === "community" ? "active" : ""}"><span class="icon">👥</span> Comunidade</a>
            <a href="/social" class="${section === "social" ? "active" : ""}"><span class="icon">📣</span> Social</a>
            <a href="/email" class="${section === "email" ? "active" : ""}"><span class="icon">✉️</span> E-mail</a>
          </nav>
          <div class="filter-panel">
            <h4>Período</h4>
            <div class="filter-buttons" data-range-group>
              <button data-range="1d">Hoje</button>
              <button data-range="7d">Últimos 7 dias</button>
              <button data-range="30d">Últimos 30 dias</button>
            </div>
            <div class="filter-custom">
              <input type="date" id="sidebar-start" />
              <input type="date" id="sidebar-end" />
              <button class="button" type="button" id="sidebar-apply">Aplicar</button>
            </div>
          </div>
        </aside>
        <main class="content">
          <div class="topbar">
            <div>
              <h1>${title}</h1>
            </div>
            <a class="badge logout-button" href="/logout">Sair</a>
          </div>
          ${content}
        </main>
      </div>
      <script>
        const defaultRange = "1d";
        let currentRange = defaultRange;

        const setActiveRange = (range) => {
          currentRange = range;
          document.querySelectorAll("[data-range-group] button").forEach((button) => {
            button.classList.toggle("active", button.dataset.range === range);
          });
          document.querySelectorAll(".filter-bar button[data-range]").forEach((button) => {
            button.classList.toggle("active", button.dataset.range === range);
          });
        };

        const getCustomDays = () => {
          const start = document.getElementById("sidebar-start")?.value ||
            document.getElementById("custom-start")?.value;
          const end = document.getElementById("sidebar-end")?.value ||
            document.getElementById("custom-end")?.value;
          if (!start || !end) return null;
          const startDate = new Date(start);
          const endDate = new Date(end);
          if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
          const diffMs = endDate.getTime() - startDate.getTime();
          const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
          return diffDays;
        };

        const bindRangeControls = () => {
          document.querySelectorAll("[data-range-group] button").forEach((button) => {
            button.addEventListener("click", () => {
              setActiveRange(button.dataset.range);
              window.dispatchEvent(new CustomEvent("range-change", { detail: { range: button.dataset.range } }));
            });
          });
          document.querySelectorAll(".filter-bar button[data-range]").forEach((button) => {
            button.addEventListener("click", () => {
              setActiveRange(button.dataset.range);
              window.dispatchEvent(new CustomEvent("range-change", { detail: { range: button.dataset.range } }));
            });
          });
          const applyButtons = [
            document.getElementById("sidebar-apply"),
            document.getElementById("custom-apply"),
          ].filter(Boolean);
          applyButtons.forEach((button) => {
            button.addEventListener("click", () => {
              const days = getCustomDays();
              if (!days) return;
              const range = days + "d";
              setActiveRange(range);
              window.dispatchEvent(new CustomEvent("range-change", { detail: { range } }));
            });
          });
        };

        const renderChart = (range, elementId) => {
          const chart = document.getElementById(elementId);
          if (!chart) return;
          const pointsCount = range === "1d" ? 8 : range === "7d" ? 10 : 14;
          const values = Array.from({ length: pointsCount }, (_, idx) =>
            Math.round(40 + Math.sin(idx / 2) * 20 + idx * 3)
          );
          const max = Math.max(...values) || 1;
          const stepX = 100 / (pointsCount - 1);
          const points = values
            .map((value, idx) => {
              const x = idx * stepX;
              const y = 100 - (value / max) * 80 - 10;
              return x + "," + y;
            })
            .join(" ");
          chart.innerHTML =
            '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
            '<polyline fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" points="' +
            points +
            '" />' +
            '<polyline fill="rgba(243, 32, 21, 0.25)" stroke="none" points="0,100 ' +
            points +
            ' 100,100" />' +
            "</svg>";
        };

        bindRangeControls();
        setActiveRange(defaultRange);
        window.dispatchEvent(new CustomEvent("range-change", { detail: { range: defaultRange } }));

        window.addEventListener("range-change", (event) => {
          const range = event.detail.range;
          renderChart(range, "timeline-chart");
          renderChart(range, "timeline-chart-secondary");
        });
      </script>
      ${extraScript}
    </body>
  </html>
`;

const overviewContent = `
  <div class="filter-bar">
    <button data-range="1d">Hoje</button>
    <button data-range="7d">Últimos 7 dias</button>
    <button data-range="30d">Últimos 30 dias</button>
    <div class="custom-range">
      <input type="date" id="custom-start" />
      <input type="date" id="custom-end" />
      <button class="button" type="button" id="custom-apply">Aplicar</button>
    </div>
  </div>
  <section class="cards">
    <div class="card">
      <h3><span class="icon">✨</span> Visão geral</h3>
      <p><strong>VSL:</strong> <span id="metric-vsl">--</span> views</p>
      <p><strong>Cadastro:</strong> <span id="metric-signup">--</span> views</p>
      <p><strong>Confirmação:</strong> <span id="metric-confirmation">--</span> views</p>
    </div>
    <div class="card">
      <h3><span class="icon">💰</span> Receita</h3>
      <p><strong>Vendas:</strong> <span id="metric-sales-count">--</span></p>
      <p><strong>Receita:</strong> R$ <span id="metric-sales-revenue">--</span></p>
    </div>
    <div class="card">
      <h3><span class="icon">📉</span> Funil</h3>
      <p><strong>Aula 1:</strong> <span id="metric-aula1">--</span> views</p>
      <p><strong>Aula 2:</strong> <span id="metric-aula2">--</span> views</p>
      <p><strong>Aula 3:</strong> <span id="metric-aula3">--</span> views</p>
    </div>
    <div class="card">
      <h3><span class="icon">🛠️</span> Operações</h3>
      <p>Make: estável | WPP: em monitoramento</p>
    </div>
    <div class="card">
      <h3><span class="icon">👥</span> Comunidade</h3>
      <p>Novos membros: --</p>
    </div>
  </section>
  <section class="timeline">
    <div class="timeline-header">
      <h3><span class="icon">📊</span> Timeline do período</h3>
      <span class="status-pill status-ok">Mock</span>
    </div>
    <div class="chart" id="timeline-chart"></div>
    <div class="timeline-list">
      <div class="timeline-item">🕒 Ponto mais alto do dia: 18h</div>
      <div class="timeline-item">🚀 Pico de tráfego: +18% vs último período</div>
      <div class="timeline-item">💡 Receita média diária: R$ --</div>
    </div>
  </section>
  <div class="health">
    <span>Saúde da API:</span>
    <a class="button" href="/api/health">/api/health</a>
    <span>Saúde do banco:</span>
    <a class="button" href="/api/health/db">/api/health/db</a>
  </div>
`;

const overviewScript = `
  <script>
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const formatNumber = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number.toLocaleString("pt-BR") : "--";
    };

    const loadOverview = (range) => {
      fetch(\"/api/overview?range=\" + range)
        .then((response) => response.json())
        .then((data) => {
          if (!data?.ok) return;
          const pages = data.funnel?.pages || [];
          const bySlug = Object.fromEntries(pages.map((page) => [page.slug, page]));
          setText("metric-vsl", formatNumber(bySlug.vsl?.views));
          setText("metric-signup", formatNumber(bySlug.signup?.views));
          setText("metric-confirmation", formatNumber(bySlug.confirmation?.views));
          setText("metric-aula1", formatNumber(bySlug.aula1?.views));
          setText("metric-aula2", formatNumber(bySlug.aula2?.views));
          setText("metric-aula3", formatNumber(bySlug.aula3?.views));
          setText("metric-sales-count", formatNumber(data.sales?.count));
          setText("metric-sales-revenue", formatNumber(data.sales?.revenue));
        })
        .catch(() => {
          setText("metric-vsl", "indisponível");
        });
    };

    window.addEventListener("range-change", (event) => {
      loadOverview(event.detail.range);
    });
  </script>
`;

const genericTimeline = `
  <section class="timeline">
    <div class="timeline-header">
      <h3>📊 Timeline do período</h3>
      <span class="status-pill status-ok">Mock</span>
    </div>
    <div class="chart" id="timeline-chart-secondary"></div>
    <div class="timeline-list">
      <div class="timeline-item">🗓️ Atividade agrupada por dia (placeholder)</div>
      <div class="timeline-item">📌 Dados reais entram após integrações</div>
    </div>
  </section>
`;

const operationsContent = `
  ${genericTimeline}
  <section class="cards" style="margin-top: 18px;">
    <div class="card">
      <h3><span class="icon">🛠️</span> Cenários Make.com</h3>
      <p><strong>Atendimento:</strong> <span class="status-pill status-ok">OK</span></p>
      <p><strong>Código da Visão - Compra:</strong> <span class="status-pill status-ok">OK</span></p>
      <p><strong>Jornada 20/20 - Compra:</strong> <span class="status-pill status-ok">OK</span></p>
      <p><strong>Nutrição - Outbound:</strong> <span class="status-pill status-warn">Atenção</span></p>
      <p><strong>Captura de Leads:</strong> <span class="status-pill status-ok">OK</span></p>
      <p><strong>Vendas:</strong> <span class="status-pill status-ok">OK</span></p>
    </div>
    <div class="card">
      <h3><span class="icon">📱</span> WPP-Connect</h3>
      <p><strong>Status:</strong> <span class="status-pill status-warn">Monitoramento</span></p>
      <p>PM2: aguardando integração do VPS externo.</p>
    </div>
  </section>
`;

const receitaContent = `
  ${genericTimeline}
  <section class="cards" style="margin-top: 18px;">
    <div class="card">
      <h3><span class="icon">💰</span> Receita</h3>
      <p><strong>Vendas:</strong> <span id="receita-count">--</span></p>
      <p><strong>Receita:</strong> R$ <span id="receita-revenue">--</span></p>
      <p style="margin-top: 12px; color: #b8b8c1;">Dados de exemplo até conectar a Hotmart.</p>
    </div>
  </section>
`;

const receitaScript = `
  <script>
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    const formatNumber = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number.toLocaleString("pt-BR") : "--";
    };
    const loadReceita = (range) => {
      fetch(\"/api/overview?range=\" + range)
        .then((response) => response.json())
        .then((data) => {
          if (!data?.ok) return;
          setText("receita-count", formatNumber(data.sales?.count));
          setText("receita-revenue", formatNumber(data.sales?.revenue));
        })
        .catch(() => {
          setText("receita-count", "indisponível");
        });
    };

    window.addEventListener("range-change", (event) => {
      loadReceita(event.detail.range);
    });
  </script>
`;

const placeholderContent = (emoji, message) => `
  ${genericTimeline}
  <section class="cards" style="margin-top: 18px;">
    <div class="card">
      <h3>${emoji} ${message}</h3>
      <p>Dados de exemplo serão exibidos aqui.</p>
    </div>
  </section>
`;

app.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "Visão geral",
      section: "overview",
      content: overviewContent,
      extraScript: overviewScript,
    })
  );
});

app.get("/overview", (req, res) => res.redirect("/"));

app.get("/funnel", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "Funil",
      section: "funnel",
      content: placeholderContent("📉", "Funil"),
    })
  );
});

app.get("/receita", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "Receita",
      section: "receita",
      content: receitaContent,
      extraScript: receitaScript,
    })
  );
});

app.get("/operations", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "Operações",
      section: "operations",
      content: operationsContent,
    })
  );
});

app.get("/community", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "Comunidade",
      section: "community",
      content: placeholderContent("👥", "Comunidade"),
    })
  );
});

app.get("/social", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "Social",
      section: "social",
      content: placeholderContent("📣", "Social"),
    })
  );
});

app.get("/email", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.send(
    renderLayout({
      title: "E-mail",
      section: "email",
      content: placeholderContent("✉️", "E-mail"),
    })
  );
});

app.listen(PORT, "0.0.0.0", () => console.log("Frontend on", PORT));
