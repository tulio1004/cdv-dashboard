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
  res.set("Cache-Control", "no-store");
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
          --accent: #f32015;
          --accent-strong: #ff6a00;
          --accent-soft: rgba(243, 32, 21, 0.18);
          --border: #232327;
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
          gap: 14px;
          margin-top: 8px;
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
        .nav a:hover {
          background: linear-gradient(135deg, var(--accent), var(--accent-strong));
          border-color: transparent;
          box-shadow: 0 10px 24px rgba(243, 32, 21, 0.25);
          transform: translateX(2px);
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
            <img
              class="logo-image"
              src="/Logo.webp"
              alt="Logo CDV"
              onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/tulio1004/cdv-dashboard/main/frontend/Logo.webp';"
            />
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
            <a class="badge logout-button" href="/logout">Logout</a>
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
            <a class="button" href="/api/health">/api/health</a>
            <span>DB health:</span>
            <a class="button" href="/api/health/db">/api/health/db</a>
          </div>
        </main>
      </div>
    </body>
  </html>`);
});

app.get(["/overview","/funnel","/operations","/community","/social","/email"], (req, res) => {
  res.set("Cache-Control", "no-store");
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
        a { text-decoration: none; font-weight: 600; }
        .button {
          display: inline-flex;
          align-items: center;
          padding: 10px 16px;
          border-radius: 999px;
          color: #fff;
          background: linear-gradient(135deg, #f32015, #ff6a00);
          box-shadow: 0 8px 18px rgba(243, 32, 21, 0.24);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(243, 32, 21, 0.32);
        }
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
      <a class="button" href="/">← Voltar</a>
      <h1>${title}</h1>
      <div class="panel">
        <p>Conteúdo base para a seção ${title}. Vamos evoluir na Sprint 1.</p>
      </div>
    </body>
  </html>`);
});

app.listen(PORT, "0.0.0.0", () => console.log("Frontend on", PORT));
