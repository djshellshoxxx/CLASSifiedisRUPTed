import { archiveBackupCodec } from './archive-backup.ts';
import { publicationBackupCodec } from './publication-backup.ts';
import { retainedBackupCodec } from './retained-backup.ts';
import { barterCodecs } from './barter-runtime.ts';
import { localNotificationBackupCodecs } from '../../../packages/notify/src/index.ts';
import { locationBackupCodecs } from '../../../packages/discovery/src/index.ts';
import { backupCodec, type BackupCodec } from '../../../packages/vault/src/index.ts';
import { inventoryHoldRepo, listingRepo, listingRevisionId, listingRevisionRepo, validateListingRevision } from '../../../packages/bazaar/src/index.ts';

/** Shared production PWA registry for create, unlock, restore and recovery acceptance. */
export const productionBackupCodecs: readonly BackupCodec[] = [
  ...locationBackupCodecs(backupCodec),
  ...localNotificationBackupCodecs(backupCodec),
  ...barterCodecs,
  archiveBackupCodec,
  {
    ...backupCodec(listingRevisionRepo),
    recordId(input: unknown) {
      const row = listingRevisionRepo.schema.parse(input);
      return listingRevisionId(row.listingId, row.revisionNo);
    },
    validate: validateListingRevision,
    async restoreData(input: unknown, principal: string) {
      const row = listingRevisionRepo.schema.parse(input);
      if (row.ownerId !== principal) throw new Error('Backup history belongs to another principal');
      return row;
    },
  },
  {
    ...backupCodec(listingRepo),
    async restoreData(input: unknown, principal: string) {
      const data = listingRepo.schema.parse(input);
      if (data.ownerId !== principal) throw new Error('Backup listing belongs to another principal');
      return data;
    },
  },
  publicationBackupCodec,
  {
    ...backupCodec(inventoryHoldRepo),
    async restoreData(input: unknown, principal: string) {
      const data = inventoryHoldRepo.schema.parse(input);
      if (data.ownerId !== principal) throw new Error('Backup reservation belongs to another principal');
      return data;
    },
  },
  retainedBackupCodec,
];
