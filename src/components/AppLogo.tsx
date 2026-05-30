import fmjLogo from '@/assets/fmj-logo.png'
import { BRANDING } from '@/constants'
import { cn } from '@/lib/utils'

export interface AppLogoProps {
  className?: string
  /** `header` — top bar; `login` — sign-in card */
  size?: 'header' | 'login'
}

export function AppLogo({ className, size = 'header' }: AppLogoProps) {
  return (
    <img
      src={fmjLogo}
      alt={BRANDING.LOGO_ALT}
      className={cn(
        'w-auto shrink-0 object-contain object-left',
        size === 'login' ? 'h-14 max-w-[220px]' : 'h-8 max-w-[180px]',
        className
      )}
    />
  )
}
