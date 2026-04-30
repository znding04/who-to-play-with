/**
 * @typedef {Object} Friend
 * @property {string} id
 * @property {string} name
 * @property {string[]} tags
 * @property {number} addedAt - timestamp
 * @property {string} [phone]
 * @property {string} [birthday] - YYYY-MM-DD
 * @property {string} [location]
 * @property {string} [howWeMet]
 * @property {string[]} [importantEvents]
 * @property {string[]} [values]
 */

/**
 * @typedef {Object} Hangout
 * @property {string} id
 * @property {string[]} friendIds
 * @property {'meal'|'activity'|'call'|'trip'|'hangout'|'online'|'other'} type
 * @property {'30min'|'1hr'|'2hr'|'halfday'|'fullday'|'trip'} duration
 * @property {1|2|3|4|5|6|7|8|9|10} quality
 * @property {string} note
 * @property {string} date - YYYY-MM-DD
 * @property {number} createdAt - timestamp
 */

export const HANGOUT_TYPES = [
  { value: 'meal', icon: '🍜', labelKey: 'types.meal' },
  { value: 'activity', icon: '🏃', labelKey: 'types.activity' },
  { value: 'call', icon: '📞', labelKey: 'types.call' },
  { value: 'trip', icon: '✈️', labelKey: 'types.trip' },
  { value: 'hangout', icon: '🎉', labelKey: 'types.hangout' },
  { value: 'online', icon: '💬', labelKey: 'types.online' },
  { value: 'other', icon: '📦', labelKey: 'types.other' },
]

export const DURATION_OPTIONS = [
  { value: '30min', labelKey: 'durations.30min' },
  { value: '1hr', labelKey: 'durations.1hr' },
  { value: '2hr', labelKey: 'durations.2hr' },
  { value: 'halfday', labelKey: 'durations.halfday' },
  { value: 'fullday', labelKey: 'durations.fullday' },
  { value: 'trip', labelKey: 'durations.trip' },
]

// Resolve display label: built-ins use labelKey via i18n, custom items use label directly.
export function displayLabel(item, t) {
  if (!item) return ''
  return item.labelKey ? t(item.labelKey) : (item.label || '')
}

// Backwards-compat reader: hangouts stored before multi-type support only have `type`.
export function getHangoutTypes(h) {
  if (Array.isArray(h?.types) && h.types.length > 0) return h.types
  if (h?.type) return [h.type]
  return []
}
