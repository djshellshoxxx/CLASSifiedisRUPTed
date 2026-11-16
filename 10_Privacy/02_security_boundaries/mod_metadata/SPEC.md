# F10.S02.M03 — Metadata minimization

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S02](../SPEC.md). **Process IDs:** PS-080-01…PS-080-10. **Code:** `packages/privacy/src/security_boundaries/metadata`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Removes or reduces metadata that would identify a user or place without their intent. It strips EXIF, XMP, IPTC, GPS and embedded thumbnails from images by re-encoding them in the browser before upload and again on any relay that accepts images, truncates IP addresses to /24 for IPv4 and /48 for IPv6 wherever an address is retained, coarsens timestamps shown in public views to the hour, reduces user-agent strings, and sets referrer and analytics policies that send nothing to third parties. It also provides verification checks that tests and relays use to prove the output is clean. It is pure code with no storage; where a retained value is needed, the owning module stores only the minimized form.

## Responsibilities

- Re-encode JPEG, PNG and WebP images (and HEIC converted client-side) to remove all metadata including GPS, EXIF, XMP, IPTC, MakerNote, ICC profile text and embedded thumbnails, applying orientation first and limiting size to 4096 px and 10 MiB.
- Provide verifyImageClean(bytes) that detects any remaining metadata or GPS tags, used by clients before upload and by relays on receipt (PRV-4) to reject non-clean images.
- Provide truncateIp(ip) returning the /24 (IPv4) or /48 (IPv6) network, and rate-limit keys derived from it with a daily rotating salt, so raw addresses are never stored or logged.
- Provide publicTime(ts) which floors a timestamp to the UTC hour for public, search and federated views, and orderKey helpers so ordering inside an hour uses record IDs instead of timestamps.
- Provide userAgentFamily(ua) reducing a user agent to family and major version, and the standard header policy (Referrer-Policy no-referrer for outbound links, no third-party requests, no cookies for analytics).

## Not responsible for

- Deciding which fields are public or private (F10.S02.M02 classification).
- Location snapping to geohash cells and distance buckets (F06.S02, CTR-PRV-001 PRV-1 and PRV-2); this module only guarantees image and header metadata hygiene.
- Image content moderation such as faces or landmarks (F12) and compression quality tuning (F01 media).
- Future: face blurring, video metadata stripping and perceptual-hash based duplicate privacy checks; MVP covers still images only.

## User stories

- As a seller, I take a photo with my phone and the listing photo that goes online contains no GPS position or device identifiers.
- As a member, the timestamps I see on other people's public listings are rounded to the hour so activity patterns are harder to track.
- As a relay operator, my logs and rate limiters never hold complete IP addresses.

## Edge cases

- A JPEG with GPS only in an XMP packet and a MakerNote thumbnail with a second copy of the GPS data; both are removed and verification passes.
- A PNG with text chunks containing the author's name or location; chunks are dropped and only critical chunks remain.
- An image claims to be JPEG but is a polyglot with an appended archive; re-encoding discards trailing bytes and the output is a plain JPEG.
- An animated WebP or GIF is uploaded; MVP accepts first frame only for still images and rejects animated files with PRIVACY_METADATA_IMAGE_UNSUPPORTED.
- A 40-megapixel image exceeds the limit; it is downscaled to 4096 px on the long side before encoding, and inputs above 10 MiB are rejected with PRIVACY_METADATA_IMAGE_TOO_LARGE.
- An IPv6 address with an embedded IPv4 mapped form; it is normalized to IPv4 and truncated to /24.
- A timestamp at 14:59:59.999Z becomes 14:00:00.000Z in public views while the owner still sees the exact time.
- A relay receives an image from an old client that did not strip metadata; the relay re-encodes it, or rejects it if re-encoding fails, but never stores the original bytes.

## UX and accessibility



Headless library with small UI hooks. Upload flow shows a note 'Location and camera details are removed from your photos' with a link to what is removed. Public times render as 'about 14:00' in the user's locale using publicTime(ts) output and owner views show exact time.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-080-01 | [Domain schema](domain_schema.md) | 3 |
| PS-080-02 | [Validation rules](validation_rules.md) | 3 |
| PS-080-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-080-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-080-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-080-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-080-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-080-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-080-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-080-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/security_boundaries/metadata/index.ts`.

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- 100 percent of the 40-image corpus outputs have zero metadata or GPS findings under an independent parser.
- No full IP address and no exact public timestamp appears in any log or public payload in tests.
