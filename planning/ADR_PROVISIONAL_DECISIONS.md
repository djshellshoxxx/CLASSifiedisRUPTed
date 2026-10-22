# Provisionally selected architecture decisions (2026-10-22)
Status: PROPOSED FOR REVIEW, NOT RATIFIED. Supersede entries in ../DECISIONS.md only after module owners and security/jurisdiction reviewers approve. Each change touching an upstream contract requires downstream regression search and coordinated version bump. The proposed choices are deterministic defaults, not evidence of production safety.

| ADR | Related open decision | Selected default | Why | Rejected/alternative | Impact and rollback |
|---|---|---|---|---|---|
| ADR-0001 | existing PWA trust | static PWA + authenticated separately deployed API/SQL/outbox | browser alone cannot authorize/store reliable private commerce | client-only peer trust | feature flag server write paths |
| ADR-0002 | event ownership | single source owner, UUIDv7, versioned events, outbox/inbox and idempotency | avoids conflicting authors and ambiguous replay | direct coupled calls | dual-read/dual-write event version migration |
| ADR-0003 | D02 | bounded simple cycle search k2..8 and explicit incomplete status | finite CPU, deterministic testing and no false no-match | global unbounded max-cycle objective | reduce graph budgets, not alter existing consent digest |
| ADR-0004 | D01 | signed FedRecordV1 JCS+Ed25519, federation off by default | explicit provenance and local moderation | immediate ActivityPub interoperability | adapter behind flag with import quarantine |
| ADR-0005 | D06 | claim/acknowledgement/independent verification separate | attestation does not prove payment/delivery | screenshot means confirmed | revert verification integration, preserve immutable history |
| ADR-0006 | D05 | public coarse area only and opt-in private meetup sharing | reduce geolocation risk | exact pins public | purge projections + re-sign tombstones |
| ADR-0007 | D07 | 24h idempotency receipts, 30d operations outbox, 90d backups, bounded case holds | short recovery with explicit privacy budgets | indefinite storage | retention migration must not prematurely delete legal hold |
| ADR-0008 | D08 | offline requests local pending until server authenticated ACK | cannot guarantee consistency offline | optimistic 'verified' state | disable offline mutations |
| ADR-0009 | D09 | rental deposits are external claims, no platform custody | avoid unintended fund control | platform escrow | disable rental module absent policy review |
| ADR-0010 | D10 | local session key management initially; portable key identity/federation later | user security/recovery needs dedicated product design | launch portable decentralized accounts untested | stage key protocol behind flag |
| ADR-0011 | D03 | integer currency minor-unit amounts; same-currency compensation MVP; FX future pinned rational quotes | prevents floating-point ambiguity and unreviewed oracle assumptions | live unpinned FX | disable cross-currency |
| ADR-0012 | D04 | all-party revision-bound consent; physical handoff as per-party attestations, compensating dispute | no digital atomicity of real-world actions | false atomic escrow promise | freeze further handoffs, initiate case |
| ADR-0013 | new | MVP server-readable private messaging with TLS+at-rest encryption and truthful disclosure; E2EE future | multi-device E2EE/recovery/security not yet specified | label ordinary private threads as E2EE | migrate only with secure per-device identity audit |
| ADR-0014 | new | one initial tenant; cross-tenant isolation in every schema | manageable tenancy while designing safe growth | shared unscoped SQL tables | stop multi-tenant rollout; migrate controlled |
| ADR-0015 | new | no confirmed external crypto state until chain finality per-network verification contract | reorg/double-spend and provider trust | trust user-submitted TX hash | flag crypto verification OFF |

## ADR acceptance requirements
Each ADR must record accountable owner, alternatives, measured impact, threat map, test IDs, status history and explicit effective date. Current owners are only feature IDs; no individual reviewer approvals exist. Risk-weighted signoff required for F09/F11/F16/F18. A spec marked 'SPECIFIED_REVIEW_PENDING' does not constitute ADR acceptance. Product build gate remains NO-GO.
