import * as React from 'react'
import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string; description?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-[fade-in_200ms_var(--ease-out)]" />
      <D.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-line bg-panel p-6 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.6)] data-[state=open]:animate-[pop-in_220ms_var(--ease-out)]',
          className,
        )}
        {...props}
      >
        <D.Title className="font-display text-xl font-semibold tracking-[-0.02em]">{title}</D.Title>
        {description && <D.Description className="mt-1.5 text-sm text-sand">{description}</D.Description>}
        <div className="mt-5">{children}</div>
        <D.Close className="press absolute right-4 top-4 rounded-md p-1 text-dust hover:text-cream" aria-label="Close">
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  )
}
