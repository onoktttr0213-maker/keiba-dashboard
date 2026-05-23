const fs = require('fs');
const iconv = require('iconv-lite');

const buffer = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\当日.csv');
const content = iconv.decode(buffer, 'shift-jis');
const lines = content.split('\n');

let totalPurchase = 0;
let totalPayout = 0;
let rowCount = 0;

console.log('=== Processing Data ===\n');

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    if (cols.length >= 20) {
        // F列 (index 5): 購入金額
        // T列 (index 19): 払戻金額
        const purchase = parseInt(cols[5]) || 0;
        const payout = parseInt(cols[19]) || 0;

        console.log(`Row ${i}: ${cols[0]} - Purchase=¥${purchase.toLocaleString()}, Payout=¥${payout.toLocaleString()}`);
        totalPurchase += purchase;
        totalPayout += payout;
        rowCount++;
    }
}

const balance = totalPayout - totalPurchase;

console.log('\n=== Weekend Balance Calculation ===');
console.log(`Total rows processed: ${rowCount}`);
console.log(`Total Purchase (F列): ¥${totalPurchase.toLocaleString()}`);
console.log(`Total Payout (T列): ¥${totalPayout.toLocaleString()}`);
console.log(`Balance (収支): ${balance >= 0 ? '+' : ''}¥${balance.toLocaleString()}`);
