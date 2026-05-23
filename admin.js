// Admin Page JavaScript
// Password management and CSV upload functionality

const DEFAULT_PASSWORD = '0000';
const PASSWORD_KEY = 'keiba_admin_password';

// Initialize password if not set
if (!localStorage.getItem(PASSWORD_KEY)) {
    localStorage.setItem(PASSWORD_KEY, DEFAULT_PASSWORD);
}

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');
const logoutButton = document.getElementById('logout-button');



// Password Change Elements
const newPasswordInput = document.getElementById('new-password');
const changePasswordButton = document.getElementById('change-password-button');
const passwordChangeStatus = document.getElementById('password-change-status');

// Article Management Elements
const articleTitleInput = document.getElementById('article-title');
const articleCategoryInput = document.getElementById('article-category');
const articleThumbnailInput = document.getElementById('article-thumbnail');
const articleWordFileInput = document.getElementById('article-word-file');
const publishArticleButton = document.getElementById('publish-article-button');
const articleStatus = document.getElementById('article-status');

const ARTICLES_KEY = 'keibaArticles';

// Login functionality
function attemptLogin() {
    const enteredPassword = passwordInput.value;
    const storedPassword = localStorage.getItem(PASSWORD_KEY);

    if (enteredPassword === storedPassword) {
        // Successful login
        loginSection.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        passwordInput.value = '';

        // Load data preview
        loadDataPreview();
    } else {
        // Failed login
        errorMessage.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

loginButton.addEventListener('click', attemptLogin);

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        attemptLogin();
    }
});

// Only allow numbers in password input
passwordInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    adminDashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');
    passwordInput.value = '';
});

// Password change functionality
changePasswordButton.addEventListener('click', () => {
    const newPassword = newPasswordInput.value;

    if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
        showPasswordChangeStatus('4桁の数字を入力してください', 'error');
        return;
    }

    localStorage.setItem(PASSWORD_KEY, newPassword);
    newPasswordInput.value = '';
    showPasswordChangeStatus('パスワードを変更しました', 'success');
});

newPasswordInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

