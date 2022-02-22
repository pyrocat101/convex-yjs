import {db} from '@convex-dev/server';
import {SyncMessage} from '../src/common';

export default async function readSyncMessages(): Promise<SyncMessage[]> {
    return await db.table('sync_messages_v2').collect();
}
