import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
  <html><body style="font-family:Arial;padding:24px;">
    <h1>CDV Dashboard (Skeleton)</h1>
    <ul>
      <li><a href="/overview">Overview</a></li>
      <li><a href="/funnel">Funnel</a></li>
      <li><a href="/operations">Operations</a></li>
      <li><a href="/community">Community</a></li>
      <li><a href="/social">Social</a></li>
      <li><a href="/email">Email</a></li>
    </ul>
    <p>API health: <a href="/api/health">/api/health</a></p>
    <p>DB health: <a href="/api/health/db">/api/health/db</a></p>
  </body></html>`);
});

app.get(["/overview","/funnel","/operations","/community","/social","/email"], (req, res) => {
  res.send(`
  <html><body style="font-family:Arial;padding:24px;">
    <a href="/">← Back</a>
    <h1>${req.path.replace("/","").toUpperCase()}</h1>
    <p>Empty page (Sprint 0).</p>
  </body></html>`);
});

app.listen(PORT, "0.0.0.0", () => console.log("Frontend on", PORT));
