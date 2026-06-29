'use client';

import { resolveMediaUrl } from '@/lib/media-url';

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-20 w-20 text-2xl',
  lg: 'h-24 w-24 text-3xl',
} as const;

export function UserAvatar({
  src,
  name,
  size = 'md',
  cacheBust,
  className = '',
}: {
  src?: string | null;
  name?: string;
  size?: keyof typeof sizeClasses;
  cacheBust?: string | number;
  className?: string;
}) {
  const resolved = resolveMediaUrl(src, { cacheBust });
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200',
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-slate-400" aria-hidden>
          {initial}
        </span>
      )}
    </div>
  );
}
