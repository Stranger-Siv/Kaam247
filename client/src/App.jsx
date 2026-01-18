import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import Home from './pages/public/Home'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import PostTask from './pages/PostTask'
import Profile from './pages/Profile'
import Activity from './pages/Activity'
import Earnings from './pages/Earnings'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/layout/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminTasks from './pages/admin/AdminTasks'
import AdminTaskDetail from './pages/admin/AdminTaskDetail'
import AdminReports from './pages/admin/AdminReports'

function App() {
  return (
    <ColdStartChecker>
      <AuthProvider>
      <UserModeProvider>
        <AvailabilityProvider>
          <NotificationProvider>
            <CancellationProvider>
              <SocketProvider>
              <Router>
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
              </Router>
              </SocketProvider>
            </CancellationProvider>
          </NotificationProvider>
        </AvailabilityProvider>
      </UserModeProvider>
    </AuthProvider>
    </ColdStartChecker>
  )
}

export default App

