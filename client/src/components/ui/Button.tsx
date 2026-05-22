// components/ui/Button.tsx
'use client';
import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
 
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive';
 
interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}
 
const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};
 
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-cipher-blue text-white hover:bg-cipher-glow shadow-lg shadow-cipher-blue/20',
  secondary: 'bg-glass-bg border border-glass-border text-ghost-200 hover:bg-white/5',
  ghost: 'text-ghost-300 hover:text-ghost-100 hover:bg-white/5',
  danger: 'bg-danger-rose text-white hover:bg-rose-600',
  destructive: 'bg-gradient-to-r from-burn-amber to-orange-600 text-white',
};
 
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'relative rounded-lg font-medium transition-colors duration-200 focus-visible:outline-2',
          'focus-visible:outline-offset-2 focus-visible:outline-cipher-blue',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeStyles[size || 'md'],
          variantStyles[variant],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <motion.span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
