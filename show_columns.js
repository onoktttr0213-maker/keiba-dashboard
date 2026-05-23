const fs = require('fs');
const iconv = require('iconv-lite');

const buffer = fs.readFileSync('C:\\Users\\onokt\\.gemini\\antigravity\\scratch\\keiba-dashboard\\public_test\\data\\当日.csv');
const content = iconv.decode(buffer, 'shift-jis');
const lines = content.split('\n');

console.log('=== All Column Headers ===\n');

const headers = lines[0].split(',');
headers.forEach((header, idx) => {
    const letter = String.fromCharCode(65 + idx);
    console.log(`${letter}列 (index ${idx}): ${header.trim()}`);
});

console.log('\n=== First Data Row ===\n');
if (lines.length > 1) {
    const cols = lines[1].split(',');
    cols.forEach((col, idx) => {
        const letter = String.fromCharCode(65 + idx);
        console.log(`${letter}列 (index ${idx}): ${col.trim()}`);
    });
}
