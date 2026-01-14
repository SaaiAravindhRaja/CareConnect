import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', removable, onRemove, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#e8e8ed] text-[#1d1d1f]',
      primary: 'bg-[#0071e3]/10 text-[#0071e3]',
      success: 'bg-[#34c759]/10 text-[#248a3d]',
      warning: 'bg-[#ff9500]/10 text-[#bd6e00]',
      danger: 'bg-[#ff3b30]/10 text-[#c92a1f]',
      outline: 'border border-[#d2d2d7] text-[#86868b] bg-transparent',
    };

    const sizes = {
      sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md',
      md: 'text-[13px] px-2.5 py-1 font-medium rounded-md',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all duration-300',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1.5 -mr-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
