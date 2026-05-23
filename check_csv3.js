const fs = require('fs');

// Read as buffer and try to detect encoding
const buffer = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\当日.csv');

console.log('=== File Info ===');
console.log(`File size: ${buffer.length} bytes`);
console.log(`First 20 bytes: ${Array.from(buffer.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
console.log('');

// Try UTF-8
console.log('=== Trying UTF-8 ===');
const contentUtf8 = buffer.toString('utf8');
const linesUtf8 = contentUtf8.split('\n').slice(0, 5);

linesUtf8.forEach((line, i) => {
    const cols = line.split(',');
    if (i === 0) {
        console.log(`Headers (${cols.length} columns):`);
        cols.slice(0, 21).forEach((col, idx) => {
            console.log(`  ${String.fromCharCode(65 + idx)}: ${col.trim()}`);
        });
    } else if (i === 1) {
        console.log(`\nRow 1 data:`);
        console.log(`  Col E (index 4): "${cols[4]}"`);
        console.log(`  Col T (index 19): "${cols[19]}"`);
    }
});

// Calculate totals from first 10 rows
console.log('\n=== Calculating totals from sample rows ===');
let totalPurchase = 0;
let totalPayout = 0;
let rowCount = 0;

const allLines = contentUtf8.split('\n');
for (let i = 1; i < Math.min(allLines.length, 20); i++) {
    const cols = allLines[i].split(',');
    if (cols.length >= 20 && cols[4] && cols[19]) {
        const purchase = parseInt(cols[4].trim()) || 0;
        const payout = parseInt(cols[19].trim()) || 0;

        if (purchase > 0 || payout > 0) {
            console.log(`Row ${i}: Purchase=${purchase}, Payout=${payout}`);
            totalPurchase += purchase;
            totalPayout += payout;
            rowCount++;
        }
    }
}

console.log(`\nTotal from ${rowCount} rows:`);
console.log(`  Total Purchase (E列): ¥${totalPurchase.toLocaleString()}`);
console.log(`  Total Payout (T列): ¥${totalPayout.toLocaleString()}`);
console.log(`  Balance: ¥${(totalPayout - totalPurchase).toLocaleString()}`);
