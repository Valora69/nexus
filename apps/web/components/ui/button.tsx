import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@web/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-background shadow-glow hover:shadow-lift',
        primary:
          'bg-accent text-background shadow-glow hover:shadow-lift',
        secondary:
          'glass text-foreground hover:bg-[var(--color-card-hover)] hover:border-border-strong',
        ghost:
          'text-muted hover:bg-[var(--color-card)] hover:text-foreground hover:backdrop-blur-xl',
        outline:
          'border border-border bg-transparent text-foreground hover:border-border-strong hover:bg-[var(--color-card)]',
        danger:
          'border border-[rgb(var(--color-loss)/0.3)] bg-[rgb(var(--color-loss)/0.15)] text-loss hover:bg-[rgb(var(--color-loss)/0.25)]',
        destructive:
          'border border-[rgb(var(--color-loss)/0.3)] bg-[rgb(var(--color-loss)/0.15)] text-loss hover:bg-[rgb(var(--color-loss)/0.25)]',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 text-sm',
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export const buttonClasses = (
  opts: Parameters<typeof buttonVariants>[0] = undefined,
) => buttonVariants(opts);

export { Button, buttonVariants };
