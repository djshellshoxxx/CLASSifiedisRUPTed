// @classrup/kernel/browser — vault storage on IndexedDB.
export { openIndexedDbStorage, VAULT_DB_VERSION, type IndexedDbOptions, type VaultLocks } from './storage/indexeddb.ts';
export { openIndexedDbConnection, type IndexedDbConnection } from './storage/indexeddb.ts';
export { createMemoryDriver, TABLES, type Change, type Snapshot, type TableName } from './storage/memory-driver.ts';
