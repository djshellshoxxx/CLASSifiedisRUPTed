/**
 * Signed, expiring, revocable capability tokens for delegation (e.g. a relay granting a
 * participant read access to one trade). Bearer semantics: holders must keep them private.
 */
import type { Permission } from '@classrup/kernel';
import { forbidden, unauthenticated } from '@classrup/kernel';
import type { SignedEnvelope, SigningKeyPair } from './signatures';
import { keyIdOf, signEnvelope, verifyEnvelope } from './signatures';

export interface CapabilityClaims {
  readonly jti: string;
  readonly sub: string;
  readonly permission: Permission;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly iat: number;
  readonly exp: number;
}

const CTX = 'capability';
const MAX_LIFETIME_MS = 30 * 24 * 3600 * 1000;

export function issueCapability(issuer: SigningKeyPair, claims: CapabilityClaims): SignedEnvelope<CapabilityClaims> {
  if (claims.exp <= claims.iat || claims.exp - claims.iat > MAX_LIFETIME_MS) throw new RangeError('invalid capability lifetime');
  return signEnvelope(issuer, CTX, claims);
}

export interface CapabilityCheck {
  readonly issuerKeyId: string;
  readonly now: number;
  readonly isRevoked: (jti: string) => boolean;
  readonly subject: string;
  readonly permission: Permission;
  readonly resourceType: string;
  readonly resourceId: string;
}

export function verifyCapability(token: SignedEnvelope<CapabilityClaims>, check: CapabilityCheck): CapabilityClaims {
  if (!verifyEnvelope(token, CTX, check.issuerKeyId)) throw unauthenticated('CAPABILITY.INVALID', 'capability signature invalid');
  const c = token.payload;
  if (check.now >= c.exp) throw unauthenticated('CAPABILITY.EXPIRED', 'capability expired');
  if (check.now < c.iat) throw unauthenticated('CAPABILITY.NOT_YET_VALID', 'capability not yet valid');
  if (check.isRevoked(c.jti)) throw unauthenticated('CAPABILITY.REVOKED', 'capability revoked');
  if (c.sub !== check.subject || c.permission !== check.permission || c.resourceType !== check.resourceType || c.resourceId !== check.resourceId) {
    throw forbidden('CAPABILITY.SCOPE_MISMATCH', 'capability does not grant this access');
  }
  return c;
}

export const issuerKeyId = (k: SigningKeyPair): string => keyIdOf(k.publicKey);
