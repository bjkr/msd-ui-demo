import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap',
    'rounded-lg',
    'cursor-pointer',
    'text-sm font-medium',
    'transition-all',
    'outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    'focus-visible:border-black focus-visible:ring-black/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
  ),
  {
    variants: {
      variant: {
        brand: cn(
          'bg-msd-fill-brand-enabled hover:bg-msd-fill-brand-hovered',
          'text-white shadow-xs'
        ),
        primary: cn(
          'bg-msd-fill-primary-enabled hover:bg-msd-fill-primary-enabled/60',
          'text-msd-text-on-fill-primary-enabled'
        ),
        secondary: cn(
          'bg-msd-fill-secondary-enabled hover:bg-msd-fill-secondary-hovered',
          'text-msd-text-on-fill-secondary-enabled',
          'border-2 dark:border-white'
        ),
        tertiary: cn(
          'hover:bg-neutral-200 hover:text-accent-foreground dark:hover:bg-accent/50'
        ),
        link: cn('text-primary underline-offset-4 hover:underline'),
      },
      size: {
        md: cn(
          'h-12 px-5 py-3'
          // 'has-[>svg]:px-4'
        ),
        sm: cn(
          'h-8 rounded-md gap-1.5 px-3'
          // 'has-[>svg]:px-2.5'
        ),
        icon: cn('size-9'),
        iconSm: cn('size-8'),
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
