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

/** Strong alarm: higher pitch, square wave, louder, double-beep pattern. */
const BUZZ_FREQ = 1200
const BEEP_DURATION = 0.15
const GAP_BETWEEN_BEEPS = 0.12
const BUZZ_GAIN = 0.55

function playBuzzNow(ctx) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'  // harsher, more alarm-like than sine
  osc.frequency.setValueAtTime(BUZZ_FREQ, t)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(BUZZ_GAIN, t + 0.01)
  gain.gain.setValueAtTime(BUZZ_GAIN, t + BEEP_DURATION)
  gain.gain.linearRampToValueAtTime(0.01, t + BEEP_DURATION + 0.02)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + BEEP_DURATION)

  // Second beep for double-alarm effect
  const t2 = t + BEEP_DURATION + GAP_BETWEEN_BEEPS
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'square'
  osc2.frequency.setValueAtTime(BUZZ_FREQ, t2)
  gain2.gain.setValueAtTime(0, t2)
  gain2.gain.linearRampToValueAtTime(BUZZ_GAIN, t2 + 0.01)
  gain2.gain.setValueAtTime(BUZZ_GAIN, t2 + BEEP_DURATION)
  gain2.gain.linearRampToValueAtTime(0.01, t2 + BEEP_DURATION + 0.02)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(t2)
  osc2.stop(t2 + BEEP_DURATION)
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
