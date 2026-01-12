import Fastify from "fastify";
import crypto from "crypto";
import pg from "pg";

const app = Fastify({ logger: true });
const { Pool } = pg;

const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const HOTMART_WEBHOOK_SECRET = process.env.HOTMART_WEBHOOK_SECRET;

app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body, done) => {
    req.rawBody = body;
    if (!body) {
      done(null, {});
      return;
    }
    try {
      const parsed = JSON.parse(body);
      done(null, parsed);
    } catch (error) {
      done(error, undefined);
    }
  }
);

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

app.get("/api/health", async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT DISTINCT ON (service)
        service,
        status,
        details,
        checked_at
      FROM service_health
      ORDER BY service, checked_at DESC`
    );
    return { ok: true, services: result.rows };
  } finally {
    client.release();
  }
});

app.get("/api/config/tracked-pages", async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT slug, label, url, page_path, sort_order, is_active
       FROM config_tracked_pages
       ORDER BY sort_order ASC`
    );
    return { ok: true, pages: result.rows };
  } finally {
    client.release();
  }
});

app.get("/api/overview", async (request) => {
  const { range = "7d" } = request.query ?? {};
  const days = Number(String(range).replace("d", "")) || 7;
  const client = await pool.connect();
  try {
    const pagesResult = await client.query(
      `SELECT
         tp.slug,
         tp.label,
         tp.url,
         tp.page_path,
         tp.sort_order,
         COALESCE(SUM(CASE WHEN mt.metric = 'views' THEN mt.value END), 0) AS views,
         COALESCE(AVG(CASE WHEN mt.metric = 'engagement' THEN mt.value END), 0) AS avg_engagement
       FROM config_tracked_pages tp
       LEFT JOIN metrics_timeseries mt
         ON mt.dimension_type = 'page'
        AND mt.dimension_value = tp.page_path
        AND mt.ts >= NOW() - ($1::text || ' days')::interval
       WHERE tp.is_active = TRUE
       GROUP BY tp.id
       ORDER BY tp.sort_order ASC`,
      [days]
    );

    const salesResult = await client.query(
      `SELECT
         COUNT(*)::INT AS count,
         COALESCE(SUM(amount), 0) AS revenue
       FROM sales_events
       WHERE COALESCE(occurred_at, received_at) >= NOW() - ($1::text || ' days')::interval`,
      [days]
    );

    const pages = pagesResult.rows.map((row) => ({
      ...row,
      views: Number(row.views),
      avg_engagement: Number(row.avg_engagement),
    }));

    const findViews = (slug) =>
      pages.find((page) => page.slug === slug)?.views ?? 0;
    const vslViews = findViews("vsl");
    const confirmationViews = findViews("confirmation");

    const conversions = {
      signup_vs_vsl: vslViews ? (findViews("signup") / vslViews) * 100 : 0,
      confirmation_vs_vsl: vslViews
        ? (confirmationViews / vslViews) * 100
        : 0,
      aula1_vs_confirmation: confirmationViews
        ? (findViews("aula1") / confirmationViews) * 100
        : 0,
      aula2_vs_confirmation: confirmationViews
        ? (findViews("aula2") / confirmationViews) * 100
        : 0,
      aula3_vs_confirmation: confirmationViews
        ? (findViews("aula3") / confirmationViews) * 100
        : 0,
    };

    return {
      ok: true,
      range: `${days}d`,
      funnel: { pages, conversions },
      sales: salesResult.rows[0],
    };
  } finally {
    client.release();
  }
});

const getHotmartSignature = (request) => {
  const rawSignature =
    request.headers["x-hotmart-signature"] ||
    request.headers["x-hotmart-hmac"];
  if (!rawSignature) {
    return null;
  }
  return String(rawSignature).replace(/^sha256=/i, "");
};

const isValidSignature = (signature, payload) => {
  if (!HOTMART_WEBHOOK_SECRET || !signature) {
    return false;
  }
  const computed = crypto
    .createHmac("sha256", HOTMART_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (signatureBuffer.length !== computedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
};

const parseHotmartPayload = (payload) => {
  const externalId =
    payload?.transaction_id ||
    payload?.transaction ||
    payload?.purchase?.transaction ||
    payload?.data?.purchase?.transaction ||
    payload?.data?.transaction ||
    payload?.id;
  const status =
    payload?.status ||
    payload?.purchase?.status ||
    payload?.data?.purchase?.status;
  const amountRaw =
    payload?.amount ||
    payload?.purchase?.price?.value ||
    payload?.data?.purchase?.price?.value ||
    payload?.purchase?.value;
  const amount = amountRaw === undefined ? null : Number(amountRaw);
  const currency =
    payload?.currency ||
    payload?.purchase?.price?.currency ||
    payload?.data?.purchase?.price?.currency ||
    payload?.purchase?.currency;
  const occurredAt =
    payload?.purchase?.date ||
    payload?.data?.purchase?.date ||
    payload?.event_date ||
    payload?.eventDate;

  return {
    externalId,
    status,
    amount: Number.isFinite(amount) ? amount : null,
    currency,
    occurredAt,
  };
};

app.post("/api/webhooks/hotmart", async (request, reply) => {
  const signature = getHotmartSignature(request);
  const rawBody = request.rawBody || "";
  if (!isValidSignature(signature, rawBody)) {
    reply.code(401);
    return { ok: false, error: "invalid signature" };
  }

  const { externalId, status, amount, currency, occurredAt } =
    parseHotmartPayload(request.body);

  if (!externalId) {
    reply.code(400);
    return { ok: false, error: "missing transaction id" };
  }

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO sales_events
       (source, external_id, status, amount, currency, occurred_at, raw_payload)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (source, external_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         amount = EXCLUDED.amount,
         currency = EXCLUDED.currency,
         occurred_at = EXCLUDED.occurred_at,
         raw_payload = EXCLUDED.raw_payload,
         updated_at = NOW()`,
      [
        "hotmart",
        externalId,
        status,
        amount,
        currency,
        occurredAt ? new Date(occurredAt) : null,
        request.body,
      ]
    );
    return { ok: true };
  } finally {
    client.release();
  }
});

app.listen({ port: Number(PORT), host: "0.0.0.0" });
