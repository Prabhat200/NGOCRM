import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { AcceptInvitePage } from '@/features/auth/pages/AcceptInvitePage'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'
import { ProfilePage } from '@/features/auth/pages/ProfilePage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage'
import { UploadDocumentPage } from '@/features/documents/pages/UploadDocumentPage'
import { DocumentDetailPage } from '@/features/documents/pages/DocumentDetailPage'
import { OccasionsPage } from '@/features/occasions/pages/OccasionsPage'
import { CreateOccasionPage } from '@/features/occasions/pages/CreateOccasionPage'
import { OccasionDetailPage } from '@/features/occasions/pages/OccasionDetailPage'
import { MembersPage } from '@/features/members/pages/MembersPage'
import { CreateMemberPage } from '@/features/members/pages/CreateMemberPage'
import { MemberDetailPage } from '@/features/members/pages/MemberDetailPage'
import { GroupsPage } from '@/features/groups/pages/GroupsPage'
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage'
import { ActivityPage } from '@/features/activity/pages/ActivityPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { SettingsLayout } from '@/features/settings/components/SettingsLayout'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { OrganizationSettingsPage } from '@/features/settings/pages/OrganizationSettingsPage'
import { CategoriesSettingsPage } from '@/features/settings/pages/CategoriesSettingsPage'
import { OccasionTypesSettingsPage } from '@/features/settings/pages/OccasionTypesSettingsPage'
import { RolesSettingsPage } from '@/features/settings/pages/RolesSettingsPage'
import { GroupsSettingsPage } from '@/features/settings/pages/GroupsSettingsPage'
import { SecuritySettingsPage } from '@/features/settings/pages/SecuritySettingsPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'

export const router = createBrowserRouter([
  // Public authentication routes (guarded to redirect authenticated active users)
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/auth/accept-invite',
    element: <AcceptInvitePage />,
  },
  {
    path: '/change-password',
    element: (
      <ProtectedRoute>
        <ChangePasswordPage />
      </ProtectedRoute>
    ),
  },

  // Authenticated Application Shell routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // Documents
      {
        path: 'documents',
        element: (
          <ProtectedRoute requiredPermission="documents.view">
            <DocumentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'documents/new',
        element: (
          <ProtectedRoute requiredPermission="documents.create">
            <UploadDocumentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'documents/:documentId',
        element: (
          <ProtectedRoute requiredPermission="documents.view">
            <DocumentDetailPage />
          </ProtectedRoute>
        ),
      },
      // Occasions
      {
        path: 'occasions',
        element: (
          <ProtectedRoute requiredPermission="occasions.view">
            <OccasionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'occasions/new',
        element: (
          <ProtectedRoute requiredPermission="occasions.create">
            <CreateOccasionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'occasions/:occasionId',
        element: (
          <ProtectedRoute requiredPermission="occasions.view">
            <OccasionDetailPage />
          </ProtectedRoute>
        ),
      },
      // Members
      {
        path: 'members',
        element: (
          <ProtectedRoute requiredPermission="members.view">
            <MembersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'members/new',
        element: (
          <ProtectedRoute requiredPermission="members.create">
            <CreateMemberPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'members/:memberId',
        element: (
          <ProtectedRoute requiredPermission="members.view">
            <MemberDetailPage />
          </ProtectedRoute>
        ),
      },
      // Groups
      {
        path: 'groups',
        element: (
          <ProtectedRoute requiredPermission="groups.view">
            <GroupsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'groups/:groupId',
        element: (
          <ProtectedRoute requiredPermission="groups.view">
            <GroupDetailPage />
          </ProtectedRoute>
        ),
      },
      // Activity / Audit (requires audit.view)
      {
        path: 'activity',
        element: (
          <ProtectedRoute requiredPermission="audit.view">
            <ActivityPage />
          </ProtectedRoute>
        ),
      },
      // Notifications
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      // Self-Profile (functional)
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      // Settings (requires settings.view)
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredPermission="settings.view">
            <SettingsLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <SettingsPage />,
          },
          {
            path: 'organization',
            element: <OrganizationSettingsPage />,
          },
          {
            path: 'categories',
            element: <CategoriesSettingsPage />,
          },
          {
            path: 'occasion-types',
            element: <OccasionTypesSettingsPage />,
          },
          {
            path: 'roles',
            element: <RolesSettingsPage />,
          },
          {
            path: 'groups',
            element: <GroupsSettingsPage />,
          },
          {
            path: 'security',
            element: <SecuritySettingsPage />,
          },
        ],
      },
      // Catch-all inside Shell
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  // Global catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
