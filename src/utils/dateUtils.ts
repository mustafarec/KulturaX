export const formatRelativeTime = (dateString: string | number): string => {
    const date = new Date(dateString);
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
