import { useState, useEffect } from 'react'
import { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { GOOGLE_CLIENT_ID } from './config/env'
import { UserModeProvider } from './context/UserModeContext'
import { AvailabilityProvider } from './context/AvailabilityContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'
import { CancellationProvider } from './context/CancellationContext'
import { OnboardingProvider } from './context/OnboardingContext'
import { PWAInstallProvider } from './context/PWAInstallContext'
import ColdStartLoading from './components/ColdStartLoading'
import { API_BASE_URL } from './config/env'
import ErrorBoundary from './components/ErrorBoundary'
import PublicLayout from './components/layout/PublicLayout'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ModeProtectedRoute from './components/ModeProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/layout/AdminLayout'
import PageLoader from './components/PageLoader'
import { lazyWithRetry } from './utils/lazyWithRetry'

// Lazy load page components for code splitting with retry logic
const Home = lazyWithRetry(() => import('./pages/public/Home'))
const Login = lazyWithRetry(() => import('./pages/public/Login'))
const Register = lazyWithRetry(() => import('./pages/public/Register'))
const Terms = lazyWithRetry(() => import('./pages/public/Terms'))
const Privacy = lazyWithRetry(() => import('./pages/public/Privacy'))
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'))
const Tasks = lazyWithRetry(() => import('./pages/Tasks'))
const TaskDetail = lazyWithRetry(() => import('./pages/TaskDetail'))
const PostTask = lazyWithRetry(() => import('./pages/PostTask'))
const Profile = lazyWithRetry(() => import('./pages/Profile'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))
const SettingsProfile = lazyWithRetry(() => import('./pages/settings/SettingsProfile'))
const SettingsPreferences = lazyWithRetry(() => import('./pages/settings/SettingsPreferences'))
const SettingsAvailability = lazyWithRetry(() => import('./pages/settings/SettingsAvailability'))
const SettingsDataExport = lazyWithRetry(() => import('./pages/settings/SettingsDataExport'))
const SettingsNotifications = lazyWithRetry(() => import('./pages/settings/SettingsNotifications'))
const SettingsAccount = lazyWithRetry(() => import('./pages/settings/SettingsAccount'))
const Activity = lazyWithRetry(() => import('./pages/Activity'))
const Earnings = lazyWithRetry(() => import('./pages/Earnings'))
const Transactions = lazyWithRetry(() => import('./pages/Transactions'))
const AdminOverview = lazyWithRetry(() => import('./pages/admin/AdminOverview'))
const AdminUsers = lazyWithRetry(() => import('./pages/admin/AdminUsers'))
const AdminUserDetail = lazyWithRetry(() => import('./pages/admin/AdminUserDetail'))
const AdminTasks = lazyWithRetry(() => import('./pages/admin/AdminTasks'))
const AdminTaskDetail = lazyWithRetry(() => import('./pages/admin/AdminTaskDetail'))
const AdminReports = lazyWithRetry(() => import('./pages/admin/AdminReports'))
const AdminWorkers = lazyWithRetry(() => import('./pages/admin/AdminWorkers'))
const AdminChats = lazyWithRetry(() => import('./pages/admin/AdminChats'))
const AdminSettings = lazyWithRetry(() => import('./pages/admin/AdminSettings'))
const AdminReviews = lazyWithRetry(() => import('./pages/admin/AdminReviews'))
const AdminLogs = lazyWithRetry(() => import('./pages/admin/AdminLogs'))
const AdminAnalytics = lazyWithRetry(() => import('./pages/admin/AdminAnalytics'))
const AdminTickets = lazyWithRetry(() => import('./pages/admin/AdminTickets'))
const AdminTicketDetail = lazyWithRetry(() => import('./pages/admin/AdminTicketDetail'))
const AdminFeedback = lazyWithRetry(() => import('./pages/admin/AdminFeedback'))
const PilotDashboard = lazyWithRetry(() => import('./pages/admin/PilotDashboard'))
const SetupProfile = lazyWithRetry(() => import('./pages/SetupProfile'))
const Support = lazyWithRetry(() => import('./pages/Support'))
const SupportTicketDetail = lazyWithRetry(() => import('./pages/SupportTicketDetail'))

const HomeOrRedirect = () => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Home />
}

