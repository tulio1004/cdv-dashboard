import Fastify from "fastify";
import pg from "pg";

const app = Fastify({ logger: true });
const { Pool } = pg;

const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get("/health", async () => ({ ok: true, service: "api" }));

app.get("/health/db", async () => {
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT 1 as ok");
    return { ok: true, db: r.rows[0].ok === 1 };
  } finally {
    client.release();
  }
});

app.listen({ port: Number(PORT), host: "0.0.0.0" });
