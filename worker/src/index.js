import pg from "pg";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GA4_LOOKBACK_DAYS = Number(process.env.GA4_LOOKBACK_DAYS || "365");
const GA4_SERVICE_ACCOUNT_JSON = process.env.GA4_SERVICE_ACCOUNT_JSON;
const GA4_SERVICE_ACCOUNT_BASE64 = process.env.GA4_SERVICE_ACCOUNT_BASE64;
const GA4_KEYFILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runWithRetry = async (job, attempt = 1) => {
  try {
    await job.run();
    console.log(`[worker] job=${job.name} status=ok`);
  } catch (error) {
    console.error(`[worker] job=${job.name} status=error attempt=${attempt}`, error);
    if (attempt < job.maxRetries) {
      const delay = job.retryDelayMs * attempt;
      await sleep(delay);
      await runWithRetry(job, attempt + 1);
      return;
    }
  }
};

const recordServiceHealth = async ({ service, status, details }) => {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO service_health (service, status, details)
       VALUES ($1, $2, $3)`
      ,
      [service, status, details]
    );
  } finally {
    client.release();
  }
};

const getGa4Client = () => {
  if (!GA4_PROPERTY_ID) {
    return null;
  }
  if (GA4_KEYFILE) {
    return new BetaAnalyticsDataClient({ keyFilename: GA4_KEYFILE });
  }
  const rawJson = GA4_SERVICE_ACCOUNT_JSON
    ? GA4_SERVICE_ACCOUNT_JSON
    : GA4_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(GA4_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
    : null;
  if (!rawJson) {
    return null;
  }
  const parsed = JSON.parse(rawJson);
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    },
  });
};

const formatGa4Date = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseGa4Date = (value) => {
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
};

const syncGa4Metrics = async () => {
  const client = await pool.connect();
  try {
    const trackedPages = await client.query(
      `SELECT page_path
       FROM config_tracked_pages
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
    );
    const pagePaths = trackedPages.rows.map((row) => row.page_path);
    if (!pagePaths.length) {
      return { inserted: 0, startDate: null, endDate: null };
    }

    const analyticsClient = getGa4Client();
    if (!analyticsClient) {
      throw new Error("GA4 client not configured");
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setUTCDate(endDate.getUTCDate() - (GA4_LOOKBACK_DAYS - 1));

    const [response] = await analyticsClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: formatGa4Date(startDate), endDate: formatGa4Date(endDate) }],
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "averageEngagementTime" },
        { name: "bounceRate" },
      ],
      dimensionFilter: {
        orGroup: {
          expressions: pagePaths.map((pathValue) => ({
            filter: {
              fieldName: "pagePath",
              stringFilter: { value: pathValue, matchType: "EXACT" },
            },
          })),
        },
      },
    });

    await client.query(
      `DELETE FROM metrics_timeseries
       WHERE source = $1
         AND metric = ANY($2::text[])
         AND dimension_type = 'page'
         AND dimension_value = ANY($3::text[])
         AND ts >= $4
         AND ts <= $5`,
      [
        "ga4",
        ["views", "engagement", "bounce_rate"],
        pagePaths,
        startDate,
        endDate,
      ]
    );

    const rows = response.rows || [];
    let inserted = 0;
    for (const row of rows) {
      const dateValue = row.dimensionValues?.[0]?.value;
      const pathValue = row.dimensionValues?.[1]?.value;
      if (!dateValue || !pathValue) continue;
      const ts = parseGa4Date(dateValue);
      const metrics = row.metricValues || [];
      const views = Number(metrics[0]?.value || 0);
      const engagement = Number(metrics[1]?.value || 0);
      const bounceRate = Number(metrics[2]?.value || 0);

      const payload = [
        ["views", views],
        ["engagement", engagement],
        ["bounce_rate", bounceRate],
      ];

      for (const [metric, value] of payload) {
        await client.query(
          `INSERT INTO metrics_timeseries
           (source, metric, dimension_type, dimension_value, ts, value, extra)
           VALUES
           ($1, $2, 'page', $3, $4, $5, $6)`,
          ["ga4", metric, pathValue, ts, value, { propertyId: GA4_PROPERTY_ID }]
        );
        inserted += 1;
      }
    }

    return {
      inserted,
      startDate: formatGa4Date(startDate),
      endDate: formatGa4Date(endDate),
    };
  } finally {
    client.release();
  }
};

const jobs = [
  {
    name: "worker-heartbeat",
    intervalMs: 60000,
    maxRetries: 3,
    retryDelayMs: 2000,
    run: async () => {
      await recordServiceHealth({
        service: "worker",
        status: "ok",
        details: { message: "heartbeat" },
      });
    },
  },
  {
    name: "ga4-sync",
    intervalMs: 30 * 60 * 1000,
    maxRetries: 3,
    retryDelayMs: 5000,
    run: async () => {
      try {
        const result = await syncGa4Metrics();
        await recordServiceHealth({
          service: "ga4",
          status: "ok",
          details: result,
        });
      } catch (error) {
        await recordServiceHealth({
          service: "ga4",
          status: "error",
          details: { message: error.message },
        });
        throw error;
      }
    },
  },
];

jobs.forEach((job) => {
  const schedule = async () => {
    await runWithRetry(job);
    setTimeout(schedule, job.intervalMs);
  };
  schedule();
});

console.log("[worker] scheduler started", {
  jobs: jobs.map((job) => job.name),
});
