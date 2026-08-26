/**
 * Theme Engine - Implements Lagos timezone calendar, 7 day-of-week strategy pillars,
 * 4 weekly category rotations, generic post rules, and Reel script schedules.
 */

export const THEMES = {
  0: { name: 'Fragrance Spotlight', objective: 'Sell a featured perfume' },
  1: { name: 'Fragrance Education', objective: 'Build trust & authority' },
  2: { name: 'Fragrance Finder', objective: 'Increase engagement (polls/questions)' },
  3: { name: 'Perfume Lifestyle', objective: 'Create desire' },
  4: { name: 'Weekend Collection', objective: 'Drive sales for the weekend' },
  5: { name: 'Reviews & Trust', objective: 'Build credibility (simulate a happy customer)' },
  6: { name: 'Perfume Academy', objective: 'Long-form educational content' }
};

export const CATEGORY_ROTATION = {
  1: 'Fresh & Everyday',
  2: 'Bold & Masculine',
  3: 'Oud & Luxury',
  4: "Unisex & Women's"
};

export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

/**
 * Normalizes a given Date (or current time) to Africa/Lagos timezone (UTC+1).
 * @param {Date|string|number} [dateInput] 
 * @returns {Object} Lagos calendar context
 */
export function getLagosDateTime(dateInput = new Date()) {
  const dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);

  // Format parts according to Africa/Lagos timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'long'
  });

  const parts = formatter.formatToParts(dateObj);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hour = parseInt(partMap.hour, 10) || 0;
  const minute = parseInt(partMap.minute, 10) || 0;
  const weekdayName = partMap.weekday;

  // Convert weekday name to Python-style 0-indexed Monday..Sunday (0=Mon, 6=Sun)
  const dayIndexMap = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
  };
  const dayOfWeek = dayIndexMap[weekdayName] !== undefined ? dayIndexMap[weekdayName] : 0;

  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;
  const isoDate = `${yyyy}-${mm}-${dd}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    weekdayName,
    dayOfWeek, // 0=Mon .. 6=Sun
    dateKey,   // YYYYMMDD
    isoDate,   // YYYY-MM-DD
    rawDate: dateObj
  };
}

/**
 * Calculates the week of the month (1-4).
 * @param {number} dayOfMonth 
 * @returns {number} 1, 2, 3, or 4
 */
export function getWeekOfMonth(dayOfMonth) {
  const week = Math.floor((dayOfMonth - 1) / 7) + 1;
  return Math.min(week, 4);
}

/**
 * Resolves the active category for a given week of the month.
 * @param {number} week 
 * @returns {string} Category name
 */
export function getActiveCategory(week) {
  return CATEGORY_ROTATION[week] || 'Fresh & Everyday';
}

/**
 * Resolves the strategy theme info for a given day of the week (0-6).
 * @param {number} dayOfWeek 
 * @returns {{ name: string, objective: string }}
 */
export function getThemeForDay(dayOfWeek) {
  return THEMES[dayOfWeek] || THEMES[0];
}

/**
 * Determines if the post for a given day should be generic / educational (no hard sell).
 * Tuesday (1) & Thursday (3) have 50% random chance; Sunday (6) is always 100% generic.
 * @param {number} dayOfWeek 
 * @returns {boolean}
 */
export function shouldBeGeneric(dayOfWeek) {
  if (dayOfWeek === 1 || dayOfWeek === 3) {
    return Math.random() < 0.5;
  }
  if (dayOfWeek === 6) {
    return true;
  }
  return false;
}

/**
 * Checks if a short video / Reel script is required for this day.
 * Monday (0), Wednesday (2), Friday (4), Saturday (5) require Reels.
 * @param {number} dayOfWeek 
 * @returns {boolean}
 */
export function requiresReel(dayOfWeek) {
  return [0, 2, 4, 5].includes(dayOfWeek);
}

/**
 * Returns Time of Day bracket (Morning, Afternoon, Evening).
 * @param {number} hour 
 * @returns {string}
 */
export function getTimeOfDay(hour) {
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

/**
 * Returns day context prompt string with 20% chance to explicitly reveal weekday name.
 * @param {string} dayName 
 * @returns {string}
 */
export function getDayContext(dayName) {
  if (Math.random() < 0.20) {
    return `Today is: ${dayName}`;
  }
  return 'The specific day of the week is hidden. Focus purely on the weather and time.';
}

/**
 * Resolves comprehensive theme and rotation metadata for a date.
 * @param {Date|string|number} [dateInput] 
 * @returns {Object} Complete theme and rotation configuration
 */
export function getActiveThemeAndCategory(dateInput = new Date()) {
  const lagos = getLagosDateTime(dateInput);
  const weekOfMonth = getWeekOfMonth(lagos.day);
  const activeCategory = getActiveCategory(weekOfMonth);
  const themeInfo = getThemeForDay(lagos.dayOfWeek);
  const isGeneric = shouldBeGeneric(lagos.dayOfWeek);
  const isReelRequired = requiresReel(lagos.dayOfWeek);
  const timeOfDay = getTimeOfDay(lagos.hour);
  const dayContext = getDayContext(lagos.weekdayName);

  return {
    lagosDate: lagos,
    theme: themeInfo.name,
    themeObjective: themeInfo.objective,
    weekOfMonth,
    activeCategory,
    isGeneric,
    requiresReel: isReelRequired,
    timeOfDay,
    dayContext,
    dateKey: lagos.dateKey,
    isoDate: lagos.isoDate
  };
}
