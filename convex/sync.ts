import {dbWriter} from '@convex-dev/server';
import base64 from 'base-64';

export default async function sync(encodedMessage: string): Promise<void> {
    const message = base64.decode(encodedMessage);
    const u8array = new Uint8Array(message.length);

    for (let i = 0; i < u8array.byteLength; i++) {
        u8array[i] = message.charCodeAt(i);
    }

    await dbWriter.insert('sync_messages_v2', {
        value: u8array.buffer,
    });
}
