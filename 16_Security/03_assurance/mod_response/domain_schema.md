# PS-132-01 — Domain schema: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-01.R01** Each runbook has ID RB-NN, title, trigger conditions, severity mapping, roles, numbered steps each with an owner role and a time target, verification checks, rollback, communication text and last drill date.
- **PS-132-01.R02** The read-only contract is the sentinel file <RELAY_DATA_DIR>/containment/read_only, read every second by the relay process without the database (the environment value RELAY_CONTAINMENT_READ_ONLY=1 is read only at start and creates the sentinel), and the federation kill contract is the relay-scope sentinel <RELAY_DATA_DIR>/containment/federation_off that gates only relay-to-relay traffic; it is not a CTR-FLG-001 flag, so the FLG-2 dependency rule and FLG-3 module disabling do not apply.
- **PS-132-01.R03** Notice templates contain relay name, plain description, the data classes the breached relay actually held (from the generated relay inventory), user actions, contact route and the relay-signed time, and never include speculation or claims that no data was accessed without evidence.
- **PS-132-01.R04** The read-only exemption list is fixed in code by exact command ID - security.containment.set, identity.login_challenge.issue, identity.session.start, identity.session.revoke, security.roleassignment.revoke, security.roleassignment.bootstrap, security.keyrecord.revoke, security.keyrecord.record_revocation, security.keyrecord.ingest_list, platform.relay_identity.revoke, identity.portable_doc.publish (only documents that newly revoke keys), federation.peer.suspend and every security.incident command - and queries are never blocked.

## Specification

**Note:** No catalog entities. Runbooks, templates and the generated relay data inventory are versioned documents. Containment switch state is held as relay-local sentinel files under <RELAY_DATA_DIR>/containment/ (read_only, federation_off, log.jsonl for host changes) read by the relay process, not as an entity; it is neither a CTR-FLG-001 flag nor database state.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-02.R01, PS-132-02.R03, PS-132-04.R03, PS-132-09.R03 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T03 | integration | PS-132-01.R02, PS-132-01.R04, PS-132-03.R04, PS-132-04.R02, PS-132-09.R02 | set read-only; submit listing publish, offer make, identity.session.revoke, security.keyrecord.revoke, security.incident.open, security.roleassignment.revoke, platform.relay_identity.revoke, federation.peer.suspend and several queries | non-exempt commands return SECURITY_READ_ONLY_MODE within 5 s with retryAfterMs 300000; every exempt command ID succeeds; queries unaffected |
| TEST-PS-132-09.T09 | abuse | PS-132-07.R01, PS-132-01.R03 | notice text claiming no data was accessed without an evidence reference; document with 'externally audited'; runbook containing a token-like string | rejected by template validation; SECURITY_RUNBOOK_FORBIDDEN_CLAIM; F16.S01.M02 secret scan fails |
| TEST-PS-132-09.T16 | unit | PS-132-02.R04, PS-132-03.R02, PS-132-01.R03 | RB-02 template inventory against the generated inventory; template without push subscriptions; template without contact route | match; SECURITY_RUNBOOK_INVENTORY_MISMATCH; SECURITY_RUNBOOK_INCOMPLETE |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
