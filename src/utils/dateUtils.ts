
/**
 * Safely parses a date string or number into a Date object.
 * Handles SQL timestamp format "YYYY-MM-DD HH:MM:SS" which fails on iOS (JSC).
 */
export const parseDate = (date: string | number | Date | null | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;

    if (typeof date === 'string') {
        // Fix SQL timestamp format for iOS (replace space with T)
        // "2023-01-01 12:00:00" -> "2023-01-01T12:00:00"
        if (date.includes(' ') && !date.includes('T')) {
            return new Date(date.replace(' ', 'T'));
        }
    }

    const d = new Date(date);
    // basic check for valid date
    if (isNaN(d.getTime())) return null;
    return d;
};

export const formatRelativeTime = (dateString: string | number): string => {
    const date = parseDate(dateString);
    if (!date) return ''; // Handle invalid date gracefully

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();


    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
        return 'Şimdi';
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
        return `${diffMin} dk`;
    }

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
        return `${diffHour} sa`;
    }

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 4) {
        return `${diffDay}g`;
    }

    return date.toLocaleDateString();
};
