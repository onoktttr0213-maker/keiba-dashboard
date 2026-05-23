const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\当日.csv', 'utf8');
const lines = content.split('\n').slice(0, 5);

lines.forEach((line, i) => {
    const cols = line.split(',');
    console.log(`Row ${i}: ${cols.length} columns`);

    if (i === 0) {
        // Print all column headers
        cols.forEach((col, idx) => {
            const letter = String.fromCharCode(65 + idx);
            console.log(`  Col ${letter} (index ${idx}): ${col.trim()}`);
        });
    } else if (i === 1) {
        // Print specific columns for data row
        console.log(`  Col E (index 4, 購入金額): ${cols[4]}`);
        console.log(`  Col T (index 19, 払戻金額): ${cols[19]}`);
    }
});