function showPasswordChangeStatus(message, type) {
    passwordChangeStatus.textContent = message;
    passwordChangeStatus.className = `mt-2 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    passwordChangeStatus.classList.remove('hidden');

    setTimeout(() => {
        passwordChangeStatus.classList.add('hidden');
    }, 3000);
}

// Article Publishing Functionality
publishArticleButton.addEventListener('click', async () => {
    const title = articleTitleInput.value.trim();
    const category = articleCategoryInput.value;
    const thumbnail = articleThumbnailInput.value.trim();
    const file = articleWordFileInput.files[0];

    if (!title || !file) {
        showArticleStatus('タイトルとWordファイルは必須です', 'error');
        return;
    }

    try {
        showArticleStatus('変換中...', 'info');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;

            // Convert Word to HTML using Mammoth
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            const htmlContent = result.value;

            // Create article object
            const article = {
                id: Date.now().toString(),
                title: title,
                category: category,
                date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '.'),
                thumbnail: thumbnail ? `assets/images/${thumbnail}` : 'assets/images/placeholder.png',
                excerpt: htmlContent.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
                content: htmlContent
            };

            // Save to localStorage
            const existingArticles = JSON.parse(localStorage.getItem(ARTICLES_KEY) || '[]');
            existingArticles.unshift(article);
            localStorage.setItem(ARTICLES_KEY, JSON.stringify(existingArticles));

            showArticleStatus('記事を公開しました！JSONをダウンロードして同期してください', 'success');

            // Clear inputs
            articleTitleInput.value = '';
            articleThumbnailInput.value = '';
            articleWordFileInput.value = '';
        };

        reader.readAsArrayBuffer(file);

    } catch (error) {
        console.error('Article publish error:', error);
        showArticleStatus('記事の公開に失敗しました', 'error');
    }
});

function showArticleStatus(message, type) {
    articleStatus.textContent = message;
    articleStatus.className = `mt-2 text-sm ${type === 'success' ? 'text-green-500' :
        type === 'error' ? 'text-red-500' : 'text-champagne-gold'
        }`;
    articleStatus.classList.remove('hidden');
}



// Cumulative CSV Upload Elements (renamed from balance)
const cumulativeUploadAdmin = document.getElementById('balance-upload-admin');
const resetCumulativeAdmin = document.getElementById('reset-balance-admin');
const uploadStatusCumulative = document.getElementById('upload-status-balance');
const lastUpdatedCumulative = document.getElementById('last-updated-balance');
const cumulativePreviewMonthly = document.getElementById('cumulative-preview-monthly');
const cumulativePreviewCumulative = document.getElementById('cumulative-preview-cumulative');

const CUMULATIVE_DATA_KEY = 'keibaCumulativeData';
const CUMULATIVE_LAST_UPDATED_KEY = 'keibaCumulativeLastUpdated';

// QR Code Upload Elements
const qrUploadAdmin = document.getElementById('qr-upload-admin');
const resetQRAdmin = document.getElementById('reset-qr-admin');
const uploadStatusQR = document.getElementById('upload-status-qr');
const lastUpdatedQR = document.getElementById('last-updated-qr');
const qrPreviewImage = document.getElementById('qr-preview-image');

const QR_CODE_KEY = 'keibaQRCodeImage';
const QR_CODE_LAST_UPDATED_KEY = 'keibaQRCodeLastUpdated';


// Weekend CSV Upload Elements
const weekendUploadAdmin = document.getElementById('weekend-upload-admin');
const resetWeekendAdmin = document.getElementById('reset-weekend-admin');
const uploadStatusWeekend = document.getElementById('upload-status-weekend');
const lastUpdatedWeekend = document.getElementById('last-updated-weekend');
const weekendPreviewPurchase = document.getElementById('weekend-preview-purchase');
const weekendPreviewPayout = document.getElementById('weekend-preview-payout');
const weekendPreviewBalance = document.getElementById('weekend-preview-balance');

const WEEKEND_DATA_KEY = 'keibaWeekendData';
const WEEKEND_LAST_UPDATED_KEY = 'keibaWeekendLastUpdated';

// Helper to read CSV file with Shift_JIS encoding
function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        // Keiba CSVs are typically Shift_JIS
        reader.readAsText(file, 'Shift_JIS');
    });
}

// NEW: Extract latest date data from cumulative CSV
function extractLatestDateData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return null;

    let latestDate = '';
    let latestDateRows = [];

    // Parse all rows and find the latest date
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);
        if (cols.length >= 20) {
            const dateStr = cols[8]?.trim().replace(/[\/\-]/g, ''); // I列: 日付

            if (dateStr && dateStr.length === 8) {
                if (dateStr > latestDate) {
                    latestDate = dateStr;
                    latestDateRows = [cols];
                } else if (dateStr === latestDate) {
                    latestDateRows.push(cols);
                }
            }
        }
    }

    if (!latestDate || latestDateRows.length === 0) {
        return null;
    }

    // Calculate totals for latest date
    let totalPurchase = 0;
    let totalPayout = 0;

    latestDateRows.forEach(cols => {
        const purchaseStr = cols[5]?.trim().replace(/[\"'¥,\+]/g, '');
        const payoutStr = cols[19]?.trim().replace(/[\"'¥,\+]/g, '');

        totalPurchase += parseInt(purchaseStr) || 0;
        totalPayout += parseInt(payoutStr) || 0;
    });

    const balance = totalPayout - totalPurchase;

    // Format date for display
    const year = latestDate.substring(0, 4);
    const month = latestDate.substring(4, 6);
    const day = latestDate.substring(6, 8);
    const period = `${year}/${month}/${day}`;

    return {
        totalPurchase,
        totalPayout,
        balance,
        period,
        rowCount: latestDateRows.length
    };
}

// Cumulative CSV Upload functionality
cumulativeUploadAdmin.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await readCSVFile(file);

        // 1. Calculate summary data (existing logic)
        const summaryData = parseCumulativeCSV(text);

        if (!summaryData) {
            showCumulativeUploadStatus('CSVファイルの解析に失敗しました', 'error');
            return;
        }

        // 2. Parse detailed race data for main dashboard
        const detailedData = parseDetailedRaceData(text);

        // 3. NEW: Extract latest date data for daily balance
        const latestDateData = extractLatestDateData(text);

        // Save Summary Data
        localStorage.setItem(CUMULATIVE_DATA_KEY, JSON.stringify(summaryData));

        // Save Detailed Data (for Total Balance / Win Rate on index.html)
        if (detailedData.length > 0) {
            localStorage.setItem('keibaRaceData', JSON.stringify(detailedData));
        }

        // NEW: Save latest date data as weekend/daily data
        if (latestDateData) {
            localStorage.setItem(WEEKEND_DATA_KEY, JSON.stringify(latestDateData));
            const now = new Date().toLocaleString('ja-JP');
            localStorage.setItem(WEEKEND_LAST_UPDATED_KEY, now);
        }

        const now = new Date().toLocaleString('ja-JP');
        localStorage.setItem(CUMULATIVE_LAST_UPDATED_KEY, now);
        // Also update the detailed data timestamp
        localStorage.setItem('keibaLastUpdated', now);

        const latestDateInfo = latestDateData ? ` (最新日付: ${latestDateData.period})` : '';
        showCumulativeUploadStatus(`✓ 累月データをアップロードしました${latestDateInfo}`, 'success');
        updateCumulativeLastUpdated(now);
        loadCumulativePreview();

    } catch (error) {
        console.error('Cumulative CSV parsing error:', error);
        showCumulativeUploadStatus('CSVファイルの読み込みに失敗しました', 'error');
    }

    // Reset file input
    e.target.value = '';
});

// Helper to parse detailed race data (mirrors logic in app.js)
function parseDetailedRaceData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const data = [];

    // Skip header row, process data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);

        // Skip if not enough columns
        if (values.length < 20) continue;

        const raceName = values[0]?.trim(); // A列: レース名
        // Normalize date: remove slashes/hyphens to ensure YYYYMMDD
        let date = values[8]?.trim().replace(/[\/\-]/g, '');
        const venue = values[11]?.trim();    // L列: 場名

        // Exclude rows without race name or date
        if (!raceName || !date) continue;

        // Parse amounts: remove quotes, commas, currency symbols
        const investmentStr = values[5]?.trim().replace(/["'¥,\+]/g, '');
        const payoutStr = values[19]?.trim().replace(/["'¥,\+]/g, '');

        const investment = parseInt(investmentStr) || 0;
        const payout = parseInt(payoutStr) || 0;
        const betType = values[14]?.trim() || '';             // O列: 式別

        data.push({
            raceName: raceName,
            date: date,
            venue: venue || '',
            betType: betType,
            investment: investment,
            payout: payout,
            hitStatus: values[17]?.trim() || '',  // R列: 的中/返還
            // Calculate balance for this individual record (needed for grouping in app.js)
            balance: payout - investment
        });
    }

    return groupByRaceNameForAdmin(data);
}

// Robust CSV Line Parser (Handles quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    // Clean quotes from results if present (basic cleanup)
    return result.map(val => val.trim().replace(/^"|"$/g, ''));
}

// Group data by race name (duplicate of app.js logic to ensure consistency)
function groupByRaceNameForAdmin(data) {
    const grouped = {};

    data.forEach(row => {
        const key = row.raceName;

        if (!grouped[key]) {
            grouped[key] = {
                raceName: row.raceName,
                date: row.date,
                venue: row.venue,
                totalInvestment: 0,
                totalPayout: 0,
                balance: 0,
                hitTypes: [],
                races: []
            };
        }

        grouped[key].totalInvestment += row.investment;
        grouped[key].totalPayout += row.payout;
        grouped[key].races.push(row);

        if (row.payout > 0 && row.betType && !grouped[key].hitTypes.includes(row.betType)) {
            grouped[key].hitTypes.push(row.betType);
        }
    });

    Object.values(grouped).forEach(race => {
        race.balance = race.totalPayout - race.totalInvestment;
    });

    return Object.values(grouped);
}

// Reset cumulative data functionality
resetCumulativeAdmin.addEventListener('click', () => {
    if (confirm('累月データをリセットしますか？この操作は取り消せません。')) {
        localStorage.removeItem(CUMULATIVE_DATA_KEY);
        localStorage.removeItem(CUMULATIVE_LAST_UPDATED_KEY);
        showCumulativeUploadStatus('累月データをリセットしました', 'success');
        updateCumulativeLastUpdated('デフォルトデータ');
        loadCumulativePreview();
    }
});

// JSON Export functionality (NEW)
const exportJsonButton = document.getElementById('export-json-button');
const exportStatus = document.getElementById('export-status');

exportJsonButton.addEventListener('click', () => {
    try {
        // Get data from localStorage
        const venueData = localStorage.getItem('keibaRaceData');
        const cumulativeData = localStorage.getItem(CUMULATIVE_DATA_KEY);
        const lastUpdated = localStorage.getItem('keibaLastUpdated') || new Date().toLocaleString('ja-JP');

        if (!venueData || !cumulativeData) {
            showExportStatus('❌ エラー: 累月CSVをアップロードしてからエクスポートしてください', 'error');
            return;
        }

        const articles = localStorage.getItem(ARTICLES_KEY);
        const adminMessage = localStorage.getItem('keibaAdminMessage');

        const fullData = {
            venueData: venueData ? JSON.parse(venueData) : [],
            cumulativeData: cumulativeData ? JSON.parse(cumulativeData) : {},
            articles: articles ? JSON.parse(articles) : [],
            adminMessage: adminMessage ? JSON.parse(adminMessage) : { text: '', updatedAt: '' },
            lastUpdated: lastUpdated
        };

        // Convert to JSON string with formatting
        const jsonString = JSON.stringify(fullData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'db.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showExportStatus('✓ db.jsonをダウンロードしました。public_test/data/db.jsonに上書き保存してください。', 'success');

    } catch (error) {
        console.error('JSON export error:', error);
        showExportStatus('❌ エラー: JSONのエクスポートに失敗しました', 'error');
    }
});

function showExportStatus(message, type) {
    exportStatus.textContent = message;
    exportStatus.className = `mt-4 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    exportStatus.classList.remove('hidden');

    setTimeout(() => {
        exportStatus.classList.add('hidden');
    }, 8000);
}


