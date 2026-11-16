import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

/** Centered spinner with a message, for whole-page or card loading. */
export const LoadingState: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading...', className = '' }) => (
  <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground ${className}`}>
    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
    <span className="text-sm">{label}</span>
  </div>
);

/** Skeleton rows to drop inside a <TableBody> while data loads. */
export const TableSkeletonRows: React.FC<{ cols: number; rows?: number }> = ({ cols, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <TableRow key={r} aria-hidden="true">
        {Array.from({ length: cols }).map((__, c) => (
          <TableCell key={c}><Skeleton className="h-4 w-full max-w-[160px]" /></TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

/** Generic page skeleton: title + stat cards + list. */
export const PageSkeleton: React.FC = () => (
  <div role="status" aria-label="Loading" className="space-y-6 p-4 md:p-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  </div>
);
