/**
 * Utility functions for URL manipulation and normalization.
 */

/**
 * Ensures that a URL uses the HTTPS protocol.
 * Specifically handles Google Books thumbnail URLs that often default to HTTP.
 * 
 * @param url The URL to normalize
 * @returns The normalized HTTPS URL or undefined if it's invalid
 */
export const ensureHttps = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;

    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }

    return url;
};
