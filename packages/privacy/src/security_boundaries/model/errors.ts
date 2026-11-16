import { defineErrors } from '@classrup/kernel';

/** Module-owned error codes of F10.S02.M02 (CTR-ERR-001); defined once here. */
export const modelErrors = defineErrors({
  PRIVACY_CLASSIFICATION_MISSING: { status: 500, retryable: false },
  PRIVACY_SINK_FORBIDDEN: { status: 403, retryable: false },
  PRIVACY_LOCATION_TOO_PRECISE: { status: 422, retryable: false },
});
