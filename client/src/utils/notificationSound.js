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

/**
 * Play a two-tone "ding" (bell-like) notification sound.
 * Call when a new task notification is shown.
 */
export function playNotificationBell() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { })
    }

    const now = ctx.currentTime

    // First tone - higher ding
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.08)
    gain1.gain.setValueAtTime(0.25, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.25)

    // Second tone - lower ding (bell pair)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(660, now + 0.12)
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.2)
    gain2.gain.setValueAtTime(0.2, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.4)
  } catch (_) {
    // Ignore errors (e.g. autoplay blocked, no Web Audio)
  }
}
