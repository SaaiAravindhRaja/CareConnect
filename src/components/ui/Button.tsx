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
      'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]';

    const variants = {
      primary:
        'bg-gradient-to-br from-[#D4725A] via-[#C85A44] to-[#A8472F] text-white hover:shadow-[0_12px_28px_-8px_rgba(212,114,90,0.4),0_6px_12px_-6px_rgba(212,114,90,0.3)] focus:ring-[#D4725A] shadow-[0_6px_16px_-6px_rgba(212,114,90,0.25)] hover:from-[#E8936D] hover:via-[#D4725A] hover:to-[#C85A44]',
      secondary:
        'bg-gradient-to-br from-[#8B9A7C] to-[#6F7D63] text-white hover:shadow-[0_12px_28px_-8px_rgba(139,154,124,0.4)] focus:ring-[#8B9A7C] shadow-[0_4px_12px_-4px_rgba(139,154,124,0.25)] hover:from-[#A8B89C] hover:to-[#8B9A7C]',
      outline:
        'border-2 border-[#D4725A]/30 text-[#5C5550] hover:border-[#D4725A] hover:bg-[#FEF8F5] hover:text-[#C85A44] focus:ring-[#D4725A] backdrop-blur-sm',
      ghost:
        'text-[#5C5550] hover:bg-[#F8F6F2] hover:text-[#D4725A] focus:ring-[#D4725A]/30',
      danger:
        'bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-[0_12px_28px_-8px_rgba(239,68,68,0.4)] focus:ring-red-500 shadow-[0_4px_12px_-4px_rgba(239,68,68,0.25)]',
    };

    const sizes = {
      sm: 'text-sm px-4 py-2',
      md: 'text-sm px-6 py-3',
      lg: 'text-base px-8 py-4',
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
