import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white/80 backdrop-blur-sm border border-[#D4725A]/10 shadow-[0_4px_16px_-4px_rgba(93,50,30,0.08)]',
      elevated: 'bg-white/90 backdrop-blur-md shadow-[0_8px_32px_-8px_rgba(93,50,30,0.12),0_4px_16px_-4px_rgba(93,50,30,0.06)] border border-[#F8F6F2]',
      outline: 'bg-transparent backdrop-blur-sm border-2 border-[#D4725A]/20 hover:border-[#D4725A]/40',
      gradient: 'bg-gradient-to-br from-[#FDEEE7] via-[#FEF8F5] to-[#FDF5E1] border border-[#D4725A]/10 shadow-[0_6px_24px_-6px_rgba(212,114,90,0.15)]',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl transition-all duration-500 ease-out',
          variants[variant],
          paddings[padding],
          hover && 'hover:shadow-[0_20px_60px_-12px_rgba(93,50,30,0.2)] hover:-translate-y-2 hover:scale-[1.01] cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold text-[#2D312A] tracking-tight', className)} {...props} />
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-[#5C5550]/70 mt-2 leading-relaxed', className)} {...props} />
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-6 pt-6 border-t border-[#D4725A]/10', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';
