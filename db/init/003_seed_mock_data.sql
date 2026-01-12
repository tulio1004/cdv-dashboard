-- Sprint 1: mock data for local validation

INSERT INTO metrics_timeseries (source, metric, dimension_type, dimension_value, ts, value)
VALUES
  ('mock', 'views', 'page', '/video-page', NOW() - INTERVAL '1 day', 1240),
  ('mock', 'views', 'page', '/clv-lp0/', NOW() - INTERVAL '1 day', 520),
  ('mock', 'views', 'page', '/clv-cadastro-concluido/', NOW() - INTERVAL '1 day', 310),
  ('mock', 'views', 'page', '/6jdhaoislx/', NOW() - INTERVAL '1 day', 260),
  ('mock', 'views', 'page', '/1xzdjhoiuy/', NOW() - INTERVAL '1 day', 210),
  ('mock', 'views', 'page', '/4hzbjwnet/', NOW() - INTERVAL '1 day', 190),
  ('mock', 'engagement', 'page', '/video-page', NOW() - INTERVAL '1 day', 128.5),
  ('mock', 'engagement', 'page', '/clv-lp0/', NOW() - INTERVAL '1 day', 74.2),
  ('mock', 'engagement', 'page', '/clv-cadastro-concluido/', NOW() - INTERVAL '1 day', 55.1),
  ('mock', 'engagement', 'page', '/6jdhaoislx/', NOW() - INTERVAL '1 day', 82.3),
  ('mock', 'engagement', 'page', '/1xzdjhoiuy/', NOW() - INTERVAL '1 day', 77.8),
  ('mock', 'engagement', 'page', '/4hzbjwnet/', NOW() - INTERVAL '1 day', 69.4);

INSERT INTO sales_events (source, external_id, status, amount, currency, occurred_at, raw_payload)
VALUES
  ('hotmart', 'mock-001', 'approved', 297.00, 'BRL', NOW() - INTERVAL '2 days', '{"mock": true, "status": "approved"}'),
  ('hotmart', 'mock-002', 'approved', 297.00, 'BRL', NOW() - INTERVAL '1 day', '{"mock": true, "status": "approved"}'),
  ('hotmart', 'mock-003', 'refunded', 297.00, 'BRL', NOW() - INTERVAL '1 day', '{"mock": true, "status": "refunded"}')
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO service_health (service, status, details)
VALUES
  ('worker', 'ok', '{"mock": true, "message": "heartbeat"}'),
  ('api', 'ok', '{"mock": true, "message": "healthy"}');
