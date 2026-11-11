# F06.S03.M01 Relevance ranking (PS-051)

## Implemented
- Commands (relay surface): `discovery.ranking_config.publish`, `discovery.ranking_config.rollback` (idempotent, `expectedActiveVersion` compare-and-set, 10 per 24 h limit, operator only).
- Query (both surfaces, public): `discovery.ranking_config.get_active` (`includeHistory`, at most 20 versions).
- Event: `discovery.ranking_config.published` (P0), emitted in the activation transaction.
- Error: `RANKING_CONFIG_INVALID` (422), defined here via `defineErrors` (`rankingErrors`).
- Statement: `classrup.discovery.ranking_config/v1`, signed by the relay key through the `signStatement` port; `readRankingConfigStatement` verifies a statement client side (signature, type, schema, optional expected relay key).
- Pure functions (also used by the vault): `score`, `explainComponents`, `rankCandidates`, `compareScored`, `distanceBucketForKm`, `distanceBucketBetweenCells`, `DEFAULT_RANKING_CONFIG`.
- Registration: a vault registers `rankingConfigVaultDefinitions()` (read only, returns the bundled default); a relay registers `rankingConfigDefinitions(options)`. Do not register both.
- Repos: `discovery.ranking_config` (3 indexes), `discovery.ranking_config_statement` (envelope per cid).

## Ports the composition root must supply
- `RankingConfigOptions.relayId: string`, `relayAuthor: string` (did of the relay key that must have signed).
- `isOperator(actorId: string, relayId: string): boolean` (relay policy; false for operators of another relay).
- `signStatement(type, payload, seq, previousCid | null): Promise<SignedEnvelope>` and `verifyStatement(envelope): Promise<VerifiedStatement>`.
- `RegionPort.cellDistanceKm(fromCell, toCell): number` for `distanceBucketBetweenCells` (geoprivacy module, coarse cells only).
- The caller computes `bm25` with FTS5 using `config.bm25.titleWeight/bodyWeight` and passes the raw (zero or negative) value.

## Deviations and interpretations
- V07 rate limit is enforced inside the handler by counting configs activated in the last 24 h (publish and rollback both count), not through `RateLimitPort`, so the limit is per relay and survives restarts. Returns `RATE_LIMITED` with `retryAfterMs`.
- Validation of ranking parameters happens in the handler (input fields are `z.unknown()`), so every violation returns `RANKING_CONFIG_INVALID` instead of the bus-level `VALIDATION_FAILED`. Missing/unknown top level fields and a bad `expectedActiveVersion` are still `VALIDATION_FAILED`.
- The bundled default (version 1) is virtual until the first publication; it is then stored as a retired row, so history and rollback to version 1 work. `get_active` also returns the signed `statement` envelope of the active version (extra output field) so clients can verify it.
- Promotion applies only when the index sells it (`ctx.promotionEnabled`), the flag is set and `promotedUntil` is present and in the future (fail closed when `promotedUntil` is absent). Multiplier is `min(1 + boost, 1.25)`.
- When the query has no reference region the distance term is dropped per query (`hasDistance: false`) and weights are renormalized, mirroring the no-text rule; spec only states the text case. Distance bucket must then be present for every candidate when `hasDistance` is true.
- Explanation keys returned by `explainComponents`: text_match, recent (recency >= 0.5, i.e. within the half-life), distance_bucket, promoted, default_ranking (bundled config). The `field` parameter of text_match is not known at this layer.
- Metrics and the log line `ranking.config_published` are partial: the log is written; metrics are not registered (no metrics port in the module options).

## Test rows not covered
- T11 (load, device emulation), T13 (traceability tool run), T14 (relay backup restore and vault import of a config statement: no export/import functions are implemented here; JSON Lines export and history import validation are left out).

## Open questions
- Whether the backup export/import of version history belongs to this module or to the relay composition (CTR-IOX-001).
