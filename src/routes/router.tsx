// Router definition.
//
// Tree:
//   /login                                 (public)
//   /  ─►  ProtectedRoute
//         /display                         (arena live board — fullscreen; minimize → nav)
//         /kiosk                           (teller full-viewport betting kiosk; outside AppLayout)
//         └► AppLayout
//              /home
//              /payout-machine            (teller + admin — scan winning tickets)
//              /live-board                (legacy URL → /kiosk)
//              /dashboard                 (admin dashboard)
//              /operate-fights            (admin Operate fights)
//              /admin/*                   (RoleGate ADMIN)
//   *                                      (404)
//
// Page components live under `src/pages/<PageName>/index.tsx`.
// This file only wires layout + guards + URLs.
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { CollectorsPage } from '@/pages/CollectorsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DisplayPage } from '@/pages/DisplayPage'
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
        element: (
          <RequireRole allow={['ADMIN', 'TELLER']}>
            <DisplayPage />
          </RequireRole>
        )
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
          { path: 'real-time-odds', element: <Navigate to="/operate-fights" replace /> },
          {
            path: 'operate-fights',
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
              { index: true, element: <Navigate to="/admin/tellers" replace /> },
              { path: 'users', element: <Navigate to="/admin/tellers" replace /> },
              { path: 'tellers', element: <UsersPage /> },
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
