# F10.S02.M03 — Metadata minimization

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S02](../SPEC.md). **Process IDs:** PS-080-01…PS-080-10. **Code:** `packages/privacy/src/security_boundaries/metadata`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Removes or reduces metadata that would identify a user or place without their intent. In the browser it strips EXIF, XMP, IPTC, GPS and embedded thumbnails from images by re-encoding them before upload and keeps the clean output within the 5 MiB MediaBlob limit (N9). Relays never re-encode: blobs are content-addressed and referenced from signed listings, so a relay only runs verifyImageClean on receipt and rejects an image that is not clean, storing exactly the bytes whose hash the listing names. It keeps IP-derived data in memory only and lets other modules retain nothing but daily-salted rate-limit keys, floors every timestamp in public projections to the UTC hour and mints public record IDs whose embedded time is floored too, reduces user-agent strings, and sets referrer and analytics policies that send nothing to third parties. It also provides verification checks that tests and relays use to prove the output is clean. It is pure code with no storage; where a retained value is needed, the owning module stores only the minimized form.

## Responsibilities

- Re-encode JPEG, PNG and WebP images (and HEIC converted client-side) in the browser to remove all metadata including GPS, EXIF, XMP, IPTC, MakerNote, ICC profile text and embedded thumbnails, applying orientation first, limiting size to 4096 px, and stepping quality and then dimensions down until the output is at most 5 MiB.
- Provide verifyImageClean(bytes) that detects any remaining metadata or GPS tags, used by clients before upload and by relays on receipt to reject non-clean images with PRIVACY_METADATA_GPS_PRESENT; relays never re-encode or substitute bytes.
- Provide truncateIp(ip) returning the /24 (IPv4) or /48 (IPv6) network for in-memory use only, and rateLimitKey(ip, dailySalt), the only IP-derived value any module may retain or log.
- Provide publicTime(ts), which floors a timestamp to the UTC hour, publicRecordId(now), which mints a UUIDv7 whose embedded time is floored to the UTC hour with random remaining bits, and assertCoarseTime(payload), which fails when a public payload carries a finer time or a finer UUIDv7 time.
- Provide userAgentFamily(ua) reducing a user agent to family and major version, and the standard header policy (Referrer-Policy no-referrer for outbound links, no third-party requests, no cookies for analytics).

## Not responsible for

- Deciding which fields are public or private (F10.S02.M02 classification).
- Location snapping to geohash cells and distance buckets (F06.S02, CTR-PRV-001 PRV-1 and PRV-2); this module only guarantees image, time and header metadata hygiene.
- Image content moderation such as faces or landmarks (F12), compression quality tuning (F01 media) and MediaBlob storage (F15.S02.M03).
- Packaging public projections (F11.S01.M01), which must call publicTime and publicRecordId for every public record and timestamp.
- Future: face blurring, video metadata stripping and perceptual-hash based duplicate privacy checks; MVP covers still images only.

## User stories

- As a seller, I take a photo with my phone and the listing photo that goes online contains no GPS position or device identifiers.
- As a member, the timestamps and record IDs in other people's public listings reveal at most the hour of activity, so activity patterns are harder to track.
- As a relay operator, my logs and rate limiters never hold IP addresses or networks, only keys that rotate daily.

## Edge cases

- A JPEG with GPS only in an XMP packet and a MakerNote thumbnail with a second copy of the GPS data; both are removed and verification passes.
- A PNG with text chunks containing the author's name or location; chunks are dropped and only critical chunks remain.
- An image claims to be JPEG but is a polyglot with an appended archive; re-encoding discards trailing bytes and the output is a plain JPEG.
- An animated WebP or GIF is uploaded; MVP accepts first frame only for still images and rejects animated files with PRIVACY_METADATA_IMAGE_UNSUPPORTED.
- A 40-megapixel image exceeds the limit; it is downscaled to 4096 px on the long side before encoding, and inputs above 10 MiB are rejected with PRIVACY_METADATA_IMAGE_TOO_LARGE.
- A 4096 px PNG photo re-encodes to 9 MiB; the pipeline steps the long side down to 3072 and then 2048 px until it is at most 5 MiB, and fails with PRIVACY_METADATA_IMAGE_TOO_LARGE only if 2048 px is still too large.
- An IPv6 address with an embedded IPv4 mapped form; it is normalized to IPv4 and truncated to /24.
- A timestamp at 14:59:59.999Z becomes 14:00:00.000Z in the public projection while the owner still sees the exact time in the vault.
- A relay receives an image from an old client that did not strip metadata; the relay rejects it with PRIVACY_METADATA_GPS_PRESENT, never re-encodes it, and the client strips and uploads again.

## UX and accessibility



Headless library with small UI hooks. Upload flow shows a note 'Location and camera details are removed from your photos' with a link to what is removed. Public times render as 'about 14:00' in the user's locale from the hour-floored createdAt of the projection, and owner views show exact time.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-080-01 | [Domain schema](domain_schema.md) | 5 |
| PS-080-02 | [Validation rules](validation_rules.md) | 3 |
| PS-080-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-080-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-080-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-080-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-080-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-080-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-080-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-080-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/security_boundaries/metadata/index.ts`.

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- 100 percent of the 40-image corpus outputs have zero metadata or GPS findings under an independent parser, and every output is at most 5 MiB.
- No full IP address, truncated network or public timestamp finer than the hour appears in any log or public payload in tests, and relays never store bytes other than those the listing references.
