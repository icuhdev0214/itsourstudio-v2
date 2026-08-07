/**
 * Input Sanitization Utilities
 * Provides XSS prevention and input validation for all user-facing forms.
 */

/**
 * Sanitize a string by escaping HTML special characters.
 * Prevents XSS by converting dangerous characters to their HTML entities.
 */
export const sanitizeString = (input: string): string => {
    if (!input || typeof input !== 'string') return '';

    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return input.replace(/[&<>"'`=/]/g, (char) => map[char] || char);
};

/**
 * Strip all HTML tags from a string.
 * Use this for plain-text fields like names.
 */
export const stripHtmlTags = (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate and sanitize an email address.
 * Returns the sanitized email if valid, otherwise returns null.
 */
export const sanitizeEmail = (email: string): string | null => {
    if (!email || typeof email !== 'string') return null;

    const sanitized = email.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(sanitized)) return null;
    return sanitized;
};

/**
 * Validate and sanitize a Philippine phone number.
 * Accepts formats: 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX
 * Returns normalized format: +639XXXXXXXXX
 */
export const sanitizePhoneNumber = (phone: string): string | null => {
    if (!phone || typeof phone !== 'string') return null;

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle different formats
    if (cleaned.startsWith('+63')) {
        cleaned = cleaned; // Already correct format
    } else if (cleaned.startsWith('63')) {
        cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
        cleaned = '+63' + cleaned.slice(1);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
        cleaned = '+63' + cleaned;
    }

    // Validate Philippine mobile number format
    const phoneRegex = /^\+639\d{9}$/;
    if (!phoneRegex.test(cleaned)) return null;

    return cleaned;
};

/**
 * Sanitize a name field.
 * Removes HTML, limits length, and only allows letters, spaces, and common name characters.
 */
export const sanitizeName = (name: string, maxLength: number = 100): string => {
    if (!name || typeof name !== 'string') return '';

    // Strip HTML tags first
    let cleaned = stripHtmlTags(name);

    // Remove any characters that aren't letters, spaces, hyphens, periods, or apostrophes
    cleaned = cleaned.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');

    // Collapse multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Limit length
    return cleaned.slice(0, maxLength);
};

/**
 * Sanitize a general text field (like notes or messages).
 * Allows more characters but still prevents XSS.
 */
export const sanitizeText = (text: string, maxLength: number = 1000): string => {
    if (!text || typeof text !== 'string') return '';

    // Strip HTML tags
    let cleaned = stripHtmlTags(text);

    // Escape remaining special characters for safe display
    cleaned = sanitizeString(cleaned);

    // Limit length
    return cleaned.slice(0, maxLength);
};

/**
 * Validate a date string.
 * Returns a valid Date object or null.
 */
export const validateDate = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return date;
};

/**
 * Sanitize a number input.
 * Returns the number if valid and within range, otherwise returns fallback.
 */
export const sanitizeNumber = (
    input: string | number,
    min: number = 0,
    max: number = Number.MAX_SAFE_INTEGER,
    fallback: number = 0
): number => {
    const num = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(num)) return fallback;
    if (num < min) return min;
    if (num > max) return max;

    return num;
};

/**
 * Sanitize a URL.
 * Only allows http/https protocols to prevent javascript: URLs.
 */
export const sanitizeUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    const trimmed = url.trim();

    // Only allow http and https protocols
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return null;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed.href;
    } catch {
        return null;
    }
};

/**
 * Comprehensive form data sanitizer.
 * Use this to sanitize an entire form object before submission.
 */
export const sanitizeFormData = <T extends Record<string, any>>(
    data: T,
    schema: Record<keyof T, 'name' | 'email' | 'phone' | 'text' | 'number' | 'date' | 'url' | 'raw'>
): T => {
    const sanitized = { ...data };

    for (const key in schema) {
        const type = schema[key];
        const value = data[key];

        switch (type) {
            case 'name':
                sanitized[key] = sanitizeName(value) as any;
                break;
            case 'email':
                sanitized[key] = sanitizeEmail(value) as any;
                break;
            case 'phone':
                sanitized[key] = sanitizePhoneNumber(value) as any;
                break;
            case 'text':
                sanitized[key] = sanitizeText(value) as any;
                break;
            case 'number':
                sanitized[key] = sanitizeNumber(value) as any;
                break;
            case 'date':
                sanitized[key] = validateDate(value) as any;
                break;
            case 'url':
                sanitized[key] = sanitizeUrl(value) as any;
                break;
            case 'raw':
                // No sanitization for explicitly marked raw fields
                break;
        }
    }

    return sanitized;
};
