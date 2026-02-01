/**
 * Urgent alarm sound for new task notifications.
 * AudioContext is created and resumed on first user gesture (required on iOS/mobile).
 */

let audioContext = null
let unlocked = false
let unlockListenersAdded = false

function getAudioContext() {
  if (audioContext) return audioContext
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  try {
    audioContext = new Ctx()
    addUnlockListeners()
    audioContext.resume().catch(() => { })
  } catch (_) {
    return null
  }
  return audioContext
}

function addUnlockListeners() {
  if (typeof window === 'undefined' || unlockListenersAdded) return
  unlockListenersAdded = true
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return

  const unlock = () => {
    if (!audioContext) {
      try {
        audioContext = new Ctx()
        audioContext.resume().then(() => { unlocked = true }).catch(() => { })
      } catch (_) { }
      return
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => { })
    }
  }

  const opts = { capture: true }
  document.addEventListener('click', unlock, opts)
  document.addEventListener('touchstart', unlock, opts)
  document.addEventListener('touchend', unlock, opts)
  document.addEventListener('keydown', unlock, opts)
}

/**
 * Call once when the app loads. Registers listeners so the first tap/click
 * creates and unlocks the AudioContext (required on mobile).
 */
export function initNotificationSound() {
  addUnlockListeners()
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
  addUnlockListeners()
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
