import * as React from 'react';
import { cn } from '../../lib/utils';

export function Progress({
  value = 0,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/80', className)}
      {...props}
    >
      <div
        className="h-full bg-[#00875a] transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
