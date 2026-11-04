// Runs the shared storage contract suite against every adapter (PS-119 09.R01). The suite defines
// TEST-PS-119-09.T01, TEST-PS-119-09.T02, TEST-PS-119-09.T03, TEST-PS-119-09.T04, TEST-PS-119-09.T05,
// TEST-PS-119-09.T09 and TEST-PS-119-09.T17 once per adapter (titles carry the adapter name).
import { IDBFactory } from 'fake-indexeddb';
import { storageContractSuite } from './contract-suite.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import { createMemoryStorage } from './storage.ts';

let n = 0;
storageContractSuite('memory', () => createMemoryStorage());
storageContractSuite('sqlite', () => openSqliteStorage({ path: ':memory:' }));
storageContractSuite('indexeddb', () => openIndexedDbStorage({ name: `vault-${++n}`, indexedDB: new IDBFactory() }));
