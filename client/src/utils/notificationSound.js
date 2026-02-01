/**
 * Notification buzz for new tasks. Plays without requiring tap/click when the browser allows.
 * Context is created at load and we try to resume immediately so sound can play on new task.
 */

let audioContext = null

function getAudioContext() {
  if (audioContext) return audioContext
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  try {
    audioContext = new Ctx()
    audioContext.resume().catch(() => { })
  } catch (_) {
    return null
  }
  return audioContext
}

/**
 * Call once when the app loads. Creates AudioContext and tries to resume so
 * notification sound can play without user tap/click when the browser allows it.
 */
export function initNotificationSound() {
  getAudioContext()
}

/** Buzz every 2 seconds while the new-task alert is visible. */
const BUZZ_REPEAT_INTERVAL_MS = 2000
let alertLoopIntervalId = null

/** Single short buzz: 800 Hz, 0.2 s, sine (reliable on all devices). */
const BUZZ_FREQ = 800
const BUZZ_DURATION = 0.2
const BUZZ_GAIN = 0.3

function playBuzzNow(ctx) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(BUZZ_FREQ, t)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(BUZZ_GAIN, t + 0.02)
  gain.gain.setValueAtTime(BUZZ_GAIN, t + BUZZ_DURATION * 0.5)
  gain.gain.linearRampToValueAtTime(0.01, t + BUZZ_DURATION)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + BUZZ_DURATION)
}

/**
 * Play one buzz. If context is suspended (e.g. mobile), resume then play so it actually sounds.
 */
export function playNotificationBell() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playBuzzNow(ctx)).catch(() => { })
    } else {
      playBuzzNow(ctx)
    }
  } catch (_) { }
}

/**
 * Start buzz immediately (0th sec), then every 2 sec until the user accepts/rejects or dismisses.
 */
export function startNotificationAlertLoop() {
  if (typeof window === 'undefined') return
  stopNotificationAlertLoop()
  const ctx = getAudioContext()
  if (!ctx) return

  playNotificationBell()
  alertLoopIntervalId = setInterval(playNotificationBell, BUZZ_REPEAT_INTERVAL_MS)
}

/**
 * Stop the repeating alarm (call when user dismisses notification or accepts/rejects task).
 */
export function stopNotificationAlertLoop() {
  if (alertLoopIntervalId != null) {
    clearInterval(alertLoopIntervalId)
    alertLoopIntervalId = null
  }
}
