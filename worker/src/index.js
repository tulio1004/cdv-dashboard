import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
