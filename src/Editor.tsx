import {ReactClient} from '@convex-dev/react';
import React, {useEffect, useRef} from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {QuillBinding} from 'y-quill';
import * as Y from 'yjs';
import convexConfig from '../convex.json';
import {ConvexProvider} from './ConvexProvider';

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
