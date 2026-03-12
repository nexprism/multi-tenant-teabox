const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    quality: {
        webp: 80,
    },
    sizeLimits: {
        maxWidth: 1920,
        maxHeight: 1920,
    },
    formats: ['webp'],
};

// Top-level directories to optimize
const ROOT_DIRECTORIES = [
    'public/uploads',
    'public/images',
    'public/category-images',
    'public/category-thumbnails',
    'public/subcategory-images',
    'public/subcategory-thumbnails',
];

let totalSaved = 0;
let totalFiles = 0;
let totalOriginalSize = 0;
let totalNewSize = 0;

/**
 * Get all image files in a directory recursively
 */
function getImageFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        return fileList;
    }

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Recursive call
                getImageFiles(filePath, fileList);
            } else if (/\.(jpg|jpeg|png|jfif|avif)$/i.test(file)) {
                // Exclude already optimized .webp files from source list
                fileList.push(filePath);
            }
        } catch (e) {
            console.warn(`Skipping file ${filePath}: ${e.message}`);
        }
    });

    return fileList;
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (e) {
        return 0;
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath) {
    try {
        const originalSize = getFileSize(inputPath);
        totalOriginalSize += originalSize;

        // Get image metadata
        const metadata = await sharp(inputPath).metadata();

        // Determine if resize is needed
        let width = metadata.width;
        let height = metadata.height;

        if (width > CONFIG.sizeLimits.maxWidth || height > CONFIG.sizeLimits.maxHeight) {
            const ratio = Math.min(
                CONFIG.sizeLimits.maxWidth / width,
                CONFIG.sizeLimits.maxHeight / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Generate WebP version
        const ext = path.extname(inputPath);
        // Be careful not to replace extension if it's part of the filename but not the end
        const webpPath = inputPath.substring(0, inputPath.lastIndexOf('.')) + '.webp';

        // Skip if WebP already exists
        if (fs.existsSync(webpPath)) {
            // Optional: Check if source is newer than target, if so, re-generate
            // For now, we simply skip to save time unless forced
            const webpStat = fs.statSync(webpPath);
            const originalStat = fs.statSync(inputPath);

            if (webpStat.mtimeMs > originalStat.mtimeMs) {
                // console.log(`⏭️  Skipping (WebP exists): ${path.basename(inputPath)}`);
                return;
            }
        }

        // Process image
        let pipeline = sharp(inputPath);

        if (width !== metadata.width || height !== metadata.height) {
            pipeline = pipeline.resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        await pipeline
            .webp({ quality: CONFIG.quality.webp })
            .toFile(webpPath);

        const newSize = getFileSize(webpPath);
        totalNewSize += newSize;
        const saved = originalSize - newSize;
        totalSaved += saved;
        totalFiles++;

        const savingsPercent = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(1) : 0;

        console.log(
            `✅ ${path.basename(inputPath)} → ${path.basename(webpPath)} | ` +
            `${formatBytes(originalSize)} → ${formatBytes(newSize)} | ` +
            `Saved: ${formatBytes(saved)} (${savingsPercent}%)`
        );
    } catch (error) {
        console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    }
}

/**
 * Main optimization function
 */
async function optimizeAllImages() {
    console.log('🚀 Starting deep image optimization...\n');

    for (const dir of ROOT_DIRECTORIES) {
        // Only verify root dir exists, subdirs handled by recursive function
        if (!fs.existsSync(dir)) {
            console.log(`⚠️  Directory not found: ${dir}`);
            continue;
        }

        console.log(`\n📁 Scanning directory: ${dir}`);
        const imageFiles = getImageFiles(dir);

        console.log(`  Found ${imageFiles.length} images to process...`);

        for (const file of imageFiles) {
            await optimizeImage(file);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total files optimized: ${totalFiles}`);
    console.log(`Original size: ${formatBytes(totalOriginalSize)}`);
    console.log(`Final size: ${formatBytes(totalNewSize)}`);
    console.log(`Total saved: ${formatBytes(totalSaved)}`);
    console.log('='.repeat(80));
}

optimizeAllImages()
    .then(() => {
        console.log('🎉 All done!');
        process.exit(0); // Ensure process exits
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
