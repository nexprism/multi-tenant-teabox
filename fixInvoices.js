const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'uploads', 'invoices');

if (!fs.existsSync(dir)) {
    console.log('Directory not found:', dir);
    process.exit(0);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// The broken string variant 1 (without ./)
const broken1 = `src="logo.webp' width='70' height='70'%3E%3Ccircle cx='35' cy='35' r='33' fill='%234169e1' stroke='%23000' stroke-width='2'/%3E%3Ctext x='35' y='42' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3ELOGO%3C/text%3E%3C/svg%3E"`;
// The broken string variant 2 (with ./)
const broken2 = `src="./logo.webp' width='70' height='70'%3E%3Ccircle cx='35' cy='35' r='33' fill='%234169e1' stroke='%23000' stroke-width='2'/%3E%3Ctext x='35' y='42' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3ELOGO%3C/text%3E%3C/svg%3E"`;

const fixed = `src="/logo.webp" width="70" height="70"`;

let count = 0;

files.forEach(f => {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');
    let changed = false;

    if (content.includes(broken1)) {
        content = content.split(broken1).join(fixed);
        changed = true;
    }
    if (content.includes(broken2)) {
        content = content.split(broken2).join(fixed);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(p, content, 'utf8');
        console.log(`Fixed: ${f}`);
        count++;
    }
});

console.log(`Total files fixed: ${count}`);
