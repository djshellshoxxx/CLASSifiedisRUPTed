export { openVault, vaultFromStorage, backupCodec, type Vault, type UnlockedVault, type BackupCodec, type VaultOptions, type BackupCoverage } from './vault.ts';
export { createVaultAutoLock, VaultUnlockRateLimitError, type AutoLockOptions, type AutoLockReason } from './session-policy.ts';
