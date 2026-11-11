# PS-118-05 — Authorization and capabilities: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-05.R01** Relay policy applies, so identity reads are public, status reads and rotation need the relay-scope role relay_operator or admin, and revocation needs local CLI access; the roles are F16.S01.M01 RoleAssignment records of scope relay that govern nothing beyond this relay (CTR-CAP-001 CAP-9), and tenant-scoped operator roles never grant these capabilities.
- **PS-118-05.R02** The relay holds no user credentials; operator actions are authorized by signed requests from a device key holding an active F16.S01.M01 RoleAssignment, or by the local CLI with filesystem access to the key file, never by entries in the relay configuration.
- **PS-118-05.R03** Receipts and announcements are signed with the relay key under context strings, so a relay signature never authorizes any action on a vault.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.relay_identity.read_public | anonymous, member, moderator, operator, relay_operator, admin | none; response contains only public data |
| platform.relay.read_status | relay_operator, admin | signed request by a key with an active F16.S01.M01 RoleAssignment of scope relay |
| platform.relay_identity.rotate | relay_operator, admin | signed request by a key with an active relay-scope F16.S01.M01 RoleAssignment, or local CLI with access to the key file; Idempotency-Key and expectedRevision; at most 1 rotation per 24 h |
| platform.relay_identity.revoke | relay_operator, admin | local CLI with filesystem access to RELAY_DATA_DIR only; no prior-key authorization; exempt from the 24 h limit; never callable over HTTP |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T09 | abuse | PS-118-05.R01, PS-118-05.R02, PS-118-05.R03 | member M1 and tenant operator TO1 rotate and read status; relay signature presented as vault authorization | FORBIDDEN for both; relay signature ignored by vault verification test |
| TEST-PS-118-09.T12 | abuse | PS-118-01.R02, PS-118-05.R02 | delete key file while identity row exists, then start; then relay identity init --new-identity | refuses with PLATFORM_RELAY_IDENTITY_MISSING; --new-identity creates a new genesis key and a new relayId that no chain links to the old one |
| TEST-PS-118-09.T21 | abuse | PS-118-01.R02, PS-118-05.R03 | thief signs a rotation from key k2 while the operator signs another from k2; second rotation attempt on this relay from k2 | vault verifier detects two rotations with prevKeyId k2 and freezes the relay with a warning; this relay's unique index refuses to sign a second rotation from k2 |
| TEST-PS-118-09.T25 | integration | PS-118-05.R01, PS-118-05.R02 | relay_operator RO1 with an active relay-scope RoleAssignment rotates and reads status; RO1 after the assignment expires | allowed; then FORBIDDEN; no capability consults relay configuration for roles |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, F16.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
