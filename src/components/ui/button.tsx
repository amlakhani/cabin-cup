import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium select-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-cream text-night hover:bg-white',
        secondary: 'bg-raised text-cream border border-line hover:bg-hover hover:border-line-strong',
        ghost: 'text-sand hover:text-cream hover:bg-raised',
        danger: 'bg-bad/12 text-bad border border-bad/30 hover:bg-bad/20',
        outline: 'border border-line-strong text-cream hover:bg-raised',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-[15px]',
        xl: 'h-16 px-6 text-lg',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
