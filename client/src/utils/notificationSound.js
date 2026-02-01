/**
 * Urgent alarm sound for new task notifications using Web Audio API.
 * No external audio file required. Safe to call repeatedly.
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
 * Call once when the app loads (e.g. NotificationProvider mount) so the alarm
 * can play after the user has interacted with the page.
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
 * Play one buzz. Resumes AudioContext first so it actually plays (browsers block until user interaction).
 */
export function playNotificationBell() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const doPlay = () => playBuzzNow(ctx)
    if (ctx.state === 'suspended') {
      ctx.resume().then(doPlay).catch(() => { })
    } else {
      doPlay()
    }
  } catch (_) { }
}

/**
 * Start repeating the buzz every 2 sec until the user accepts/rejects or dismisses.
 * Resumes AudioContext first so the first buzz plays.
 */
export function startNotificationAlertLoop() {
  if (typeof window === 'undefined') return
  stopNotificationAlertLoop()
  const ctx = getAudioContext()
  if (!ctx) return

  const scheduleLoop = () => {
    playNotificationBell()
    alertLoopIntervalId = setInterval(playNotificationBell, BUZZ_REPEAT_INTERVAL_MS)
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(scheduleLoop).catch(() => { })
  } else {
    scheduleLoop()
  }
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