// Parse Cumulative CSV (same format as weekend CSV)
function parseCumulativeCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;

    let totalPurchase = 0;
    let totalPayout = 0;
    const monthlyData = new Map(); // YYYYMM -> {purchase, payout}

    // Get current year and month
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Process all data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);
        if (cols.length >= 20) {
            // Normalize date: remove slashes/hyphens
            let dateStr = cols[8]?.trim().replace(/[\/\-]/g, '');

            // Normalize amounts: remove quotes, commas, currency symbols
            const purchaseStr = cols[5]?.trim().replace(/["'¥,\+]/g, '');
            const payoutStr = cols[19]?.trim().replace(/["'¥,\+]/g, '');

            const purchase = parseInt(purchaseStr) || 0;
            const payout = parseInt(payoutStr) || 0;

            totalPurchase += purchase;
            totalPayout += payout;

            // Extract year-month for monthly calculation
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

    // Calculate monthly balance - use latest month if current month has no data
    let monthlyBalance = 0;
    let displayYearMonth = currentYearMonth;

    if (monthlyData.has(currentYearMonth)) {
        // Current month has data
        const currentMonthData = monthlyData.get(currentYearMonth);
        monthlyBalance = currentMonthData.payout - currentMonthData.purchase;
    } else if (monthlyData.size > 0) {
        // Use latest available month
        const sortedMonths = Array.from(monthlyData.keys()).sort().reverse();
        displayYearMonth = sortedMonths[0];
        const latestMonthData = monthlyData.get(displayYearMonth);
        monthlyBalance = latestMonthData.payout - latestMonthData.purchase;
    }

    // Calculate cumulative balance
    const cumulativeBalance = totalPayout - totalPurchase;

    return {
        monthlyBalance,
        cumulativeBalance,
        totalPurchase,
        totalPayout,
        currentYearMonth: displayYearMonth,  // Return the actual month being displayed
        monthlyData: Object.fromEntries(monthlyData)
    };
}

function showCumulativeUploadStatus(message, type) {
    uploadStatusCumulative.textContent = message;
    uploadStatusCumulative.className = `mt-4 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    uploadStatusCumulative.classList.remove('hidden');

    setTimeout(() => {
        uploadStatusCumulative.classList.add('hidden');
    }, 5000);
}

function updateCumulativeLastUpdated(timestamp) {
    lastUpdatedCumulative.textContent = `最終更新: ${timestamp}`;
}

function loadCumulativePreview() {
    const dataStr = localStorage.getItem(CUMULATIVE_DATA_KEY);

    if (!dataStr) {
        if (cumulativePreviewMonthly) cumulativePreviewMonthly.textContent = '¥0';
        if (cumulativePreviewCumulative) cumulativePreviewCumulative.textContent = '¥0';
        return;
    }

    try {
        const data = JSON.parse(dataStr);

        if (cumulativePreviewMonthly) {
            const sign = data.monthlyBalance >= 0 ? '+' : '';
            cumulativePreviewMonthly.textContent = `${sign}¥${data.monthlyBalance.toLocaleString()}`;
            cumulativePreviewMonthly.className = data.monthlyBalance >= 0 ? 'text-lg font-mono font-bold text-champagne-gold' : 'text-lg font-mono font-bold text-red-500';
        }
        if (cumulativePreviewCumulative) {
            const sign = data.cumulativeBalance >= 0 ? '+' : '';
            cumulativePreviewCumulative.textContent = `${sign}¥${data.cumulativeBalance.toLocaleString()}`;
            cumulativePreviewCumulative.className = data.cumulativeBalance >= 0 ? 'text-lg font-mono font-bold text-champagne-gold' : 'text-lg font-mono font-bold text-red-500';
        }

    } catch (error) {
        console.error('Error loading cumulative preview:', error);
    }
}

// QR Code Upload functionality
qrUploadAdmin.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showQRUploadStatus('画像ファイルを選択してください', 'error');
        return;
    }

    try {
        const reader = new FileReader();

        reader.onload = (event) => {
            const base64Image = event.target.result;

            // Save to localStorage
            localStorage.setItem(QR_CODE_KEY, base64Image);
            const now = new Date().toLocaleString('ja-JP');
            localStorage.setItem(QR_CODE_LAST_UPDATED_KEY, now);

            showQRUploadStatus('✓ QRコード画像をアップロードしました', 'success');
            updateQRLastUpdated(now);
            loadQRPreview();
        };

        reader.onerror = () => {
            showQRUploadStatus('画像の読み込みに失敗しました', 'error');
        };

        reader.readAsDataURL(file);

    } catch (error) {
        console.error('QR code upload error:', error);
        showQRUploadStatus('QRコードのアップロードに失敗しました', 'error');
    }

    // Reset file input
    e.target.value = '';
});

// Reset QR code functionality
resetQRAdmin.addEventListener('click', () => {
    if (confirm('QRコード画像をリセットしますか？この操作は取り消せません。')) {
        localStorage.removeItem(QR_CODE_KEY);
        localStorage.removeItem(QR_CODE_LAST_UPDATED_KEY);
        showQRUploadStatus('QRコード画像をリセットしました', 'success');
        updateQRLastUpdated('未設定');
        loadQRPreview();
    }
});

function showQRUploadStatus(message, type) {
    uploadStatusQR.textContent = message;
    uploadStatusQR.className = `mt-4 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    uploadStatusQR.classList.remove('hidden');

    setTimeout(() => {
        uploadStatusQR.classList.add('hidden');
    }, 3000);
}

function updateQRLastUpdated(dateStr) {
    if (lastUpdatedQR) {
        lastUpdatedQR.textContent = `最終更新: ${dateStr}`;
    }
}

function loadQRPreview() {
    try {
        const imageData = localStorage.getItem(QR_CODE_KEY);
        const placeholder = qrPreviewImage.nextElementSibling;

        if (imageData) {
            qrPreviewImage.src = imageData;
            qrPreviewImage.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
        } else {
            qrPreviewImage.src = '';
            qrPreviewImage.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading QR preview:', error);
    }
}


function showBalanceUploadStatus(message, type) {
    uploadStatusBalance.textContent = message;
    uploadStatusBalance.className = `mt-4 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    uploadStatusBalance.classList.remove('hidden');

    setTimeout(() => {
        uploadStatusBalance.classList.add('hidden');
    }, 5000);
}

function updateBalanceLastUpdated(timestamp) {
    lastUpdatedBalance.textContent = `最終更新: ${timestamp}`;
}

// ── Admin Message ──────────────────────────────────────────────
const ADMIN_MESSAGE_KEY = 'keibaAdminMessage';
const adminMessageInput = document.getElementById('admin-message-input');
const saveAdminMessageButton = document.getElementById('save-admin-message-button');
const adminMessageStatus = document.getElementById('admin-message-status');

function showAdminMessageStatus(message, type) {
    adminMessageStatus.textContent = message;
    adminMessageStatus.className = `text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    adminMessageStatus.classList.remove('hidden');
    setTimeout(() => {
        adminMessageStatus.classList.add('hidden');
    }, 3000);
}

if (saveAdminMessageButton) {
    saveAdminMessageButton.addEventListener('click', () => {
        const text = adminMessageInput ? adminMessageInput.value.trim() : '';
        const now = new Date().toLocaleDateString('ja-JP');
        const data = { text, updatedAt: now };
        localStorage.setItem(ADMIN_MESSAGE_KEY, JSON.stringify(data));
        showAdminMessageStatus('✓ 保存しました。db.jsonをエクスポートして反映してください。', 'success');
    });
}

// Initialize data on page load
document.addEventListener('DOMContentLoaded', () => {
    const cumulativeLastUpdated = localStorage.getItem(CUMULATIVE_LAST_UPDATED_KEY) || 'デフォルトデータ';
    updateCumulativeLastUpdated(cumulativeLastUpdated);
    loadCumulativePreview();

    const weekendLastUpdated = localStorage.getItem(WEEKEND_LAST_UPDATED_KEY) || 'デフォルトデータ';
    updateWeekendLastUpdated(weekendLastUpdated);
    loadWeekendPreview();

    // Restore saved admin message to textarea
    try {
        const savedMsg = localStorage.getItem(ADMIN_MESSAGE_KEY);
        if (savedMsg && adminMessageInput) {
            const parsed = JSON.parse(savedMsg);
            adminMessageInput.value = parsed.text || '';
        }
    } catch (e) { /* ignore */ }
});

// Weekend CSV Upload functionality
weekendUploadAdmin.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = parseWeekendCSV(text);

        if (!data) {
            showWeekendUploadStatus('CSVファイルの解析に失敗しました', 'error');
            return;
        }

        // Save to localStorage
        localStorage.setItem(WEEKEND_DATA_KEY, JSON.stringify(data));
        const now = new Date().toLocaleString('ja-JP');
        localStorage.setItem(WEEKEND_LAST_UPDATED_KEY, now);

        showWeekendUploadStatus(`✓ 週末収支データをアップロードしました`, 'success');
        updateWeekendLastUpdated(now);
        loadWeekendPreview();

    } catch (error) {
        console.error('Weekend CSV parsing error:', error);
        showWeekendUploadStatus('CSVファイルの読み込みに失敗しました', 'error');
    }

    // Reset file input
    e.target.value = '';
});

// Reset weekend data functionality
resetWeekendAdmin.addEventListener('click', () => {
    if (confirm('週末収支データをリセットしますか？この操作は取り消せません。')) {
        localStorage.removeItem(WEEKEND_DATA_KEY);
        localStorage.removeItem(WEEKEND_LAST_UPDATED_KEY);
        showWeekendUploadStatus('週末収支データをリセットしました', 'success');
        updateWeekendLastUpdated('デフォルトデータ');
        loadWeekendPreview();
    }
});

// Parse Weekend CSV (columns F and T)
function parseWeekendCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;

    let totalPurchase = 0;
    let totalPayout = 0;
    let rowCount = 0;
    let period = '';

    // Extract date from first data row for period
    if (lines.length > 1) {
        const firstRow = lines[1].split(',');
        if (firstRow.length >= 9) {
            const dateStr = firstRow[8]?.trim(); // I列: 日付
            if (dateStr && dateStr.length === 8) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                period = `${year}/${month}/${day}`;
            }
        }
    }

    // Process all data rows (UTF-8 encoding)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        if (cols.length >= 20) {
            // F列 (index 5): 購入金額
            // T列 (index 19): 払戻金額
            const purchase = parseInt(cols[5]?.trim()) || 0;
            const payout = parseInt(cols[19]?.trim()) || 0;

            totalPurchase += purchase;
            totalPayout += payout;
            rowCount++;
        }
    }

    const balance = totalPayout - totalPurchase;

    return {
        totalPurchase,
        totalPayout,
        balance,
        period: period || '直近の週末',
        rowCount
    };
}

