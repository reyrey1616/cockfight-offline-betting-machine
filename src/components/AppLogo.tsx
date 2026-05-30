import fmjLogo from '@/assets/fmj-logo.png'
import { BRANDING } from '@/constants'
import { cn } from '@/lib/utils'

export interface AppLogoProps {
  className?: string
  /** `header` — top bar; `login` — sign-in card; `board` — live board center */
  size?: 'header' | 'login' | 'board'
}

const sizeClass: Record<NonNullable<AppLogoProps['size']>, string> = {
  header: 'h-8 max-w-[180px]',
  login: 'h-14 max-w-[220px]',
  board: 'h-16 max-w-[300px] lg:h-[4.5rem] lg:max-w-[360px]'
}

export function AppLogo({ className, size = 'header' }: AppLogoProps) {
  return (
    <img
      src={fmjLogo}
      alt={BRANDING.LOGO_ALT}
      className={cn(
        'w-auto shrink-0 object-contain',
        size === 'board' ? 'object-center' : 'object-left',
        sizeClass[size],
        className
      )}
    />
  )
}
