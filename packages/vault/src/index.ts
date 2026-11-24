export { openVault, vaultFromStorage, backupCodec, type Vault, type UnlockedVault, type BackupCodec, type VaultOptions, type BackupCoverage, type AttachmentCoverage } from './vault.ts';
export { verifySealedAttachmentManifest, verifySealedAttachmentBlobBatch, type AttachmentManifestParent, type AttachmentManifestBlob, type VerifiedAttachmentManifestMetadata } from './attachment-manifest.ts';
export { createVaultAutoLock, VaultUnlockRateLimitError, type AutoLockOptions, type AutoLockReason } from './session-policy.ts';
export { type AttachmentZeroRefTransition } from './attachment-transition.ts';
