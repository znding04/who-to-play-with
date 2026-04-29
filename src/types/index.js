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
 * @property {1|2|3|4|5} quality
 * @property {string} note
 * @property {string} date - YYYY-MM-DD
 * @property {number} createdAt - timestamp
 */

export const HANGOUT_TYPES = [
  { value: 'meal', icon: '🍜', label: '吃饭' },
  { value: 'activity', icon: '🏃', label: '活动' },
  { value: 'call', icon: '📞', label: '通话' },
  { value: 'trip', icon: '✈️', label: '旅行' },
  { value: 'hangout', icon: '🎉', label: '聚会' },
  { value: 'online', icon: '💬', label: '线上' },
  { value: 'other', icon: '📦', label: '其他' },
]

export const DURATION_OPTIONS = [
  { value: '30min', label: '30分钟' },
  { value: '1hr', label: '1小时' },
  { value: '2hr', label: '2小时' },
  { value: 'halfday', label: '半天' },
  { value: 'fullday', label: '一天' },
  { value: 'trip', label: '旅行' },
]
