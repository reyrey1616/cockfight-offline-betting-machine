// Teller / shared dashboard placeholder. Replaced once we build the real
// teller board and admin home. For now it confirms login worked end-to-end.
import { useAuthUser } from '@/store/auth'

export function HomePage() {
  const user = useAuthUser()
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome{user ? `, ${user.fullName}` : ''}.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You are signed in as{' '}
        <span className="font-medium text-foreground">{user?.role}</span>. The
        real dashboard for your role is coming up next.
      </p>
    </div>
  )
}
