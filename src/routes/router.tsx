// Router definition.
//
// Tree:
//   /login                                 (public)
//   /  ─►  ProtectedRoute
//         /display                         (fullscreen fight board — read-only; not in nav)
//         /kiosk                           (teller full-viewport betting kiosk; outside AppLayout)
//         └► AppLayout
//              /home
//              /payout-machine            (teller + admin — scan winning tickets)
//              /live-board                (legacy URL → /kiosk)
//              /dashboard                 (admin Reports)
//              /real-time-odds            (admin Operate fights)
//              /admin/*                   (RoleGate ADMIN)
//   *                                      (404)
//
// Page components live under `src/pages/<PageName>/index.tsx`.
// This file only wires layout + guards + URLs.
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { CollectorsPage } from '@/pages/CollectorsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FightBoardPage } from '@/pages/FightBoardPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PayoutMachinePage } from '@/pages/PayoutMachinePage'
import { RealTimeOddsPage } from '@/pages/RealTimeOddsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TellerLiveBoardPage } from '@/pages/TellerLiveBoardPage'
import { UsersPage } from '@/pages/UsersPage'
import { AppLayout } from '@/routes/AppLayout'
import { AuthedIndexRedirect } from '@/routes/AuthedIndexRedirect'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RequireRole } from '@/routes/RequireRole'
import { RoleGate } from '@/routes/RoleGate'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: 'display',
        element: <FightBoardPage mode="display" layout="fullscreen" />
      },
      {
        path: 'kiosk',
        element: (
          <RequireRole allow={['TELLER']}>
            <TellerLiveBoardPage />
          </RequireRole>
        )
      },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <AuthedIndexRedirect /> },
          { path: 'home', element: <HomePage /> },
          {
            path: 'payout-machine',
            element: (
              <RequireRole allow={['TELLER', 'ADMIN']}>
                <PayoutMachinePage />
              </RequireRole>
            )
          },
          { path: 'live-board', element: <Navigate to="/kiosk" replace /> },
          {
            path: 'dashboard',
            element: (
              <RequireRole allow={['ADMIN']}>
                <DashboardPage />
              </RequireRole>
            )
          },
          {
            path: 'real-time-odds',
            element: (
              <RequireRole allow={['ADMIN']}>
                <RealTimeOddsPage />
              </RequireRole>
            )
          },
          {
            path: 'admin',
            element: <RoleGate allow={['ADMIN']} />,
            children: [
              { index: true, element: <Navigate to="/admin/users" replace /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'collectors', element: <CollectorsPage /> },
              { path: 'settings', element: <SettingsPage /> }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
])
