import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses[variant], className)}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

export function CardSkeleton({ padding = 'md' }: { padding?: 'sm' | 'md' | 'lg' }) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200', paddingClasses[padding])}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width={60} height={24} />
          <Skeleton variant="text" width={80} height={12} />
        </div>
      </div>
    </div>
  );
}

export function InteractionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="text" width={32} height={32} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width={20} height={20} />
          </div>
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
          <div className="flex gap-2 mt-3">
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={60} height={24} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuggestionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-3">
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <Skeleton variant="text" width="90%" height={20} className="mb-2" />
      <Skeleton variant="text" width="100%" className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width="100%" height={36} />
        <Skeleton variant="rectangular" width={40} height={36} />
      </div>
    </div>
  );
}
