// Error codes of F16.S02.M03 (envelope verification) and of the CTR-FED-001 envelope primitives hosted here.
import { defineErrors } from '@classrup/kernel';

/** F16.S02.M03 envelope error codes (module.spec.yaml errors). */
export const signatureErrors = defineErrors({
  SECURITY_SIGNATURE_INVALID: { status: 422, retryable: false },
  SECURITY_CONTEXT_MISMATCH: { status: 422, retryable: false },
  SECURITY_PAYLOAD_NOT_CANONICAL: { status: 422, retryable: false },
  SECURITY_SIGNER_UNKNOWN: { status: 422, retryable: false },
  SECURITY_BINDING_MISMATCH: { status: 422, retryable: false },
  SECURITY_KEY_REVOKED: { status: 422, retryable: false },
  SECURITY_PAYLOAD_HASH_MISMATCH: { status: 422, retryable: false },
});

export type SignatureErrorCode = keyof typeof signatureErrors.codes;

/**
 * CTR-FED-001 envelope and did:key error codes. F11.S01.M03 is their owner in the specs; the primitives
 * live in @classrup/security because every lower-layer signer needs them, and F11 re-exports this registry.
 */
export const envelopePrimitiveErrors = defineErrors({
  FED_SIGNATURE_INVALID: { status: 400, retryable: false },
  FEDERATION_ENVELOPE_NOT_CANONICALIZABLE: { status: 422, retryable: false },
  FEDERATION_DID_UNSUPPORTED: { status: 422, retryable: false },
  FEDERATION_CID_MISMATCH: { status: 422, retryable: false },
});
