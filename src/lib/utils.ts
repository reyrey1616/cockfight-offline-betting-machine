// shadcn/ui's canonical `cn` helper.
//
// Combines `clsx` (conditional class-name composition) with
// `tailwind-merge` (deduplicates conflicting Tailwind utilities, e.g.
// turns `px-2 px-4` into `px-4`). Used inside every shadcn component;
// importing it from `@/lib/utils` is the contract the components.json
// `aliases.utils` declares.
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
