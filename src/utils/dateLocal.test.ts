import { describe, expect, it } from 'vitest';
import { formatLocalDateString, getBusinessDateString, getBusinessTimeString, parseLocalDateString, timeToMinutes } from './dateLocal';

describe('parseLocalDateString', () => {
    it('parses year/month/day as local components, not UTC', () => {
        const date = parseLocalDateString('2026-09-19');
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(8); // September, 0-indexed
        expect(date.getDate()).toBe(19);
    });

    it('reports the correct day of week regardless of UTC offset drift', () => {
        // 2026-09-19 is a Saturday. new Date('2026-09-19') (UTC midnight)
        // would read back as Friday in any timezone behind UTC.
        const date = parseLocalDateString('2026-09-19');
        expect(date.getDay()).toBe(6); // Saturday
    });
});

describe('timeToMinutes', () => {
    it('converts HH:mm to minutes since midnight', () => {
        expect(timeToMinutes('00:00')).toBe(0);
        expect(timeToMinutes('09:30')).toBe(570);
        expect(timeToMinutes('23:45')).toBe(1425);
    });
});

describe('formatLocalDateString', () => {
    it('round-trips through parseLocalDateString unchanged', () => {
        expect(formatLocalDateString(parseLocalDateString('2026-09-19'))).toBe('2026-09-19');
    });

    it('reflects a day increment applied via local setDate/getDate', () => {
        const date = parseLocalDateString('2026-09-19');
        date.setDate(date.getDate() + 1);
        expect(formatLocalDateString(date)).toBe('2026-09-20');
    });
});

describe('getBusinessDateString', () => {
    it('formats as YYYY-MM-DD', () => {
        const result = getBusinessDateString(new Date('2026-09-19T12:00:00Z'));
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('stays on the Manila calendar day for a UTC instant that is already tomorrow in Manila', () => {
        // 2026-09-18 23:00 UTC = 2026-09-19 07:00 Asia/Manila (UTC+8).
        // toISOString().split('T')[0] on this instant would read "2026-09-18".
        const result = getBusinessDateString(new Date('2026-09-18T23:00:00Z'));
        expect(result).toBe('2026-09-19');
    });

    it('stays on the Manila calendar day for a UTC instant just before Manila midnight', () => {
        // 2026-09-18 15:59 UTC = 2026-09-18 23:59 Asia/Manila - still the 18th locally.
        const result = getBusinessDateString(new Date('2026-09-18T15:59:00Z'));
        expect(result).toBe('2026-09-18');
    });
});

describe('getBusinessTimeString', () => {
    it('formats as HH:mm in 24-hour time', () => {
        // 2026-09-18 23:00 UTC = 2026-09-19 07:00 Asia/Manila.
        const result = getBusinessTimeString(new Date('2026-09-18T23:00:00Z'));
        expect(result).toBe('07:00');
    });
});