function showWeekendUploadStatus(message, type) {
    uploadStatusWeekend.textContent = message;
    uploadStatusWeekend.className = `mt-4 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    uploadStatusWeekend.classList.remove('hidden');

    setTimeout(() => {
        uploadStatusWeekend.classList.add('hidden');
    }, 5000);
}

function updateWeekendLastUpdated(timestamp) {
    lastUpdatedWeekend.textContent = `最終更新: ${timestamp}`;
}

function loadWeekendPreview() {
    const dataStr = localStorage.getItem(WEEKEND_DATA_KEY);

    if (!dataStr) {
        if (weekendPreviewPurchase) weekendPreviewPurchase.textContent = '¥0';
        if (weekendPreviewPayout) weekendPreviewPayout.textContent = '¥0';
        if (weekendPreviewBalance) weekendPreviewBalance.textContent = '¥0';
        return;
    }

    try {
        const data = JSON.parse(dataStr);

        if (weekendPreviewPurchase) {
            weekendPreviewPurchase.textContent = `¥${data.totalPurchase.toLocaleString()}`;
        }
        if (weekendPreviewPayout) {
            weekendPreviewPayout.textContent = `¥${data.totalPayout.toLocaleString()}`;
        }
        if (weekendPreviewBalance) {
            const sign = data.balance >= 0 ? '+' : '';
            weekendPreviewBalance.textContent = `${sign}¥${data.balance.toLocaleString()}`;
            weekendPreviewBalance.className = data.balance >= 0 ? 'text-champagne-gold' : 'text-red-500';
        }

    } catch (error) {
        console.error('Error loading weekend preview:', error);
    }
}

function showUploadStatus(message, type) {
    uploadStatusAdmin.textContent = message;
    uploadStatusAdmin.className = `mt-4 text-sm ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    uploadStatusAdmin.classList.remove('hidden');

    setTimeout(() => {
        uploadStatusAdmin.classList.add('hidden');
    }, 5000);
}

