'use client';

import dynamic from 'next/dynamic';
import { useMemo, type CSSProperties } from 'react';
import 'quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const toolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link'],
  ['clean'],
];

type QuillEditorProps = {
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
  minHeight?: string;
};

export function QuillEditor({
  value,
  onChange,
  dir = 'ltr',
  placeholder,
  minHeight = '200px',
}: QuillEditorProps) {
  const modules = useMemo(() => ({ toolbar }), []);

  return (
    <div
      dir={dir}
      className="quill-editor-wrap rounded-lg border border-slate-200 bg-white"
      style={{ '--quill-min-height': minHeight } as CSSProperties}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="legal-quill"
      />
    </div>
  );
}
