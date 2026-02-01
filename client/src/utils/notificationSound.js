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

/** How often to repeat the alarm while the new-task alert is visible (ms). */
const BELL_REPEAT_INTERVAL_MS = 3500
let alertLoopIntervalId = null

/** Urgent alarm: 3 sharp beeps (beep-beep-beep) then a higher warning tone. */
const BEEP_DURATION = 0.12
const BEEP_GAP = 0.08
const BEEP_FREQ = 880
const WARNING_FREQ = 1320
const GAIN_LEVEL = 0.28

function playBeep(ctx, startTime, freq, duration) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(GAIN_LEVEL, startTime + 0.01)
  gain.gain.setValueAtTime(GAIN_LEVEL, startTime + duration * 0.3)
  gain.gain.linearRampToValueAtTime(0.01, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

/**
 * Play an urgent alarm (3 quick beeps + warning tone). Safe to call repeatedly.
 */
export function playNotificationBell() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { })
    }

    const t = ctx.currentTime

    // Three sharp beeps - urgent "attention" pattern
    playBeep(ctx, t, BEEP_FREQ, BEEP_DURATION)
    playBeep(ctx, t + BEEP_DURATION + BEEP_GAP, BEEP_FREQ, BEEP_DURATION)
    playBeep(ctx, t + 2 * (BEEP_DURATION + BEEP_GAP), BEEP_FREQ, BEEP_DURATION)

    // Higher warning tone - "urgent"
    const warnStart = t + 3 * (BEEP_DURATION + BEEP_GAP) + 0.05
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(WARNING_FREQ, warnStart)
    osc.frequency.setValueAtTime(WARNING_FREQ * 1.2, warnStart + 0.08)
    gain.gain.setValueAtTime(GAIN_LEVEL * 0.9, warnStart)
    gain.gain.exponentialRampToValueAtTime(0.01, warnStart + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(warnStart)
    osc.stop(warnStart + 0.25)
  } catch (_) {
    // Ignore errors (e.g. autoplay blocked, no Web Audio)
  }
}

/**
 * Start repeating the alarm until the user accepts/rejects or dismisses the notification.
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
 * Stop the repeating alarm (call when user dismisses notification or accepts/rejects task).
 */
export function stopNotificationAlertLoop() {
  if (alertLoopIntervalId != null) {
    clearInterval(alertLoopIntervalId)
    alertLoopIntervalId = null
  }
}
