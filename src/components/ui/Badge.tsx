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
      default: 'bg-[#F8F6F2] text-[#5C5550] border border-[#D4725A]/10',
      primary: 'bg-gradient-to-br from-[#FBDDD0] to-[#FDEEE7] text-[#A8472F] border border-[#D4725A]/20',
      success: 'bg-gradient-to-br from-[#D4DCC9] to-[#E8ECE4] text-[#58604E] border border-[#8B9A7C]/20',
      warning: 'bg-gradient-to-br from-[#FAECC4] to-[#FDF5E1] text-[#8C6626] border border-[#E8B863]/20',
      danger: 'bg-gradient-to-br from-red-100 to-red-50 text-red-700 border border-red-200',
      outline: 'border border-[#D4725A]/30 text-[#5C5550] bg-white/50 backdrop-blur-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1',
      md: 'text-sm px-4 py-1.5 font-medium',
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
