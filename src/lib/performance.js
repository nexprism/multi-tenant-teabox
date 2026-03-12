// Performance optimization utilities
import { unstable_cache } from 'next/cache';

// Cache configuration for different data types
export const CACHE_CONFIG = {
    categories: {
        revalidate: 3600, // 1 hour
        tags: ['categories'],
    },
    products: {
        revalidate: 600, // 10 minutes
        tags: ['products'],
    },
    pages: {
        revalidate: 3600, // 1 hour
        tags: ['pages'],
    },
    blogs: {
        revalidate: 1800, // 30 minutes
        tags: ['blogs'],
    },
};

// Helper to create cached API fetch
export function createCachedFetch(fetcher, config) {
    return unstable_cache(fetcher, config.tags, {
        revalidate: config.revalidate,
        tags: config.tags,
    });
}

// Debounce helper for search
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle helper
export function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Image optimization helper
export function getOptimizedImageProps(src, alt, priority = false) {
    return {
        src,
        alt,
        loading: priority ? 'eager' : 'lazy',
        priority,
        sizes: priority
            ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            : '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw',
    };
}
