import { EVENT, EVENTS } from '@/lib/event'
import { cn } from '@/lib/utils'

/** Switch between the Cabin Cup and the Thanksgiving Trailer. `page` is '' (rules), '/host' or '/show'. */
export function EventTabs({ page = '', className }: { page?: '' | '/host'; className?: string }) {
  return (
    <nav aria-label="Game night" className={cn('inline-flex rounded-[10px] border border-line bg-ink p-1', className)}>
      {EVENTS.map((e) => (
        <a
          key={e.id}
          href={`${e.base}${page}` || '/'}
          aria-current={e.id === EVENT ? 'page' : undefined}
          className={cn(
            'press flex h-8 items-center whitespace-nowrap rounded-[7px] px-3 text-[13px] font-medium',
            e.id === EVENT ? 'bg-cream text-night' : 'text-sand hover:text-cream',
          )}
        >
          {e.label}
        </a>
      ))}
    </nav>
  )
}
