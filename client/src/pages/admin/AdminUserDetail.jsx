import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import AdminConfirmModal from '../../components/admin/AdminConfirmModal'
import AdminToast from '../../components/admin/AdminToast'

function AdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, type: null })
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })
  const [showEditLimitModal, setShowEditLimitModal] = useState(false)
  const [newCancelLimit, setNewCancelLimit] = useState(2)
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false)

  useEffect(() => {
    fetchUserDetails()

    // Refresh user details every 30 seconds to keep cancellation count dynamic
    const intervalId = setInterval(() => {
      fetchUserDetails()
    }, 30000)

    return () => {
      clearInterval(intervalId)
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch user details:', response.status, errorData)
        throw new Error(errorData.message || errorData.error || `Failed to fetch user details (${response.status})`)
      }

      const data = await response.json()
      if (data.user) {
        // Ensure dailyCancelCount and totalCancelLimit are included and properly set
        const userData = {
          ...data.user,
          dailyCancelCount: data.user.dailyCancelCount ?? 0,
          totalCancelLimit: data.user.totalCancelLimit ?? 2
        }
        setUser(userData)
        setNewCancelLimit(data.user.totalCancelLimit ?? 2)
      } else {
        throw new Error('User data not found in response')
      }
      if (data.activity) {
        setActivity(data.activity)
      }
    } catch (err) {
      console.error('Error fetching user details:', err)
      setError(err.message || 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-50 text-green-700 border-green-200',
      blocked: 'bg-red-50 text-red-700 border-red-200',
      banned: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return badges[status] || badges.active
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const handleBlockUser = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to block user')
      }

      showToast('User blocked successfully', 'success')
      setModalState({ isOpen: false, type: null })
      fetchUserDetails() // Refresh user data
    } catch (err) {
      showToast(err.message || 'Failed to block user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblockUser = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unblock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to unblock user')
      }

      showToast('User unblocked successfully', 'success')
      setModalState({ isOpen: false, type: null })
      fetchUserDetails()
    } catch (err) {
      showToast(err.message || 'Failed to unblock user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBanUser = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to ban user')
      }

      showToast('User banned successfully', 'success')
      setModalState({ isOpen: false, type: null })
      fetchUserDetails()
    } catch (err) {
      showToast(err.message || 'Failed to ban user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetCancellations = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reset-cancellations`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to reset cancellations')
      }

      const responseData = await response.json()
      // Update user state immediately with the response data
      if (responseData.user) {
        setUser(prevUser => {
          const updatedUser = {
            ...prevUser,
            ...responseData.user,
            dailyCancelCount: responseData.user.dailyCancelCount ?? 0,
            lastCancelDate: responseData.user.lastCancelDate ?? null
          }
          return updatedUser
        })
      }

      showToast('Cancellation count reset successfully', 'success')
      setModalState({ isOpen: false, type: null })

      // Force refresh user details to ensure all data is up to date
      setTimeout(() => {
        fetchUserDetails()
      }, 300)

      // Trigger admin stats refresh
      window.dispatchEvent(new Event('admin_stats_refresh'))
    } catch (err) {
      showToast(err.message || 'Failed to reset cancellations', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnbanUser = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unblock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to unban user')
      }

      showToast('User unbanned successfully', 'success')
      setModalState({ isOpen: false, type: null })
      fetchUserDetails()
    } catch (err) {
      showToast(err.message || 'Failed to unban user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateCancelLimit = async () => {
    setIsUpdatingLimit(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/update-cancel-limit`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ totalCancelLimit: newCancelLimit })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to update cancellation limit')
      }

      showToast(`Cancellation limit updated to ${newCancelLimit}`, 'success')
      setShowEditLimitModal(false)
      fetchUserDetails()
    } catch (err) {
      showToast(err.message || 'Failed to update cancellation limit', 'error')
    } finally {
      setIsUpdatingLimit(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user details...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'User not found'}</p>
        <Link
          to="/admin/users"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          ← Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/users"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Users
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">{user.name}</h1>
        <p className="text-gray-600">User profile and activity details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{user.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusBadge(user.status)}`}>
                  {user.status || 'active'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900">{user.role || 'user'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              {user.lastOnlineAt && (
                <div>
                  <p className="text-sm text-gray-500">Last Online</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(user.lastOnlineAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
            {!user ? (
              <p className="text-sm text-gray-500">Loading user data...</p>
            ) : (
              <div className="space-y-3">
                {user.status === 'active' ? (
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'block' })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Block User
                  </button>
                ) : user.status === 'blocked' ? (
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'unblock' })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Unblock User
                  </button>
                ) : user.status === 'banned' ? (
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'unban' })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Unban User
                  </button>
                ) : (
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'block' })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Block User
                  </button>
                )}

                {user.status !== 'banned' && (
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'ban' })}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Ban User
                  </button>
                )}

                <button
                  onClick={() => setModalState({ isOpen: true, type: 'reset' })}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Reset Cancellation Count
                </button>

                <button
                  onClick={() => {
                    setNewCancelLimit(user?.totalCancelLimit ?? 2)
                    setShowEditLimitModal(true)
                  }}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Edit Cancellation Limit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tasks Posted</p>
                <p className="text-2xl font-bold text-gray-900">{activity?.tasksPosted?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tasks Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{activity?.tasksAccepted?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activity?.tasksAccepted?.filter(t => t.status === 'COMPLETED').length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cancellations Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.dailyCancelCount !== undefined && user?.dailyCancelCount !== null
                    ? user.dailyCancelCount
                    : 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Limit: {user?.totalCancelLimit ?? 2}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cancellations</p>
                <p className="text-2xl font-bold text-gray-900">{activity?.cancellationHistory?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Recent Tasks Posted */}
          {activity?.tasksPosted && activity.tasksPosted.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks Posted</h2>
              <div className="space-y-3">
                {activity.tasksPosted.slice(0, 5).map((task) => (
                  <Link
                    key={task._id}
                    to={`/admin/tasks/${task._id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ₹{task.budget} • {formatDate(task.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${task.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                        task.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {task.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation History */}
          {activity?.cancellationHistory && activity.cancellationHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cancellation History</h2>
              <div className="space-y-3">
                {activity.cancellationHistory.slice(0, 10).map((task) => (
                  <div
                    key={task._id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(task.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'block'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleBlockUser}
        title="Block this user?"
        message="Blocked users cannot post or accept tasks. They can still log in."
        confirmText="Block User"
        confirmColor="orange"
        loading={actionLoading}
      />

      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'unblock'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleUnblockUser}
        title="Unblock this user?"
        message="This will restore the user's ability to post and accept tasks."
        confirmText="Unblock User"
        confirmColor="blue"
        loading={actionLoading}
      />

      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'ban'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleBanUser}
        title="Permanently ban user?"
        message="This will permanently disable the account. This action cannot be undone."
        confirmText="Ban User"
        confirmColor="red"
        requireType="BAN"
        loading={actionLoading}
      />

      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'reset'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleResetCancellations}
        title="Reset cancellation count?"
        message="This will reset the user's daily cancellation count to 0."
        confirmText="Reset"
        confirmColor="blue"
        loading={actionLoading}
      />

      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'unban'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleUnbanUser}
        title="Unban this user?"
        message="This will restore the user's account and allow them to use the platform again."
        confirmText="Unban User"
        confirmColor="green"
        loading={actionLoading}
      />

      {/* Edit Cancellation Limit Modal */}
      {showEditLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Cancellation Limit</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set the maximum number of tasks this user can cancel per day. Current limit: <strong>{user?.totalCancelLimit ?? 2}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Limit (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={newCancelLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (!isNaN(value) && value >= 0 && value <= 10) {
                    setNewCancelLimit(value)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={isUpdatingLimit}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current cancellations today: {user?.dailyCancelCount ?? 0}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditLimitModal(false)}
                disabled={isUpdatingLimit}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCancelLimit}
                disabled={isUpdatingLimit || newCancelLimit === (user?.totalCancelLimit ?? 2)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingLimit ? 'Updating...' : 'Update Limit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AdminToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  )
}

export default AdminUserDetail

