# PS-134-03 — Workflow state machine: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-03.R01** There is no entity lifecycle for the module; each journey exercises lifecycles owned by other modules.
- **PS-134-03.R02** A journey passes only if the UI state of each participant matches that participant's own vault state, and the vaults agree on the signed statements they exchanged (same cid and revision, verified signer). For an offer, the buyer and seller vaults in separate browser contexts hold the same accepted offer cid and revision and the Deal, and the buyer's OutboxEntry reaches peer_accepted bound to that cid; in the no-relay profile the envelopes travel as direct file transfers. Relay checks cover only relay-held artifacts (the receipt for an opaque envelope, index presence of a P0 projection), and no relay query returns offer plaintext (P2, CTR-PRV-001 PRV-5).
- **PS-134-03.R03** Offline journeys walk the F15.S01.M01 sync states: the offer is local committed at once; its OutboxEntry is prepared while offline (Saved on this device), then sending, then transport_acknowledged after a verified relay receipt (Delivered to relay, peer has not confirmed), then peer_accepted when the seller's signed acknowledgement arrives (Confirmed by peer); conflict, failed and expired are driven by injected relay responses and page.clock; each state is visible and announced and the UI never shows more than the reached state.
- **PS-134-03.R04** A no-relay journey runs with all network requests aborted: first-run identity creation, local listing publish, local search, vault export and restore, and sync status displayed as Saved on this device (local committed, OutboxEntry prepared) without claiming delivery.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T05 | e2e | PS-134-03.R01, PS-134-03.R02 | buyer makes offer, seller accepts on a second browser context (with-relay profile, and no-relay profile with direct file transfer) | buyer and seller vaults both hold the accepted offer (same cid and revision, verified signer) and the Deal, and each UI matches its own vault; the buyer OutboxEntry is peer_accepted bound to that cid; the relay holds only ciphertext envelopes and receipts for that thread and no relay query returns offer plaintext |
| TEST-PS-134-09.T06 | e2e | PS-134-03.R03, PS-134-06.R01 | go offline, create offer, reload page, go online, seller acknowledges | one OutboxEntry with the original cid survives the reload; the seller vault applies the offer once (dedupe by cid); labels move Saved on this device, then Delivered to relay, peer has not confirmed, then Confirmed by peer and never ahead of the reached state |
| TEST-PS-134-09.T16 | a11y | PS-134-03.R03 | walk prepared, sending, transport_acknowledged, peer_accepted plus conflict, failed and expired with a screen-reader live region check | each change announced via aria-live polite with the F15.S01.M01 label; conflict uses role=alertdialog |
| TEST-PS-134-09.T18 | e2e | PS-134-03.R04 | block all network, create identity, publish listing locally, search, export and restore the vault | journey completes with zero network requests; status Saved on this device; QUALITY_E2E_RELAY_REQUIRED never raised |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
