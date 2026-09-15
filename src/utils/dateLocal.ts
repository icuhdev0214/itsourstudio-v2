// The studio operates in Asia/Manila. "Today" must be computed against that
// timezone, not the browser's local zone or UTC - otherwise a UTC-based
// `toISOString()` read before ~8 AM Manila time returns yesterday's date.
const BUSINESS_TIMEZONE = 'Asia/Manila';

/**
 * Parses a "YYYY-MM-DD" date string as a local-time Date (explicit
 * year/month/day constructor) instead of `new Date(dateString)`, which
 * parses as UTC midnight and can shift the calendar date by a day - and
 * therefore the day-of-week - in timezones behind UTC.
 */
export function parseLocalDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Converts an "HH:mm" time string to minutes since midnight, for comparing
 * or overlapping two time ranges.
 */
export function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Formats a Date's own local year/month/day as "YYYY-MM-DD", instead of
 * `date.toISOString().split('T')[0]`, which serializes in UTC and can shift
 * the calendar date by a day relative to what `date`'s local fields say.
 */
export function formatLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns a date as "YYYY-MM-DD" in the studio's business timezone
 * (Asia/Manila), regardless of the viewer's own timezone or the UTC offset
 * `toISOString()` would otherwise apply.
 */
export function getBusinessDateString(date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
}

/**
 * Returns the current time-of-day as "HH:mm" in the studio's business
 * timezone (Asia/Manila), for the same reason as `getBusinessDateString`.
 */
export function getBusinessTimeString(date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);

    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    return `${hour}:${minute}`;
}
