'use client';

import 'quill/dist/quill.snow.css';

type RichHtmlProps = {
  html: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
};

export function RichHtml({ html, dir = 'ltr', className = '' }: RichHtmlProps) {
  if (!html?.trim()) {
    return <p className="text-sm text-slate-400">—</p>;
  }

  return (
    <div dir={dir} className={`ql-snow ${className}`}>
      <div className="ql-editor !border-0 !p-0" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