function updateLastUpdated(timestamp) {
    lastUpdatedAdmin.textContent = `最終更新: ${timestamp}`;
}

// Parse CSV function (same as in app.js)
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        if (columns.length < 6) continue;

        const date = columns[0]?.trim();
        const race = columns[1]?.trim();
        const investmentStr = columns[2]?.trim();
        const payoutStr = columns[3]?.trim();

        // Parse investment (handle "/" notation)
        let investment = 0;
        if (investmentStr.includes('/')) {
            const parts = investmentStr.split('/').map(p => parseFloat(p.trim()));
            investment = parts.reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0);
        } else {
            investment = parseFloat(investmentStr) || 0;
        }

        const returnAmount = parseFloat(payoutStr) || 0;
        const balance = returnAmount - investment;
        const roi = investment > 0 ? (returnAmount / investment) * 100 : 0;

        data.push({
            date,
            race,
            investment,
            return: returnAmount,
            balance,
            roi
        });
    }

    return data;
}

// Load data preview
function loadDataPreview() {
    const dataStr = localStorage.getItem(DATA_KEY);
    const lastUpdated = localStorage.getItem(LAST_UPDATED_KEY) || 'デフォルトデータ';

    updateLastUpdated(lastUpdated);

    if (!dataStr) {
        adminTotalRaces.textContent = '0';
        adminTotalInvestment.textContent = '¥0';
        adminTotalPayout.textContent = '¥0';
        return;
    }

    try {
        const data = JSON.parse(dataStr);
        const totalRaces = data.length;
        const totalInvestment = data.reduce((sum, race) => sum + race.investment, 0);
        const totalPayout = data.reduce((sum, race) => sum + race.return, 0);

        adminTotalRaces.textContent = totalRaces.toLocaleString();
        adminTotalInvestment.textContent = `¥${totalInvestment.toLocaleString()}`;
        adminTotalPayout.textContent = `¥${totalPayout.toLocaleString()}`;

    } catch (error) {
        console.error('Error loading data preview:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Focus on password input
    passwordInput.focus();

    // Load QR code preview
    const qrLastUpdated = localStorage.getItem(QR_CODE_LAST_UPDATED_KEY);
    if (qrLastUpdated) {
        updateQRLastUpdated(qrLastUpdated);
    }
    loadQRPreview();
});
