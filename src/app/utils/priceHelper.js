/**
 * Centralized utility to handle price retrieval logic consistently across listing and detail pages.
 * 
 * @param {Object} product - The product object
 * @param {string|number} selectedVariantId - Optional ID of the selected variant
 * @returns {Object} - An object containing salePrice, originalPrice, hasSale, and discount
 */
export const getDisplayPrice = (product, selectedVariantId = null) => {
    if (!product) return { salePrice: null, originalPrice: null, hasSale: false, discount: 0 };

    let variant = null;
    if (selectedVariantId && product.variants && product.variants.length > 0) {
        variant = product.variants.find(v => String(v._id) === String(selectedVariantId));
    }

    // Fallback to first variant if no specific variant is found but variants exist
    if (!variant && product.variants && product.variants.length > 0) {
        variant = product.variants[0];
    }

    // Helper function to get price value, handling null explicitly
    const getPrice = (obj, priceKey, fallbackKey) => {
        if (!obj) return null;
        // Check if priceKey exists and is not null (but can be 0)
        if (obj[priceKey] !== null && obj[priceKey] !== undefined && typeof obj[priceKey] === 'number') {
            return obj[priceKey];
        }
        // Fallback to fallbackKey if priceKey is null/undefined
        if (fallbackKey && obj[fallbackKey] !== null && obj[fallbackKey] !== undefined && typeof obj[fallbackKey] === 'number') {
            return obj[fallbackKey];
        }
        return null;
    };

    // Determine sale and original prices
    // Priority: Variant prices -> Product top-level prices
    let salePrice, originalPrice, hasSale;
    
    if (variant) {
        // Use variant prices
        salePrice = getPrice(variant, 'salePrice', 'price');
        originalPrice = getPrice(variant, 'price', 'salePrice');
        // If both are null, try to get from product level
        if (salePrice === null && originalPrice === null) {
            salePrice = getPrice(product, 'salePrice', 'price');
            originalPrice = getPrice(product, 'price', 'salePrice');
        }
        // Check if there's a sale (salePrice exists, is different from price, and is less than price)
        hasSale = variant.salePrice !== null && 
                  variant.salePrice !== undefined && 
                  typeof variant.salePrice === 'number' &&
                  variant.price !== null &&
                  variant.price !== undefined &&
                  typeof variant.price === 'number' &&
                  variant.salePrice < variant.price;
    } else {
        // Use product-level prices
        salePrice = getPrice(product, 'salePrice', 'price');
        originalPrice = getPrice(product, 'price', 'salePrice');
        // Check if there's a sale
        hasSale = product.salePrice !== null && 
                  product.salePrice !== undefined && 
                  typeof product.salePrice === 'number' &&
                  product.price !== null &&
                  product.price !== undefined &&
                  typeof product.price === 'number' &&
                  product.salePrice < product.price;
    }

    // If salePrice is null but originalPrice exists, use originalPrice as salePrice
    if (salePrice === null && originalPrice !== null) {
        salePrice = originalPrice;
    }

    return {
        salePrice: salePrice !== null ? salePrice : null,
        originalPrice: originalPrice !== null ? originalPrice : null,
        hasSale: hasSale || false,
        discount: originalPrice !== null && salePrice !== null && originalPrice > 0 && salePrice < originalPrice
            ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
            : 0
    };
};
