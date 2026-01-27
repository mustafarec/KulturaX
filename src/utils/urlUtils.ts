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
    if (!url || typeof url !== 'string') return undefined;

    // Some URLs might be relative or data URIs, leave them alone
    if (url.startsWith('data:') || url.startsWith('file:') || url.startsWith('/')) {
        return url;
    }

    if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }

    // Attempt to fix protocol-less URLs (starting with //)
    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    return url;
};
