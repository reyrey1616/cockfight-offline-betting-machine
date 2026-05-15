// App entry point.
//
// Provider order (outermost first):
//   StrictMode               — double-invoke effects in dev, helps
//                              surface subtle bugs.
//   AppProviders             — TanStack Query + devtools; see `@/contexts`.
//   RouterProvider           — React Router data router. Inside it we
//                              get useLocation, useNavigate, <Outlet />.
//
// Auth is Zustand (`@/store/auth`), not a React context tree.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import './index.css'

import { AppProviders } from '@/contexts'
import { router } from '@/routes/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)
