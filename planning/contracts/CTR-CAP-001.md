# CTR-CAP-001 — Capability and authorization model

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F16 Security with F07 Identity (named owners UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-CAP-001 (this file). **Depends on:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001. **Consumed by:** every module authorization matrix (`authorization_capabilities.md`), CTR-FED-001 (peer scopes), CTR-COM-001 (party and dispute rights).

**Decision label:** Grant and decision model is PROVISIONAL (ASSUMPTION, unapproved). Default-deny is not provisional: it is a required rule.

## Scope

How any principal may act on any resource. Covers principal types, action vocabulary, resource scopes, explicit grants, relation-based rules, privileged access, revocation, decision records and field visibility. Authentication, session lifecycle and recovery are owned by F07 and are referenced, not redefined.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-CAP-001.R01 | Default deny. An action is allowed only when a relation rule or an active explicit grant allows it. No match → DENY. | MVP |
| CTR-CAP-001.R02 | Principal types: `user` (`acc_`), `sys` (`sys_`), `ope` (`ope_`), `mod` (`mod_`), `fpr` (`fpr_`). Pseudonyms (`prf_`) are views of an `acc_`; authorization is evaluated on `acc_` only. | MVP |
| CTR-CAP-001.R03 | Action = `<resource_type>.<verb>`. Verbs: `read`, `create`, `update`, `withdraw`, `delete`, `accept`, `reject`, `propose`, `consent`, `execute`, `attest`, `export`, `moderate`, `grant`, `revoke`, `administer`. Each module declares its allowed subset in `authorization_capabilities.md`. | MVP |
| CTR-CAP-001.R04 | Resource scopes: `self` (owner), `participant` (party to a proposal, transaction or dispute), `case:<cas_>` (moderation case), `global` (operator administration; never grants access to PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE content). | MVP |
| CTR-CAP-001.R05 | Relation rules (owner, participant) are derived from aggregate state at decision time. They are not stored as grants. Ownership or participation changes are events and are re-evaluated on the next decision. | MVP |
| CTR-CAP-001.R06 | Privileged grants (`mod`, `ope`, `sys` with `case` or `global` scope, or any access to PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE): require `constraints.purpose`, `expires_at` ≤ 72 h after `not_before` (ASSUMPTION), and a `case_id` for case scope. | MVP |
| CTR-CAP-001.R07 | Operator access to PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE requires two distinct approvers (dual control, ASSUMPTION). A principal cannot approve its own grant (`CAP.SELF_APPROVAL_FORBIDDEN`). | MVP |
| CTR-CAP-001.R08 | Every grant, revoke, and privileged decision emits a CTR-EVT-001 event and an `aud_` record. Each privileged read emits an `aud_` record with resource ID, purpose and decision ID, and no content. | MVP |
| CTR-CAP-001.R09 | Revocation effective at the next decision. Decision cache TTL: ≤ 60 s for non-sensitive reads (ASSUMPTION); zero for writes, privileged access and PRIVATE/FINANCIAL/LOCATION_PRECISE reads. | MVP |
| CTR-CAP-001.R10 | Field visibility per field: `public`, `participant`, `owner`, `case`, `never`. Fields without an allowing rule are omitted from the response, not returned as null. | MVP |
| CTR-CAP-001.R11 | Authorization is enforced server-side on every read, write, export, subscription and attachment download. Actor identity is taken from the authenticated principal; request-body owner or participant IDs are ignored for authorization. | MVP |
| CTR-CAP-001.R12 | Recovery and support never grant capabilities that bypass proof requirements (S3-01). Support operators cannot read or change account credentials. | MVP |
| CTR-CAP-001.R13 | Decision records store outcome and reason code; they store no object content. | MVP |

**Action matrix examples (normative for the model; modules extend it):**

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user (owner) | `lst.update` | own `lst_` | ALLOW (rule: owner) |
| user (non-owner, can see listing) | `lst.update` | `lst_` | DENY → `SYS.FORBIDDEN` |
| user (non-owner, cannot see listing) | `lst.update` | `lst_` | DENY → `SYS.NOT_FOUND` |
| user (participant, active slot, current proposal version) | `cyc.consent` | `cyc_` | ALLOW (rule: participant) |
| user (participant, revised proposal) | `cyc.consent` | `cyc_` with stale version | DENY → `SYS.CONFLICT` (CR-14) |
| mod (grant, case scope) | `rpt.read` | `rpt_` in `cas_` | ALLOW (grant) |
| mod (no grant) | `rpt.read` | `rpt_` | DENY → `SYS.NOT_FOUND` |
| ope (single approval) | `msg.read` | `msg_` | DENY (dual control, R07) |
| fpr (trusted, scope permits) | `evt.import` | peer scope | ALLOW (CTR-FED-001) |
| fpr (quarantined) | `evt.import` | any | DENY → `FED.PEER_NOT_TRUSTED` |

## Data / schema

Grant record:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-CAP-001:grant:1.0.0",
  "type": "object",
  "required": ["grant_id","subject","capability","resource","constraints","granted_by","status","schema_version"],
  "properties": {
    "grant_id": {"type": "string", "pattern": "^grt_[0-9A-HJKMNP-TV-Z]{26}$"},
    "subject": {"type": "object", "required": ["kind","ref"], "properties": {
      "kind": {"enum": ["user","sys","ope","mod","fpr"]},
      "ref": {"type": "string", "pattern": "^(acc|sys|ope|mod|fpr)_[0-9A-HJKMNP-TV-Z]{26}$"}}},
    "capability": {"type": "string", "pattern": "^[a-z_]{2,24}\\.[a-z_]{2,24}$"},
    "resource": {"type": "object", "required": ["type","scope"], "properties": {
      "type": {"type": "string", "pattern": "^[a-z_]{2,24}$"},
      "scope": {"enum": ["self","participant","case","global"]},
      "case_id": {"type": ["string","null"], "pattern": "^cas_[0-9A-HJKMNP-TV-Z]{26}$"},
      "object_id": {"type": ["string","null"]}}},
    "constraints": {"type": "object", "required": ["not_before","expires_at","purpose"], "properties": {
      "not_before": {"type": "string"}, "expires_at": {"type": "string"},
      "max_uses": {"type": ["integer","null"], "minimum": 1},
      "purpose": {"type": "string", "minLength": 3, "maxLength": 64}}},
    "granted_by": {"type": "object", "required": ["kind","ref"]},
    "approvals": {"type": "array", "items": {"type": "object", "required": ["kind","ref","approved_at"]}},
    "status": {"enum": ["active","revoked","expired"]},
    "revoked_at": {"type": ["string","null"]},
    "revocation_reason": {"enum": [null,"purpose_complete","role_removed","key_compromised","peer_revoked","policy_violation","user_request"]},
    "schema_version": {"const": "1.0.0"}
  }
}
```

Decision record: `dec_` ID, `principal` (kind, ref), `action`, `resource` (type, ID), `outcome` (`ALLOW` | `DENY`), `reason_code` (`NO_RELATION`, `NO_GRANT`, `GRANT_EXPIRED`, `GRANT_REVOKED`, `SCOPE_MISMATCH`, `STATE_FORBIDS`, `DUAL_APPROVAL_MISSING`, `STALE_VERSION`, `ALLOW_OWNER`, `ALLOW_PARTICIPANT`, `ALLOW_GRANT`), `decided_at`, `policy_version`.

## Commands / queries / events

| Command | Event(s) | Notes |
|---|---|---|
| `grant.create` | `grant.granted` | Privileged grants require approvals (R06, R07). |
| `grant.revoke` | `grant.revoked` | Idempotent. Second revoke → `CAP.GRANT_NOT_ACTIVE`. |
| `grant.approve` | `grant.approved` | Approver ≠ subject ≠ granter. |
| `authz.decide` | none (decision record `dec_`) | Internal call; not exposed to clients. |

Event payloads contain grant ID, subject ref, capability, scope and revocation reason. They do not contain object content.

## Versioning and compatibility

- Capability vocabulary additions: MINOR. Removing or renaming a capability: MAJOR and requires a migration that re-maps grants.
- `policy_version` is recorded on every decision. Policy changes are MINOR when they only add ALLOW rules for new actions; tightening is MAJOR-equivalent and must be rolled out with a revocation sweep.
- Unknown capability in a grant → deny and log `CAP.UNKNOWN_CAPABILITY` (non-retryable).

## Examples

Valid moderator grant:

```json
{
  "grant_id": "grt_01HZX3P4Q6R8S0T2V4W6X8Y0ZA",
  "subject": {"kind": "mod", "ref": "mod_01HZX3R2S4T6V8W0X2Y4Z6A8BC"},
  "capability": "rpt.read",
  "resource": {"type": "report", "scope": "case", "case_id": "cas_01HZX3T5V7W9X1Y3Z5A7B9C1DE", "object_id": null},
  "constraints": {"not_before": "2026-11-16T10:00:00.000Z", "expires_at": "2026-11-18T10:00:00.000Z", "max_uses": null, "purpose": "moderation_case_review"},
  "granted_by": {"kind": "ope", "ref": "ope_01HZX3V6W8X0Y2Z4A6B8C0D2EF"},
  "approvals": [{"kind": "ope", "ref": "ope_01HZX3W9X1Y3Z5A7B9C1D3E5FG", "approved_at": "2026-11-16T09:58:00.000Z"}],
  "status": "active",
  "revoked_at": null,
  "revocation_reason": null,
  "schema_version": "1.0.0"
}
```

Invalid (violations: privileged grant with no approvals and wrong subject kind; `expires_at` absent for privileged; `scope` `global` on PRIVATE data without dual control):

```json
{
  "grant_id": "grt_01HZX3P4Q6R8S0T2V4W6X8Y0ZA",
  "subject": {"kind": "ope", "ref": "ope_01HZX3R2S4T6V8W0X2Y4Z6A8BC"},
  "capability": "msg.read",
  "resource": {"type": "message", "scope": "global"},
  "constraints": {"not_before": "2026-11-16T10:00:00.000Z", "purpose": "support"},
  "granted_by": {"kind": "ope", "ref": "ope_01HZX3R2S4T6V8W0X2Y4Z6A8BC"},
  "approvals": [],
  "status": "active",
  "schema_version": "1.0.0"
}
```

Violations: `granted_by` equals `subject` (R07, self-approval); `approvals` empty (R07); `constraints.expires_at` missing (R06); `global` scope on PRIVATE_PERSONAL content (R04); `constraints.purpose` is a free-text reason that fails the registry of purposes (R06, ASSUMPTION).

## Validation and errors

| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SYS.FORBIDDEN | false | forbidden / 403 | Visible object, action denied. |
| SYS.NOT_FOUND | false | not_found / 404 | Object not readable by actor (R04, R08 of CTR-ERR-001). |
| CAP.SCOPE_INVALID | false | validation / 400 | Scope not allowed for capability. |
| CAP.EXPIRY_REQUIRED | false | validation / 400 | Privileged grant without `expires_at` or beyond 72 h. |
| CAP.DUAL_APPROVAL_REQUIRED | false | unprocessable_state / 422 | Dual control not satisfied. |
| CAP.SELF_APPROVAL_FORBIDDEN | false | forbidden / 403 | Approver equals subject or granter. |
| CAP.GRANT_NOT_ACTIVE | false | conflict / 409 | Revoke or approve on inactive grant. |
| CAP.UNKNOWN_CAPABILITY | false | validation / 400 | Capability not in vocabulary. |

## Authorization

This contract is the authorization model. Its own administration (grant creation, revocation, policy changes) is itself gated by `grt.administer` for `ope` principals with dual control, and every change is audited (R08).

## Failure, idempotency, concurrency, offline

- Grant creation and revocation use CTR-EVT-001 idempotency keys and revision checks.
- Decisions fail closed: if the policy store or grant store is unavailable, the decision is DENY with `SYS.UNAVAILABLE` (retryable).
- Offline clients never make authorization decisions. Cached client-side visibility is cosmetic only. Queued commands are re-authorized at server commit (CR-14, S3-10).
- Revocation propagation: online decisions see revocation within R09 limits. Federated peers receive `grant.revoked` through CTR-FED-001 events. Peer quarantine denies all peer actions at the local boundary immediately. Offline devices see the revocation at their next sync; their queued writes fail at commit.
- ASSUMPTION: sessions carrying derived tokens are checked against grant state at each privileged action; a revoked grant invalidates the session's derived token within 60 s.

## Privacy, retention, abuse

- Grants and decision records: RET-AUD (12 months, ASSUMPTION). Grant events: RET-EVD while subject is active, then RET-AUD.
- Decision records contain no object content (R13).
- Abuse: repeated DENY from one principal (threshold per hour, ASSUMPTION) raises `CAP` alerts (BT-01). Bulk endpoints authorize per item; counts in list responses include only visible items.
- Operator access logs are stored separately from application logs and are readable only by the audit role (BT-02).

## Observability and budgets

- Metrics: `authz_decisions_total{outcome,reason_code}`, `authz_decision_latency_ms` p95 ≤ 5 ms (ASSUMPTION), `authz_unavailable_total`.
- Alerts: privileged reads outside an active case; grant approvals by pairs that have co-approved more than N times (ASSUMPTION); revocation propagation lag > 60 s.
- Logs carry decision IDs and reason codes only.

## Tests

- TEST-CTR-CAP-001-01 (unit): default deny. No grant, no relation → DENY for every action in the vocabulary.
- TEST-CTR-CAP-001-02 (matrix): every row of the action matrix produces the stated outcome and error code.
- TEST-CTR-CAP-001-03 (negative integration): cross-user IDs, changed participant lists, stale roles, revoked membership, guessed IDs, bulk endpoints and alternate API paths all deny (S3-02).
- TEST-CTR-CAP-001-04 (privileged): privileged grant without `expires_at`, without approvals, or with self-approval is rejected.
- TEST-CTR-CAP-001-05 (revocation): revoke then decide within 60 s → DENY; in-flight write after revocation → DENY at commit.
- TEST-CTR-CAP-001-06 (peer): quarantined peer denied on every import path; resumed after trust restoration with new grant only.
- TEST-CTR-CAP-001-07 (field visibility): non-permitted fields absent (not null) in responses; list counts exclude invisible items.
- TEST-CTR-CAP-001-08 (recovery): support role cannot change credentials or bypass recovery proof (S3-01, R12).
- TEST-CTR-CAP-001-09 (audit): every grant, revoke and privileged read emits an `aud_` record; decision logs contain no content (R13).
- TEST-CTR-CAP-001-10 (fail closed): policy store down → DENY with `SYS.UNAVAILABLE`, no data returned.

## Acceptance criteria

1. Default deny holds for all actions in the vocabulary (TEST-01).
2. Action matrix examples pass (TEST-02) and each module authorization matrix references CTR-CAP-001 action names.
3. Revocation propagation within 60 s online (TEST-05).
4. Dual control enforced for PRIVATE_PERSONAL, FINANCIAL_EVIDENCE and LOCATION_PRECISE operator access (TEST-04).
5. TEST-CTR-CAP-001-01 through -10 pass in CI.

## Assumptions & open decisions

- ASSUMPTION: 72 h privileged grant maximum; purpose registry owned by F16 (values OPEN).
- ASSUMPTION: 60 s decision cache and revocation SLO.
- ASSUMPTION: dual control applies to operator access to PRIVATE_PERSONAL, FINANCIAL_EVIDENCE and LOCATION_PRECISE.
- OPEN: policy language (declarative table vs code). Default: declarative table versioned with `policy_version`, reviewed by F16.
- Related: S3-01, S3-02, CR-10, CR-11, CR-14, BT-06 (privileged-access review cadence, ASSUMPTION 90 days).
