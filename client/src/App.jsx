import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { UserModeProvider } from './context/UserModeContext'
import { AvailabilityProvider } from './context/AvailabilityContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'
import { CancellationProvider } from './context/CancellationContext'
import ColdStartChecker from './components/ColdStartChecker'
import PublicLayout from './components/layout/PublicLayout'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ModeProtectedRoute from './components/ModeProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/layout/AdminLayout'

// Lazy load page components for code splitting
const Home = lazy(() => import('./pages/public/Home'))
const Login = lazy(() => import('./pages/public/Login'))
const Register = lazy(() => import('./pages/public/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Tasks = lazy(() => import('./pages/Tasks'))
const TaskDetail = lazy(() => import('./pages/TaskDetail'))
const PostTask = lazy(() => import('./pages/PostTask'))
const Profile = lazy(() => import('./pages/Profile'))
const Activity = lazy(() => import('./pages/Activity'))
const Earnings = lazy(() => import('./pages/Earnings'))
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'))
const AdminTasks = lazy(() => import('./pages/admin/AdminTasks'))
const AdminTaskDetail = lazy(() => import('./pages/admin/AdminTaskDetail'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <ThemeProvider>
      <ColdStartChecker>
        <AuthProvider>
        <UserModeProvider>
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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route
                      path="/"
                      element={
                        <PublicLayout>
                          <Home />
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

                    {/* Authenticated Routes */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route
                        path="/tasks"
                        element={
                          <ModeProtectedRoute allowedMode="worker">
                            <Tasks />
                          </ModeProtectedRoute>
                        }
                      />
                      <Route path="/tasks/:id" element={<TaskDetail />} />
                      <Route
                        path="/post-task"
                        element={
                          <ModeProtectedRoute allowedMode="poster">
                            <PostTask />
                          </ModeProtectedRoute>
                        }
                      />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/activity" element={<Activity />} />
                      <Route
                        path="/earnings"
                        element={
                          <ModeProtectedRoute allowedMode="worker">
                            <Earnings />
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
                      <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
                      <Route path="/admin/tasks" element={<AdminTasks />} />
                      <Route path="/admin/tasks/:taskId" element={<AdminTaskDetail />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                    </Route>
                  </Routes>
                </Suspense>
              </Router>
                </SocketProvider>
              </CancellationProvider>
            </NotificationProvider>
          </AvailabilityProvider>
        </UserModeProvider>
      </AuthProvider>
      </ColdStartChecker>
    </ThemeProvider>
  )
}

export default App

