-- Sprint 1: core schema + config seeds

CREATE TABLE IF NOT EXISTS metrics_timeseries (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  metric TEXT NOT NULL,
  dimension_type TEXT,
  dimension_value TEXT,
  ts TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS metrics_timeseries_metric_ts_idx
  ON metrics_timeseries (metric, ts);

CREATE INDEX IF NOT EXISTS metrics_timeseries_dimension_idx
  ON metrics_timeseries (dimension_type, dimension_value);

CREATE TABLE IF NOT EXISTS service_health (
  id BIGSERIAL PRIMARY KEY,
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_health_service_checked_idx
  ON service_health (service, checked_at DESC);

CREATE TABLE IF NOT EXISTS config_tracked_pages (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_make_scenarios (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_inboxes (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  email TEXT NOT NULL,
  webmail_url TEXT NOT NULL,
  imap_host TEXT,
  imap_port INT,
  imap_user TEXT,
  imap_password_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_thresholds (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_events (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  status TEXT,
  amount NUMERIC(12, 2),
  currency TEXT,
  occurred_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB,
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS sales_events_occurred_idx
  ON sales_events (occurred_at DESC);

INSERT INTO config_tracked_pages (slug, label, url, page_path, sort_order)
VALUES
  ('vsl', 'VSL', 'http://tuliorafesi.com/video-page', '/video-page', 1),
  ('signup', 'Signup', 'https://tuliorafesi.com/clv-lp0/', '/clv-lp0/', 2),
  ('confirmation', 'Confirmation', 'https://tuliorafesi.com/clv-cadastro-concluido/', '/clv-cadastro-concluido/', 3),
  ('aula1', 'Aula 1', 'https://tuliorafesi.com/6jdhaoislx/', '/6jdhaoislx/', 4),
  ('aula2', 'Aula 2', 'https://tuliorafesi.com/1xzdjhoiuy/', '/1xzdjhoiuy/', 5),
  ('aula3', 'Aula 3', 'https://tuliorafesi.com/4hzbjwnet/', '/4hzbjwnet/', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO config_thresholds (key, value, notes)
VALUES
  ('wpp_offline_failures', 3, 'Consecutive failures before marking offline'),
  ('make_failures_window_hours', 24, 'Window for Make scenario failures'),
  ('stale_data_hours', 6, 'Data considered stale after this many hours')
ON CONFLICT (key) DO NOTHING;
