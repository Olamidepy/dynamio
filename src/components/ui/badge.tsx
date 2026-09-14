import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'gold' | 'outline' | 'success' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-secondary text-secondary-foreground border border-border/40': variant === 'secondary',
          'bg-slate-100 text-slate-800 border border-slate-200': variant === 'default',
          'bg-amber-50 text-amber-800 border border-amber-300': variant === 'gold',
          'text-slate-700 border border-slate-200 bg-white': variant === 'outline',
          'bg-emerald-50 text-emerald-800 border border-emerald-300': variant === 'success',
          'bg-red-50 text-red-700 border border-red-200': variant === 'danger',
        },
        className
      )}
      {...props}
    />
  );
}
