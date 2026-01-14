import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-[#0071e3] text-white hover:bg-[#0077ed] focus:ring-[#0071e3] shadow-sm',
      secondary:
        'bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#d2d2d7] focus:ring-[#86868b]',
      outline:
        'border border-[#d2d2d7] text-[#0071e3] hover:border-[#0071e3] hover:bg-transparent focus:ring-[#0071e3] bg-transparent',
      ghost:
        'text-[#0071e3] hover:bg-[#e8e8ed]/50 hover:text-[#0077ed] focus:ring-[#0071e3]/30',
      danger:
        'bg-[#ff3b30] text-white hover:bg-[#ff453a] focus:ring-[#ff3b30] shadow-sm',
    };

    const sizes = {
      sm: 'text-[12px] px-3 py-1.5',
      md: 'text-[14px] px-5 py-2.5',
      lg: 'text-[17px] px-7 py-3.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
