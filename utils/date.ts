/**
 * Date utility functions for consistent date handling across the application
 */
import { formatDistanceToNow } from 'date-fns';

/**
 * Safely converts a date to ISO string
 * @param date Date object or string to convert
 * @returns ISO string representation of the date
 */
export const toISOString = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;

    if (date instanceof Date) {
        return date.toISOString();
    }

    try {
        return new Date(date).toISOString();
    } catch (error) {
        console.error('Invalid date format:', error);
        return null;
    }
};

/**
 * Formats a date with relative time (e.g., "2 days ago")
 * @param date Date to format
 * @returns Formatted date with relative time
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
    if (!date) return 'No date';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid date';

        return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Invalid date';
    }
};

/**
 * Formats a date for display with both date and relative time
 * @param date Date to format
 * @returns Formatted date with both absolute and relative time
 */
export const formatDateWithRelativeTime = (date: Date | string | null | undefined): string => {
    if (!date) return 'No date';

    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid date';

        return `${dateObj.toLocaleDateString()} (${formatDistanceToNow(dateObj, { addSuffix: true })})`;
    } catch (error) {
        console.error('Error formatting date with relative time:', error);
        return 'Invalid date';
    }
};

/**
 * Formats a date for HTML datetime-local input, accounting for timezone
 * @param date Date to format
 * @returns Formatted date string for datetime-local input
 */
export const formatDateTimeForInput = (date: Date | null): string => {
    if (!date) return '';

    // Adjust for timezone offset to ensure correct display in form
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

/**
 * Gets tomorrow's date as a string (YYYY-MM-DD)
 * @returns Tomorrow's date as a string
 */
export const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

/**
 * Formats a time string (HH:MM:SS) to a readable format (e.g., "2:30 PM")
 * @param time Time string in HH:MM:SS format
 * @returns Formatted time string
 */
export const formatTime = (time: string | null): string => {
    if (!time) return '';

    try {
        return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
}; 