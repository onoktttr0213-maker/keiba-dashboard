const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\累月.csv', 'utf8');
const lines = content.trim().split('\n');

let totalPurchase = 0;
let totalPayout = 0;
const monthlyData = new Map();

// Get current year and month
const now = new Date();
const currentYearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

console.log(`Current Year-Month: ${currentYearMonth}\n`);

// Process all data rows
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    if (cols.length >= 20) {
        const dateStr = cols[8]?.trim();
        const purchase = parseInt(cols[5]?.trim()) || 0;
        const payout = parseInt(cols[19]?.trim()) || 0;

        totalPurchase += purchase;
        totalPayout += payout;

        if (dateStr && dateStr.length === 8) {
            const yearMonth = dateStr.substring(0, 6);
            if (!monthlyData.has(yearMonth)) {
                monthlyData.set(yearMonth, { purchase: 0, payout: 0 });
            }
            const data = monthlyData.get(yearMonth);
            data.purchase += purchase;
            data.payout += payout;
        }
    }
}

// Calculate current month balance
let monthlyBalance = 0;
if (monthlyData.has(currentYearMonth)) {
    const currentMonthData = monthlyData.get(currentYearMonth);
    monthlyBalance = currentMonthData.payout - currentMonthData.purchase;
    console.log(`Current Month Data (${currentYearMonth}):`);
    console.log(`  Purchase: ¥${currentMonthData.purchase.toLocaleString()}`);
    console.log(`  Payout: ¥${currentMonthData.payout.toLocaleString()}`);
    console.log(`  Balance: ${monthlyBalance >= 0 ? '+' : ''}¥${monthlyBalance.toLocaleString()}`);
} else {
    console.log(`No data found for current month (${currentYearMonth})`);
}

// Calculate cumulative balance
const cumulativeBalance = totalPayout - totalPurchase;

console.log(`\nCumulative Total:`);
console.log(`  Total Purchase: ¥${totalPurchase.toLocaleString()}`);
console.log(`  Total Payout: ¥${totalPayout.toLocaleString()}`);
console.log(`  Cumulative Balance: ${cumulativeBalance >= 0 ? '+' : ''}¥${cumulativeBalance.toLocaleString()}`);

console.log(`\n=== Expected Output ===`);
console.log(`Monthly Balance (単月収支): ${monthlyBalance >= 0 ? '+' : ''}¥${monthlyBalance.toLocaleString()}`);
console.log(`Cumulative Balance (累月収支): ${cumulativeBalance >= 0 ? '+' : ''}¥${cumulativeBalance.toLocaleString()}`);
