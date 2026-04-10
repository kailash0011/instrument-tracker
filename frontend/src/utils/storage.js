/**
 * localStorage utility — thin, safe wrapper for persistent UI state.
 *
 * All keys are namespaced with "instrument-tracker:" so they never clash
 * with other apps that might share the same origin.
 *
 * Usage:
 *   import { readFromStorage, writeToStorage, removeFromStorage } from '../utils/storage'
 *
 *   const saved = readFromStorage('count:selectedDept', '')
 *   writeToStorage('count:selectedDept', deptId)
 *   removeFromStorage('count:selectedDept')
 */

const NAMESPACE = 'instrument-tracker'

/**
 * Read a JSON-serialised value from localStorage.
 *
 * @param {string} key     - storage key (will be prefixed with namespace)
 * @param {*}      fallback - value to return when the key is absent or the
 *                            stored JSON is malformed
 * @returns {*} parsed value or fallback
 */
export function readFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`${NAMESPACE}:${key}`)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    // localStorage unavailable or stored value is not valid JSON
    return fallback
  }
}

/**
 * Write a JSON-serialisable value to localStorage.
 *
 * Failures (private-browsing quota, storage disabled) are silently swallowed
 * so callers never need to guard against write errors.
 *
 * @param {string} key   - storage key (will be prefixed with namespace)
 * @param {*}      value - any JSON-serialisable value
 */
export function writeToStorage(key, value) {
  try {
    localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value))
  } catch {
    // localStorage unavailable or quota exceeded – silently ignore
  }
}

/**
 * Remove a single key from localStorage.
 *
 * @param {string} key - storage key (will be prefixed with namespace)
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(`${NAMESPACE}:${key}`)
  } catch {
    // ignore
  }
}
