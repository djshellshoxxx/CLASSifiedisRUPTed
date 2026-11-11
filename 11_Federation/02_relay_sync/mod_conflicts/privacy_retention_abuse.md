# PS-086-07 — Privacy, retention and abuse: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-07.R01** Conflict records hold cids, provenance and public payload diffs only; commitment conflicts reference participant statements by cid, never store plaintext and never exist on a relay.
- **PS-086-07.R02** A relay operator sees only public projections and therefore resolves only public_projection conflicts on that relay.
- **PS-086-07.R03** Attackers must not be able to freeze someone else's trade with unsigned or role-less statements.
- **PS-086-07.R04** The module registers the N6 ports (ExportSectionPort, DeletionPort, RetentionPurgePort), classifies fields with F10.S02.M02 and pseudonymizes the author DID of retained conflict evidence on privacy.deletion.completed.
- **PS-086-07.R05** Forks are attributed to the author; after 20 open conflicts the author's further envelopes are quarantined, and forwarding relays are never penalized for an author's equivocation.

## Specification

**Data classification**
- ConflictRecord commitment class: P2, vault only; logs carry IDs only.
- ConflictRecord public_projection class: P1 to the relay operator; candidate cids, claimed and receipt times, author did.
- Candidate payloads stay in F11.S01.M02 under their own class.

**Retention**
- RET-EVIDENCE (2 years after resolution) so a trade dispute can show what was received and when; pseudonymized on account deletion.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Griefing: attacker injects a second statement to freeze a victim's trade | detect requires a verified signature by the victim's authorized key or a listed participant; role-less statements are quarantined by F11.S01.M02 and never open a conflict |
| T02 | Equivocating author shows different histories to different peers | both versions retained as evidence; the author's chain marked forked; author-level limit of 20 open conflicts then author quarantine; forwarding relays are not blamed |
| T03 | Operator abuse: resolving in favor of a friendly author | operators resolve public projections only; resolution recorded with decidedBy and note; both signed candidates remain; audit entry under RET-AUDIT |
| T04 | Clock-claim manipulation to look earlier, or a relay claiming to be the author's home | claimed times labelled claims; origin-wins uses this receiver's receipt from a relay listed in the author's own portable document, never claimed time or a relay binding |
| T05 | One party settling a double promise alone | commitments accept only drop_all (local release) or a renegotiated digest signed by every required signer (V04) |
| T06 | Freeze failing open while the detected event is in transit | candidates quarantined in the detecting transaction; domain modules call is_frozen synchronously and fail closed |

**Abuse controls**
- At most 20 open conflicts per author per tenant; the 21st detection puts the author's further envelopes in author-level quarantine with no peer health signal.
- Commitment freezes can always be lifted locally by the vault principal choosing drop_all, so no counterparty can lock a vault indefinitely.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T10 | abuse | PS-086-07.R03, PS-086-01.R04 | attacker signs a statement as a non-participant for a victim's proposal | quarantined by F11.S01.M02 V14, no conflict opened, trade not frozen |
| TEST-PS-086-09.T13 | integration | PS-086-07.R02, PS-086-02.R05 | relay harness: operator calls resolve on a public conflict and on a commitment conflict id injected into the relay store; inspect relay storage | first succeeds with audit; second FORBIDDEN; relay holds no commitment record and no plaintext |
| TEST-PS-086-09.T22 | abuse | PS-086-07.R05 | malicious author forks 21 times, each fork delivered through two honest relays | the 21st returns FEDERATION_CONFLICT_AUTHOR_LIMIT and quarantines the author's later envelopes; detected events carry no peer blame and no peer health changes |
| TEST-PS-086-09.T23 | unit | PS-086-07.R04, PS-086-07.R01 | export, deletion and retention ports called by F10; privacy.deletion.completed; log capture for a commitment conflict | sections and plans returned; author DID pseudonymized in retained records; logs hold IDs only |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
