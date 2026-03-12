const fs = require('fs');
const path = require('path');

let filesUpdated = 0;
let totalReplacements = 0;

/**
 * Update image references in JSX/JS files to use WebP format
 */
function updateImageReferences(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip node_modules and .next directories
        if (stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                updateImageReferences(filePath);
            }
            return;
        }

        // Only process JSX, JS, TSX files
        if (!(file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx'))) {
            return;
        }

        try {
            let content = fs.readFileSync(filePath, 'utf-8');
            const originalContent = content;
            let replacementsInFile = 0;

            // Pattern 1: /uploads/filename.ext -> /uploads/filename.webp
            const uploadsPattern = /(['"`])\/uploads\/([^'"]+)\.(jpg|jpeg|png|jfif)(\1)/gi;
            content = content.replace(uploadsPattern, (match, quote, filename, ext) => {
                replacementsInFile++;
                return `${quote}/uploads/${filename}.webp${quote}`;
            });

            // Pattern 2: /images/filename.ext -> /images/filename.webp
            const imagesPattern = /(['"`])\/images\/([^'"]+)\.(jpg|jpeg|png|jfif)(\1)/gi;
            content = content.replace(imagesPattern, (match, quote, filename, ext) => {
                replacementsInFile++;
                return `${quote}/images/${filename}.webp${quote}`;
            });

            // Pattern 3: /category-images/filename.ext -> /category-images/filename.webp
            const categoryPattern = /(['"`])\/category-images\/([^'"]+)\.(jpg|jpeg|png|jfif)(\1)/gi;
            content = content.replace(categoryPattern, (match, quote, filename, ext) => {
                replacementsInFile++;
                return `${quote}/category-images/${filename}.webp${quote}`;
            });

            // Pattern 4: /category-thumbnails/filename.ext
            const categoryThumbsPattern = /(['"`])\/category-thumbnails\/([^'"]+)\.(jpg|jpeg|png|jfif)(\1)/gi;
            content = content.replace(categoryThumbsPattern, (match, quote, filename, ext) => {
                replacementsInFile++;
                return `${quote}/category-thumbnails/${filename}.webp${quote}`;
            });

            // Pattern 5: /subcategory-images/filename.ext
            const subcategoryPattern = /(['"`])\/subcategory-images\/([^'"]+)\.(jpg|jpeg|png|jfif)(\1)/gi;
            content = content.replace(subcategoryPattern, (match, quote, filename, ext) => {
                replacementsInFile++;
                return `${quote}/subcategory-images/${filename}.webp${quote}`;
            });

            // Pattern 6: /subcategory-thumbnails/filename.ext
            const subcategoryThumbsPattern = /(['"`])\/subcategory-thumbnails\/([^'"]+)\.(jpg|jpeg|png|jfif)(\1)/gi;
            content = content.replace(subcategoryThumbsPattern, (match, quote, filename, ext) => {
                replacementsInFile++;
                return `${quote}/subcategory-thumbnails/${filename}.webp${quote}`;
            });

            // Only write if changes were made
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf-8');
                filesUpdated++;
                totalReplacements += replacementsInFile;
                console.log(`✅ ${filePath.replace(process.cwd(), '.')}`);
                console.log(`   → ${replacementsInFile} image reference(s) updated to WebP\n`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
        }
    });
}

console.log('🚀 Starting image reference update to WebP format...\n');
console.log('📁 Scanning directories: src/, public/\n');
console.log('─'.repeat(80));

// Update references in src directory
updateImageReferences('./src');

console.log('─'.repeat(80));
console.log('\n📊 SUMMARY');
console.log('─'.repeat(80));
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('─'.repeat(80));

if (filesUpdated > 0) {
    console.log('\n✅ Image references updated successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the changes (check git diff)');
    console.log('   2. Test your application: npm run dev:bharat');
    console.log('   3. Rebuild for production: npm run build');
    console.log('   4. Test with Lighthouse again!\n');
} else {
    console.log('\n⚠️  No image references found to update.');
    console.log('   This could mean:');
    console.log('   - Images are already using WebP');
    console.log('   - Images are loaded dynamically from database');
    console.log('   - Check if images are in different directories\n');
}

console.log('🎉 Done!\n');
