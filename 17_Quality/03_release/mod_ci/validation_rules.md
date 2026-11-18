# PS-141-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-02.R01 | A pipeline definition that omits a required check, or lists an unknown stage, is rejected before it is stored. | MVP |
| PS-141-02.R02 | A third-party action reference that is not pinned to a full commit digest is rejected for `release` and `untrusted_fork` pools. | MVP |
| PS-141-02.R03 | Job results with a missing artifact digest are rejected; a job cannot be marked `passed` without its digests. | MVP |
| PS-141-02.R04 | Any value matching a secret-pattern (token prefix, private key header) in a job record is rejected and the run is marked `failed`. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| CIPIPE.REQUIRED_CHECK_MISSING | false | validation / 400 | err.cipipe.required_check_missing | check key |
| CIPIPE.ACTION_NOT_PINNED | false | validation / 400 | err.cipipe.action_not_pinned | action name without credentials |
| CIPIPE.ARTIFACT_DIGEST_MISSING | false | validation / 400 | err.cipipe.artifact_digest_missing | job key |
| CIPIPE.SECRET_PATTERN_FOUND | false | validation / 400 | err.cipipe.secret_pattern_found | job key only, never the match |
| CIPIPE.INVALID_TRANSITION | false | unprocessable_state / 422 | err.cipipe.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

Diagnostics never include the matched secret text, log lines or stack traces (CTR-ERR-001 R06).

## Assumptions & open decisions
- ASSUMPTION: secret-pattern list is maintained by the Security Lead and reviewed quarterly.
- No Dxx decision governs these rules directly: D07 applies only to retention of rejected-run logs (PROVISIONAL, unapproved).