const AppContent = () => (
  <>
    <AuthProvider>
      <UserModeProvider>
        <OnboardingProvider>
          <PWAInstallProvider>
            <AvailabilityProvider>
              <NotificationProvider>
                <CancellationProvider>
                  <SocketProvider>
                    <Router
                      future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                      }}
                    >
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            {/* Public routes: no login required. Home, how it works, FAQs, terms, privacy. No real task data. */}
                            <Route
                              path="/"
                              element={
                                <PublicLayout>
                                  <HomeOrRedirect />
                                </PublicLayout>
                              }
                            />
                            <Route
                              path="/login"
                              element={
                                <PublicLayout>
                                  <Login />
                                </PublicLayout>
                              }
                            />
                            <Route
                              path="/register"
                              element={
                                <PublicLayout>
                                  <Register />
                                </PublicLayout>
                              }
                            />
                            <Route
                              path="/terms"
                              element={
                                <PublicLayout>
                                  <Terms />
                                </PublicLayout>
                              }
                            />
                            <Route
                              path="/privacy"
                              element={
                                <PublicLayout>
                                  <Privacy />
                                </PublicLayout>
                              }
                            />

                            {/* Setup profile (after Google sign-in) - protected, no MainLayout */}
                            <Route
                              path="/setup-profile"
                              element={
                                <ProtectedRoute>
                                  <SetupProfile />
                                </ProtectedRoute>
                              }
                            />

                            {/* App routes: guests can view everything; login CTA shown inside each page. */}
                            <Route element={<AppLayout />}>
                              <Route path="/dashboard" element={<Dashboard />} />
                              {/* Worker intent: /tasks and /tasks/:id show "Login to view tasks near you" when unauthenticated */}
                              <Route
                                path="/tasks"
                                element={
                                  <ModeProtectedRoute allowedMode="worker">
                                    <Tasks />
                                  </ModeProtectedRoute>
                                }
                              />
                              <Route path="/tasks/:id" element={<TaskDetail />} />
                              {/* Poster intent: /post-task (any step) shows "Login to post a task and track its progress" when unauthenticated */}
                              <Route
                                path="/post-task"
                                element={
                                  <ModeProtectedRoute allowedMode="poster">
                                    <PostTask />
                                  </ModeProtectedRoute>
                                }
                              />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/support" element={<Support />} />
                              <Route path="/support/:ticketId" element={<SupportTicketDetail />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/settings/profile" element={<SettingsProfile />} />
                              <Route path="/settings/preferences" element={<ModeProtectedRoute allowedMode="worker"><SettingsPreferences /></ModeProtectedRoute>} />
                              <Route path="/settings/availability" element={<ModeProtectedRoute allowedMode="worker"><SettingsAvailability /></ModeProtectedRoute>} />
                              <Route path="/settings/data-export" element={<SettingsDataExport />} />
                              <Route path="/settings/notifications" element={<SettingsNotifications />} />
                              <Route path="/settings/account" element={<SettingsAccount />} />
                              <Route path="/activity" element={<Activity />} />
                              <Route
                                path="/earnings"
                                element={
                                  <ModeProtectedRoute allowedMode="worker">
                                    <Earnings />
                                  </ModeProtectedRoute>
                                }
                              />
                              <Route
                                path="/transactions"
                                element={
                                  <ModeProtectedRoute allowedMode="poster">
                                    <Transactions />
                                  </ModeProtectedRoute>
                                }
                              />
                            </Route>

                            {/* Admin Routes */}
                            <Route
                              element={
                                <AdminRoute>
                                  <AdminLayout />
                                </AdminRoute>
                              }
                            >
                              <Route path="/admin" element={<AdminOverview />} />
                              <Route path="/admin/users" element={<AdminUsers />} />
                              <Route path="/admin/workers" element={<AdminWorkers />} />
                              <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
                              <Route path="/admin/tasks" element={<AdminTasks />} />
                              <Route path="/admin/tasks/:taskId" element={<AdminTaskDetail />} />
                              <Route path="/admin/chats" element={<AdminChats />} />
                              <Route path="/admin/settings" element={<AdminSettings />} />
                              <Route path="/admin/reviews" element={<AdminReviews />} />
                              <Route path="/admin/feedback" element={<AdminFeedback />} />
                              <Route path="/admin/pilot-dashboard" element={<PilotDashboard />} />
                              <Route path="/admin/logs" element={<AdminLogs />} />
                              <Route path="/admin/analytics" element={<AdminAnalytics />} />
                              <Route path="/admin/reports" element={<AdminReports />} />
                              <Route path="/admin/tickets" element={<AdminTickets />} />
                              <Route path="/admin/tickets/:ticketId" element={<AdminTicketDetail />} />
                            </Route>
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </Router>
                  </SocketProvider>
                </CancellationProvider>
              </NotificationProvider>
            </AvailabilityProvider>
          </PWAInstallProvider>
        </OnboardingProvider>
      </UserModeProvider>
    </AuthProvider>
  </>
)

function App() {
  // Cold start flow (McFleet-style): one quick check after 500ms; only if it fails show loading and poll
  const [showColdStart, setShowColdStart] = useState(true)
  const [isBackendReady, setIsBackendReady] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV || localStorage.getItem('skipColdStartCheck') === 'true') {
      setShowColdStart(false)
      setIsBackendReady(true)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'omit'
        })
        if (res.ok) {
          setShowColdStart(false)
          setIsBackendReady(true)
        }
      } catch {
        // Leave showColdStart true, isBackendReady false → ColdStartLoading will show and poll
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleBackendReady = () => {
    setTimeout(() => {
      setShowColdStart(false)
      setIsBackendReady(true)
    }, 500)
  }

  if (showColdStart && !isBackendReady) {
    return (
      <ThemeProvider>
        <ColdStartLoading onReady={handleBackendReady} />
      </ThemeProvider>
    )
  }

  const content = (
    <ThemeProvider>
      <ErrorBoundary>
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AppContent />
          </GoogleOAuthProvider>
        ) : (
          <AppContent />
        )}
      </ErrorBoundary>
    </ThemeProvider>
  )
  return content
}

export default App

