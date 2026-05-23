const fs = require('fs');
const iconv = require('iconv-lite');

// Try reading as Shift-JIS first
try {
    const buffer = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\当日.csv');
    const content = iconv.decode(buffer, 'shift-jis');
    const lines = content.split('\n').slice(0, 10);

    console.log('=== CSV Structure (Shift-JIS) ===\n');

    lines.forEach((line, i) => {
        const cols = line.split(',');

        if (i === 0) {
            console.log('Headers:');
            cols.forEach((col, idx) => {
                const letter = String.fromCharCode(65 + idx);
                console.log(`  ${letter} (${idx}): ${col.trim()}`);
            });
            console.log('');
        } else if (i >= 1 && i <= 3) {
            console.log(`Row ${i}:`);
            console.log(`  E列 (購入金額, index 4): "${cols[4]}"`);
            console.log(`  T列 (払戻金額, index 19): "${cols[19]}"`);
        }
    });

    // Calculate totals
    let totalPurchase = 0;
    let totalPayout = 0;

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 20) {
            const purchase = parseInt(cols[4]) || 0;
            const payout = parseInt(cols[19]) || 0;
            totalPurchase += purchase;
            totalPayout += payout;
        }
    }

    console.log('\n=== Sample Calculation ===');
    console.log(`Total Purchase (E列): ${totalPurchase}`);
    console.log(`Total Payout (T列): ${totalPayout}`);
    console.log(`Balance: ${totalPayout - totalPurchase}`);

} catch (error) {
    console.error('Error:', error.message);
    console.log('\nTrying UTF-8...');

    const content = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\当日.csv', 'utf8');
    console.log('First 500 chars:', content.substring(0, 500));
}
