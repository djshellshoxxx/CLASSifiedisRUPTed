import { defineErrors } from '@classrup/kernel';

/** Module-owned error codes of F10.S02.M03 (CTR-ERR-001); defined once here. */
export const metadataErrors = defineErrors({
  PRIVACY_METADATA_IMAGE_UNSUPPORTED: { status: 415, retryable: false },
  PRIVACY_METADATA_IMAGE_TOO_LARGE: { status: 413, retryable: false },
  PRIVACY_METADATA_GPS_PRESENT: { status: 422, retryable: false },
});
