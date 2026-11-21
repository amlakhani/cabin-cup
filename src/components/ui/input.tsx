import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-[10px] border border-line bg-ink px-3 text-sm text-cream placeholder:text-dust/80 outline-none transition-[border-color,box-shadow] duration-150 focus:border-line-strong focus:ring-2 focus:ring-cream/10',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-[10px] border border-line bg-ink px-3 py-2.5 text-sm leading-relaxed text-cream placeholder:text-dust/80 outline-none transition-[border-color,box-shadow] duration-150 focus:border-line-strong focus:ring-2 focus:ring-cream/10',
        className,
      )}
      {...props}
    />
  )
}
