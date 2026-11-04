# CTR-OBS-001 — Observability and performance budgets

**Status:** APPROVED. **Owner:** F15.S03.M01 (mod_observability).

- **OBS-1** Logs: JSON lines `{ts, level, msg, correlationId, module, code?, durationMs?}`; no P2–P4 values, no tokens, no IPs beyond /24 (IPv4) or /48 (IPv6) truncation, retained RET-AUDIT.
- **OBS-2** Metrics (Prometheus text at `/metrics`, operator-only): `classrup_<featureSlug>_<name>_<unit>` with labels limited to `{tenant, module, code, outcome}`; no user IDs as labels.
- **OBS-3** Every command records `classrup_command_duration_ms` histogram and `classrup_command_total{outcome}`; every consumer records lag `classrup_outbox_lag_ms`.
- **OBS-4** Budgets (reference: 2 vCPU / 4 GB relay, SQLite WAL): read p95 ≤ 150 ms, write p95 ≤ 300 ms at 50 req/s; cycle search (F02.S02) ≤ 250 ms p95 for graphs ≤ 5 000 edges with max cycle length 5; search query p95 ≤ 200 ms over 100 000 listings.
- **OBS-5** PWA budgets (Moto G-class device, 4G profile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 150 KiB gzip, app shell works offline after first visit.
- **OBS-6** Health: `/healthz` (liveness), `/readyz` (DB writable, migrations current, outbox lag < 60 s).
