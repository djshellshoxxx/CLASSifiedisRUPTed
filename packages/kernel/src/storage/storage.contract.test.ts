// Runs the shared storage contract suite against every adapter (PS-119 09.R01).
import { IDBFactory } from 'fake-indexeddb';
import { storageContractSuite } from './contract-suite.ts';
import { openIndexedDbStorage } from './indexeddb.ts';
import { openSqliteStorage } from './sqlite.ts';
import { createMemoryStorage } from './storage.ts';

let n = 0;
storageContractSuite('memory', () => createMemoryStorage());
storageContractSuite('sqlite', () => openSqliteStorage({ path: ':memory:' }));
storageContractSuite('indexeddb', () => openIndexedDbStorage({ name: `vault-${++n}`, indexedDB: new IDBFactory() }));
