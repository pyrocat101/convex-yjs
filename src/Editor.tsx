import {ReactClient} from '@convex-dev/react';
import _ from 'lodash-es';
import React, {useEffect, useRef} from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {QuillBinding} from 'y-quill';
import * as Y from 'yjs';
import convexConfig from '../convex.json';
import {SyncMessage} from './common';

const convex = new ReactClient(convexConfig.origin);

export default function Editor() {
    const ref = useRef<ReactQuill | null>(null);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const editor = ref.current.getEditor();
        const ydoc = new Y.Doc();
        const type = ydoc.getText('quill');

        const provider = new ConvexProvider(ydoc, convex);
        new QuillBinding(type, editor);

        return () => {
            provider.destroy();
        };
    }, []);

    return <ReactQuill ref={ref} theme="snow" defaultValue="" />;
}

class ConvexProvider {
    private _doc: Y.Doc;
    private _convex: ReactClient;
    private _unwatch: () => void;
    private _firstSync = true;
    private _messages: SyncMessage[];

    constructor(doc: Y.Doc, convex: ReactClient) {
        this._doc = doc;
        this._convex = convex;
        this._messages = [];
        this._unwatch = convex
            .query('readSyncMessages')
            .watch()
            .onUpdate(this._onReadSyncMessagesUpdate);
        doc.on('update', this._onDocUpdate);
    }

    destroy() {
        this._unwatch();
    }

    private _onDocUpdate = (update: Uint8Array, origin?: 'readSyncMessages' | 'peer') => {
        if (origin !== 'readSyncMessages' && origin !== 'peer') {
            this._convex.mutation('sync').call(_encodeArrayBuffer(update));
        }
    };

    private _onReadSyncMessagesUpdate = (messages: SyncMessage[]) => {
        if (this._firstSync) {
            this._messages = messages;
            Y.transact(
                this._doc,
                () => {
                    for (const message of messages) {
                        Y.applyUpdate(this._doc, new Uint8Array(message.value));
                    }
                },
                'readSyncMessages', // origin
            );
            this._firstSync = false;
        } else {
            // Apply only new messages
            const lastSyncMessageIndex = _.findLastIndex(
                messages,
                (message) => message._id === _.last(this._messages)?._id ?? null,
            );
            this._messages = messages;
            Y.transact(
                this._doc,
                () => {
                    for (let i = lastSyncMessageIndex + 1; i < messages.length; i++) {
                        const message = messages[i];
                        Y.applyUpdate(this._doc, new Uint8Array(message.value));
                    }
                },
                'peer', // origin
            );
        }
    };
}

/** Encode array buffer into a string so it can be sent over JSON. */
function _encodeArrayBuffer(buffer: ArrayBuffer): string {
    const u8array = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...u8array));
}