import {Id} from '@convex-dev/server';

export type SyncMessage = {
    _id: Id;
    value: ArrayBuffer;
};
