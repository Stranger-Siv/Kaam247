/**
 * Intent-based auth: which pages/actions require login and what message to show.
 * Used by ProtectedRoute (redirect to login) and Login (display message + redirect after).
 * No global auth at root; guards run only when user attempts a protected action.
 */

/** Search param for why login was required (worker = view tasks, poster = post task) */
export const LOGIN_MESSAGE_WORKER = 'worker'
export const LOGIN_MESSAGE_POSTER = 'poster'

/** Search param key for redirect-after-login destination */
export const RETURN_URL_PARAM = 'returnUrl'

/** Intent messages shown on login page when user came from a protected action */
export const LOGIN_INTENT_MESSAGES = {
  [LOGIN_MESSAGE_WORKER]: 'Login to view tasks near you',
  [LOGIN_MESSAGE_POSTER]: 'Login to post a task and track its progress'
}

/**
 * Determine login redirect path and optional message for a protected route.
 * Worker intent: /tasks, /tasks/:id (view tasks / task detail).
 * Poster intent: /post-task and any step (e.g. budget page).
 * Other: profile, dashboard, activity, earnings, etc. — no specific message.
 * @param {{ pathname: string, search: string }} location
 * @returns {{ returnUrl: string, message?: string }}
 */
export function getLoginRedirectParams(location) {
  const pathname = location?.pathname || ''
  const search = (location?.search || '').trim()
  const returnUrl = pathname + (search ? search : '')

  if (pathname === '/tasks' || pathname.startsWith('/tasks/')) {
    return { returnUrl, message: LOGIN_MESSAGE_WORKER }
  }
  if (pathname === '/post-task' || pathname.startsWith('/post-task')) {
    return { returnUrl, message: LOGIN_MESSAGE_POSTER }
  }
  return { returnUrl }
}

/**
 * Validate returnUrl to prevent open redirect (only allow relative app paths).
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeReturnUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed === '') return false
  if (!trimmed.startsWith('/')) return false
  if (trimmed.startsWith('//')) return false
  if (trimmed.startsWith('/login') || trimmed.startsWith('/register')) return false
  return true
}
