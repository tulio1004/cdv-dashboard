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

app.get("/", (req, res) => {
  res.send(`
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>CDV Dashboard</title>
      <style>
        :root {
          --bg: #0f0f10;
          --panel: #151518;
          --text: #f5f5f7;
          --muted: #b8b8c1;
          --accent: #ff4a1f;
          --accent-strong: #ff6a00;
          --accent-soft: rgba(255, 90, 31, 0.18);
          --border: #232327;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          background: radial-gradient(circle at top left, rgba(255, 90, 31, 0.12), transparent 40%),
            var(--bg);
          color: var(--text);
        }
        .layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: 100vh;
        }
        .sidebar {
          background: linear-gradient(180deg, #111115, #0b0b0c);
          border-right: 1px solid var(--border);
          padding: 28px 24px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .logo-mark {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 4px solid var(--accent);
          box-shadow: inset 0 0 0 4px rgba(255, 106, 0, 0.45);
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
          padding: 10px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 1px solid transparent;
        }
        .nav a:hover {
          background: var(--accent-soft);
          border-color: rgba(255, 90, 31, 0.3);
        }
        .content {
          padding: 32px 40px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
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
        }
        .card h3 {
          margin: 0 0 8px;
          font-size: 16px;
        }
        .card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }
        .health {
          margin-top: 28px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .health a {
          color: var(--accent-strong);
          text-decoration: none;
          font-weight: 600;
        }
        .health span {
          color: var(--muted);
        }
        @media (max-width: 860px) {
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
            <div class="logo-mark"></div>
            <div class="logo-text">
              <strong>CDV</strong>
              <span>Dashboard</span>
            </div>
          </div>
          <nav class="nav">
            <a href="/overview">Overview</a>
            <a href="/funnel">Funnel</a>
            <a href="/operations">Operations</a>
            <a href="/community">Community</a>
            <a href="/social">Social</a>
            <a href="/email">Email</a>
          </nav>
        </aside>
        <main class="content">
          <div class="topbar">
            <div>
              <h1>CDV Dashboard</h1>
              <p style="margin: 8px 0 0; color: var(--muted);">Sprint 0 • Estrutura base e identidade visual.</p>
            </div>
            <div class="badge">Skeleton</div>
          </div>
          <section class="cards">
            <div class="card">
              <h3>Visão geral</h3>
              <p>Bloco reservado para KPIs principais e metas semanais.</p>
            </div>
            <div class="card">
              <h3>Pipeline</h3>
              <p>Resumo do funil com alertas rápidos sobre gargalos.</p>
            </div>
            <div class="card">
              <h3>Operações</h3>
              <p>Status das rotinas críticas e automações da equipe.</p>
            </div>
            <div class="card">
              <h3>Comunidade</h3>
              <p>Métricas sociais, engajamento e retenção.</p>
            </div>
          </section>
          <div class="health">
            <span>API health:</span>
            <a href="/api/health">/api/health</a>
            <span>DB health:</span>
            <a href="/api/health/db">/api/health/db</a>
          </div>
        </main>
      </div>
    </body>
  </html>`);
});

app.get(["/overview","/funnel","/operations","/community","/social","/email"], (req, res) => {
  const section = req.path.replace("/", "");
  const title = section.charAt(0).toUpperCase() + section.slice(1);
  res.send(`
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} • CDV Dashboard</title>
      <style>
        body {
          margin: 0;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          background: #0f0f10;
          color: #f5f5f7;
          padding: 32px;
        }
        a { color: #ff6a00; text-decoration: none; font-weight: 600; }
        .panel {
          margin-top: 24px;
          padding: 24px;
          border-radius: 16px;
          background: #151518;
          border: 1px solid #232327;
        }
        p { color: #b8b8c1; }
      </style>
    </head>
    <body>
      <a href="/">← Voltar</a>
      <h1>${title}</h1>
      <div class="panel">
        <p>Conteúdo base para a seção ${title}. Vamos evoluir na Sprint 1.</p>
      </div>
    </body>
  </html>`);
});

app.listen(PORT, "0.0.0.0", () => console.log("Frontend on", PORT));
