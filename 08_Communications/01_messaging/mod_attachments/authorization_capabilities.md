# PS-059-05 — Authorization and capabilities: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-05.R01** Relay policy lets only device keys registered at the relay (relay access token) create slots, upload and finalize, within the quotas below; vault policy lets only the local principal attach images to its own messages.
- **PS-059-05.R02** Only the uploader device key can delete an attachment; a relay moderator can remove a blob only under that relay's hosting policy with a recorded reason.
- **PS-059-05.R03** Download requires the secret 256-bit token that only the message participants hold; wrong tokens and unknown IDs return NOT_FOUND.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.attachment.attach | local principal | vault policy; participant(thread) |
| comms.attachment.remove | local principal | vault policy; attachment.uploaderDid is the local principal |
| comms.attachment.upload | registered relay device | relay policy; valid relay access token; attachment.uploaderDid is the caller for chunk and finalize; relay quota not exceeded |
| comms.attachment.delete | registered relay device, operator | uploader device key, or relay operator under hosting policy with recorded reason |
| comms.attachment.read | download token holder | SHA-256 of presented token equals downloadTokenHash; blob not expired |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T07 | abuse | PS-059-05.R01, PS-059-05.R02, PS-059-05.R03 | upload without relay token; download with wrong token; delete signed by another device key | UNAUTHENTICATED, NOT_FOUND or FORBIDDEN |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F09.S02.M02, F15.S02.M03, F10.S02.M03, F11.S01.M01, F11.S01.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
