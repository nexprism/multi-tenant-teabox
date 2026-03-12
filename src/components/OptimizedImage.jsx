import Image from 'next/image';
import { useState } from 'react';

/**
 * OptimizedImage component with automatic WebP support and lazy loading
 * 
 * This component:
 * - Automatically serves WebP when available
 * - Falls back to original format if WebP doesn't exist
 * - Implements lazy loading by default
 * - Shows loading placeholder
 * - Handles errors gracefully
 * 
 * @param {string} src - Image source path
 * @param {string} alt - Alt text for accessibility
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {boolean} priority - Load image with priority (for above-the-fold images)
 * @param {string} className - Additional CSS classes
 * @param {object} ...props - Other Next Image props
 */
export default function OptimizedImage({
    src,
    alt = '',
    width,
    height,
    priority = false,
    className = '',
    fill = false,
    sizes,
    ...props
}) {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);

    // Try to use WebP version if source is jpg/jpeg/png
    const getWebPSrc = (originalSrc) => {
        if (!originalSrc) return originalSrc;

        // Only convert local images, not external URLs
        if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
            return originalSrc;
        }

        // Check if already webp
        if (originalSrc.endsWith('.webp')) {
            return originalSrc;
        }

        // Convert to WebP
        if (/\.(jpg|jpeg|png|jfif)$/i.test(originalSrc)) {
            return originalSrc.replace(/\.(jpg|jpeg|png|jfif)$/i, '.webp');
        }

        return originalSrc;
    };

    const webpSrc = getWebPSrc(src);

    const handleError = () => {
        // Fallback to original if WebP fails
        if (imageSrc === webpSrc && webpSrc !== src) {
            setImageSrc(src);
        } else {
            console.error(`Failed to load image: ${src}`);
        }
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    const imageProps = {
        src: imageSrc || webpSrc,
        alt,
        className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
        onError: handleError,
        onLoad: handleLoad,
        loading: priority ? 'eager' : 'lazy',
        priority,
        ...props,
    };

    // Optimized sizes for responsive images
    const defaultSizes = priority
        ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        : '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw';

    if (fill) {
        return (
            <Image
                {...imageProps}
                fill
                sizes={sizes || defaultSizes}
            />
        );
    }

    return (
        <Image
            {...imageProps}
            width={width}
            height={height}
            sizes={sizes || defaultSizes}
        />
    );
}

/**
 * Example usage:
 * 
 * // For hero images (above the fold)
 * <OptimizedImage
 *   src="/uploads/hero.webp"
 *   alt="Hero image"
 *   width={1920}
 *   height={1080}
 *   priority={true}
 * />
 * 
 * // For product images (lazy load)
 * <OptimizedImage
 *   src="/uploads/product/item.webp"
 *   alt="Product"
 *   width={400}
 *   height={400}
 * />
 * 
 * // For fill container images
 * <div className="relative w-full h-64">
 *   <OptimizedImage
 *     src="/category/banner.jpg"
 *     alt="Category"
 *     fill
 *   />
 * </div>
 */
