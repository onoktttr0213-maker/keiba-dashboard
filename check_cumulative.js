const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\累月.csv', 'utf8');
const lines = content.split('\n');

console.log('=== 累月.csv Structure ===\n');
console.log(`Total lines: ${lines.length}\n`);

// Show headers
const headers = lines[0].split(',');
console.log('Headers:');
headers.forEach((header, idx) => {
    const letter = String.fromCharCode(65 + idx);
    console.log(`  ${letter}列 (index ${idx}): ${header.trim()}`);
});

console.log('\n=== Sample Data Rows ===\n');
for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 9) {
        const date = cols[8]?.trim(); // I列: 日付
        const purchase = cols[5]?.trim(); // F列: 購入金額
        const payout = cols[19]?.trim(); // T列: 払戻金額
        console.log(`Row ${i}: Date=${date}, Purchase=${purchase}, Payout=${payout}`);
    }
}

// Calculate monthly and cumulative balances
let totalPurchase = 0;
let totalPayout = 0;
const monthlyData = new Map(); // year-month -> {purchase, payout}

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    if (cols.length >= 20) {
        const dateStr = cols[8]?.trim(); // I列: 日付
        const purchase = parseInt(cols[5]?.trim()) || 0;
        const payout = parseInt(cols[19]?.trim()) || 0;

        totalPurchase += purchase;
        totalPayout += payout;

        // Extract year-month
        if (dateStr && dateStr.length === 8) {
            const yearMonth = dateStr.substring(0, 6); // YYYYMM
            if (!monthlyData.has(yearMonth)) {
                monthlyData.set(yearMonth, { purchase: 0, payout: 0 });
            }
            const data = monthlyData.get(yearMonth);
            data.purchase += purchase;
            data.payout += payout;
        }
    }
}

console.log('\n=== Monthly Breakdown ===');
for (const [yearMonth, data] of monthlyData) {
    const balance = data.payout - data.purchase;
    const year = yearMonth.substring(0, 4);
    const month = yearMonth.substring(4, 6);
    console.log(`${year}年${month}月: Purchase=¥${data.purchase.toLocaleString()}, Payout=¥${data.payout.toLocaleString()}, Balance=${balance >= 0 ? '+' : ''}¥${balance.toLocaleString()}`);
}

console.log('\n=== Cumulative Total ===');
const cumulativeBalance = totalPayout - totalPurchase;
console.log(`Total Purchase: ¥${totalPurchase.toLocaleString()}`);
console.log(`Total Payout: ¥${totalPayout.toLocaleString()}`);
console.log(`Cumulative Balance: ${cumulativeBalance >= 0 ? '+' : ''}¥${cumulativeBalance.toLocaleString()}`);
