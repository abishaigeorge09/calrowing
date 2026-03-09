import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-[#1e3a5f] text-white hover:bg-[#162d4a] focus-visible:ring-[#1e3a5f]',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:     'border-2 border-[#1e3a5f] text-[#1e3a5f] bg-transparent hover:bg-blue-50',
        secondary:   'bg-slate-100 text-slate-900 hover:bg-slate-200',
        ghost:       'text-slate-700 hover:bg-slate-100',
        link:        'text-[#1e3a5f] underline-offset-4 hover:underline p-0 h-auto',
        accent:      'bg-orange-500 text-white hover:bg-orange-600',
        success:     'bg-green-600 text-white hover:bg-green-700',
        warning:     'bg-yellow-500 text-white hover:bg-yellow-600',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm:      'h-9 px-3 text-xs',
        lg:      'h-14 px-8 text-base',
        xl:      'h-16 px-10 text-lg',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
