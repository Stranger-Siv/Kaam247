/**
 * Play a short bell/ding sound for new task notifications using Web Audio API.
 * No external audio file required. Safe to call repeatedly; plays at most one at a time.
 */

let audioContext = null
let unlocked = false

function getAudioContext() {
  if (audioContext) return audioContext
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioContext = new Ctx()
  // Unlock on first user interaction (required by many browsers for playback)
  if (!unlocked) {
    const unlock = () => {
      if (!audioContext || unlocked) return
      audioContext.resume().then(() => {
        unlocked = true
        document.removeEventListener('click', unlock)
        document.removeEventListener('touchstart', unlock)
        document.removeEventListener('keydown', unlock)
      }).catch(() => { })
    }
    document.addEventListener('click', unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
  }
  return audioContext
}

/**
 * Initialize the audio context and register unlock listeners.
 * Call once when the app loads (e.g. NotificationProvider mount) so the bell
 * can play after the user has interacted with the page.
 */
export function initNotificationSound() {
  getAudioContext()
}

/** How often to repeat the bell while the new-task alert is visible (ms). */
const BELL_REPEAT_INTERVAL_MS = 3500
let alertLoopIntervalId = null

/**
 * Play a two-tone "ding" (bell-like) notification sound.
 * Safe to call repeatedly.
 */
export function playNotificationBell() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { })
    }

    const t = ctx.currentTime

    // First tone - higher ding
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, t)
    osc1.frequency.exponentialRampToValueAtTime(1100, t + 0.08)
    gain1.gain.setValueAtTime(0.25, t)
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.25)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(t)
    osc1.stop(t + 0.25)

    // Second tone - lower ding (bell pair)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(660, t + 0.12)
    osc2.frequency.exponentialRampToValueAtTime(880, t + 0.2)
    gain2.gain.setValueAtTime(0.2, t + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.4)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t + 0.12)
    osc2.stop(t + 0.4)
  } catch (_) {
    // Ignore errors (e.g. autoplay blocked, no Web Audio)
  }
}

/**
 * Start repeating the bell until the user accepts/rejects or dismisses the notification.
 * Plays once immediately, then every BELL_REPEAT_INTERVAL_MS.
 */
export function startNotificationAlertLoop() {
  if (typeof window === 'undefined') return
  stopNotificationAlertLoop()
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => { })
  }
  playNotificationBell()
  alertLoopIntervalId = setInterval(playNotificationBell, BELL_REPEAT_INTERVAL_MS)
}

/**
 * Stop the repeating bell (call when user dismisses notification or accepts/rejects task).
 */
export function stopNotificationAlertLoop() {
  if (alertLoopIntervalId != null) {
    clearInterval(alertLoopIntervalId)
    alertLoopIntervalId = null
  }
}
