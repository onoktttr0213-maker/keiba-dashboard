const GAS_URL = 'https://script.google.com/macros/s/AKfycbxtW17OBpLXwSHcQSToIE6DnD1pS8mtVh1B5yHomfw86Ceh7k_tLFxxst9aFq9c3G5d/exec';

let raceData = [];
let venueData = [];
let chart = null;

// Parse investment amount
function parseInvestmentAmount(value) {
    if (!value) return 0;
    const str = value.toString().trim();
    if (str.includes('／') || str.includes('/')) {
        const parts = str.split(/[／\/]/);
        return parseInt(parts[1].trim()) || 0;
    }
    return parseInt(str) || 0;
}

// Parse GAS Results into detailed format
function parseGasResults(rows) {
    if (!rows || rows.length <= 1) return [];

    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length < 20) continue;

        const raceName = values[0]?.toString().trim();
        let date = values[8]?.toString().trim().replace(/[\/\-]/g, '');
        const venue = values[11]?.toString().trim();

        if (!raceName || !date) continue;

        const investmentStr = values[5]?.toString().trim().replace(/["'¥,\+]/g, '');
        const payoutStr = values[19]?.toString().trim().replace(/["'¥,\+]/g, '');

        const investment = parseInt(investmentStr) || 0;
        const payout = parseInt(payoutStr) || 0;
        const betType = values[14]?.toString().trim() || '';             

        data.push({
            raceName: raceName,
            date: date,
            venue: venue || '',
            betType: betType,
            investment: investment,
            payout: payout,
            hitStatus: values[17]?.toString().trim() || '',  
            balance: payout - investment
        });
    }
    return data;
}

// Group data by race name
function groupByRaceName(data) {
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

// Calculate hit status
function calculateHitStatus(payout, investment) {
    if (payout === 0) return 'none';
    if (payout >= investment) return 'normal';
    return 'minor';
}

// Parse Cumulative from GAS
function parseCumulativeFromGas(rows) {
    if (!rows || rows.length <= 1) return null;

    let totalPurchase = 0;
    let totalPayout = 0;
    const monthlyData = new Map();

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let latestDate = '';
    let latestDatePurchase = 0;
    let latestDatePayout = 0;

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < 20) continue;

        let dateStr = cols[8]?.toString().trim().replace(/[\/\-]/g, '');
        const purchaseStr = cols[5]?.toString().trim().replace(/["'¥,\+]/g, '');
        const payoutStr = cols[19]?.toString().trim().replace(/["'¥,\+]/g, '');

        const purchase = parseInt(purchaseStr) || 0;
        const payout = parseInt(payoutStr) || 0;

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
            
            if (dateStr > latestDate) {
                latestDate = dateStr;
                latestDatePurchase = purchase;
                latestDatePayout = payout;
            } else if (dateStr === latestDate) {
                latestDatePurchase += purchase;
                latestDatePayout += payout;
            }
        }
    }

    let monthlyBalance = 0;
    let displayYearMonth = currentYearMonth;

    if (monthlyData.has(currentYearMonth)) {
        const currentMonthData = monthlyData.get(currentYearMonth);
        monthlyBalance = currentMonthData.payout - currentMonthData.purchase;
    } else if (monthlyData.size > 0) {
        const sortedMonths = Array.from(monthlyData.keys()).sort().reverse();
        displayYearMonth = sortedMonths[0];
        const latestMonthData = monthlyData.get(displayYearMonth);
        monthlyBalance = latestMonthData.payout - latestMonthData.purchase;
    }

    const cumulativeBalance = totalPayout - totalPurchase;
    
    let weekendBalance = null;
    if (latestDate) {
        const year = latestDate.substring(0, 4);
        const month = latestDate.substring(4, 6);
        const day = latestDate.substring(6, 8);
        weekendBalance = {
            balance: latestDatePayout - latestDatePurchase,
            totalPurchase: latestDatePurchase,
            totalPayout: latestDatePayout,
            period: `${year}/${month}/${day}`
        };
    }

    localStorage.setItem('keibaCumulativeData', JSON.stringify({ currentYearMonth: displayYearMonth }));

    return {
        monthlyBalance,
        cumulativeBalance,
        weekendBalance
    };
}

// Update Balance Cards
function updateBalanceCards(weekendBalance, monthlyBalance, cumulativeBalance) {
    const weekendBalanceEl = document.getElementById('weekend-balance');
    const weekendPeriodEl = document.getElementById('weekend-period');
    if (weekendBalanceEl && weekendPeriodEl && weekendBalance) {
        const balance = weekendBalance.balance;
        const sign = balance >= 0 ? '+' : '-';
        weekendBalanceEl.textContent = `${sign}¥${Math.abs(balance).toLocaleString()}`;
        weekendBalanceEl.className = `text-4xl md:text-5xl font-mono font-black tracking-tighter mb-2 ${balance >= 0 ? 'text-champagne-gold' : 'text-red-500'}`;
        weekendPeriodEl.textContent = weekendBalance.period;
    }

    const monthlyBalanceEl = document.getElementById('monthly-balance');
    const monthlyPeriodEl = document.getElementById('monthly-period');
    if (monthlyBalanceEl && monthlyPeriodEl && monthlyBalance !== null) {
        const sign = monthlyBalance >= 0 ? '+' : '-';
        monthlyBalanceEl.textContent = `${sign}¥${Math.abs(monthlyBalance).toLocaleString()}`;
        monthlyBalanceEl.className = `text-2xl md:text-3xl font-mono font-bold tracking-tighter mb-2 ${monthlyBalance >= 0 ? 'text-champagne-gold' : 'text-red-500'}`;
        
        try {
            const displayYearMonth = JSON.parse(localStorage.getItem('keibaCumulativeData') || '{}').currentYearMonth;
            if (displayYearMonth && displayYearMonth.length === 6) {
                const year = displayYearMonth.substring(0, 4);
                const month = parseInt(displayYearMonth.substring(4, 6));
                monthlyPeriodEl.textContent = `${year}年${month}月`;
            }
        } catch (e) { }
    }

    const cumulativeBalanceEl = document.getElementById('cumulative-balance');
    if (cumulativeBalanceEl && cumulativeBalance !== null) {
        const sign = cumulativeBalance >= 0 ? '+' : '-';
        cumulativeBalanceEl.textContent = `${sign}¥${Math.abs(cumulativeBalance).toLocaleString()}`;
        cumulativeBalanceEl.className = `text-2xl md:text-3xl font-mono font-bold tracking-tighter mb-2 ${cumulativeBalance >= 0 ? 'text-champagne-gold' : 'text-red-500'}`;
    }
}

// Calculate Summary Stats
function calculateStats() {
    let totalInvestment = 0;
    let totalReturn = 0;
    let totalBalance = 0;
    let winningCount = 0;
    let totalCount = 0;

    if (venueData.length > 0) {
        venueData.forEach(venue => {
            totalInvestment += venue.totalInvestment;
            totalReturn += venue.totalPayout;
            totalBalance += venue.balance;
            if (venue.balance > 0) winningCount++;
            totalCount++;
        });
    }

    const totalROI = totalInvestment > 0 ? ((totalReturn / totalInvestment) * 100).toFixed(1) : 0;
    const winRate = totalCount > 0 ? ((winningCount / totalCount) * 100).toFixed(1) : 0;

    return { totalROI, totalBalance, winRate };
}

// Update Dashboard Stats
function updateDashboard() {
    const stats = calculateStats();
    animateValue('total-roi', 0, parseFloat(stats.totalROI), 1500, '%');
    animateValue('total-balance', 0, stats.totalBalance, 1500, '円', true);
    animateValue('win-rate', 0, parseFloat(stats.winRate), 1500, '%');

    const balanceElement = document.getElementById('total-balance');
    balanceElement.classList.remove('text-champagne-gold', 'text-red-500');
    if (stats.totalBalance > 0) {
        balanceElement.classList.add('text-champagne-gold');
    } else {
        balanceElement.classList.add('text-red-500');
    }
}

// Animate Number Counter
function animateValue(id, start, end, duration, suffix = '', isCurrency = false) {
    const element = document.getElementById(id);
    if (!element) return;
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        let displayValue = Math.floor(current);
        if (isCurrency) {
            displayValue = displayValue.toLocaleString('ja-JP');
            if (end > 0) displayValue = '+' + displayValue;
        } else {
            displayValue = displayValue.toFixed(1);
        }
        element.textContent = displayValue + suffix;
    }, 16);
}

// Render Race Cards
function renderVenueCards(filterWinningOnly = false) {
    let cardsContainer = document.getElementById('venue-cards-container');
    if (!cardsContainer) {
        const container = document.getElementById('race-table-body');
        if (!container) return;
        
        const parent = container.parentElement.parentElement;
        parent.innerHTML = `<div id="venue-cards-container" class="flex flex-nowrap gap-4 overflow-x-auto pb-8 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0"></div>`;
        cardsContainer = document.getElementById('venue-cards-container');
    } else {
        cardsContainer.innerHTML = '';
    }

    const reversedData = [...venueData].reverse();
    reversedData.forEach(race => {
        if (filterWinningOnly && race.balance <= 0) return;

        const hitStatus = calculateHitStatus(race.totalPayout, race.totalInvestment);
        const roi = race.totalInvestment > 0 ? ((race.totalPayout / race.totalInvestment) * 100).toFixed(0) : 0;
        const dateStr = race.date;
        const formattedDate = `${dateStr.substring(0, 4)}/${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`;

        let cardClass = 'venue-card flex-none w-[85%] md:w-[350px] snap-center';
        let statusIcon = '';
        let statusText = '';
        let statusClass = '';
        let hitTypesHTML = '';

        if (hitStatus === 'normal') {
            cardClass += ' hit-normal';
            statusIcon = '✓';
            statusClass = 'text-champagne-gold font-bold text-2xl';
            statusText = `+¥${race.balance.toLocaleString()} [${roi}%]`;
            hitTypesHTML = `<p class="text-sm text-champagne-gold mt-2">的中: ${race.hitTypes.join(', ')}</p>`;
        } else if (hitStatus === 'minor') {
            cardClass += ' hit-minor';
            statusIcon = '○';
            statusClass = 'text-silver font-normal text-xl opacity-70';
            statusText = `+¥${race.balance.toLocaleString()} [${roi}%]`;
            hitTypesHTML = `<p class="text-sm text-gray-400 mt-2 opacity-70">的中: ${race.hitTypes.join(', ')}</p>`;
        } else {
            cardClass += ' hit-none';
            statusIcon = '×';
            statusClass = 'text-gray-500 font-normal text-xl';
            statusText = `-¥${Math.abs(race.balance).toLocaleString()} [${roi}%]`;
            hitTypesHTML = '<p class="text-sm text-gray-600 mt-2">不的中</p>';
        }

        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-2xl font-serif-jp font-bold">${formattedDate}</h3>
                    <p class="text-3xl font-serif-jp font-black text-champagne-gold mt-1">${race.raceName}</p>
                    <p class="text-sm text-gray-400 mt-1">${race.venue || ''}</p>
                </div>
                <div class="text-4xl ${statusClass.split(' ')[0]}">${statusIcon}</div>
            </div>
            <div class="border-t border-gray-800 pt-4 mb-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-gray-500 mb-1">購入金額</p>
                        <p class="font-mono text-lg">¥${race.totalInvestment.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-gray-500 mb-1">払戻金額</p>
                        <p class="font-mono text-lg">¥${race.totalPayout.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-800 pt-4">
                <p class="text-gray-500 text-sm mb-2">収支</p>
                <p class="${statusClass}">${statusIcon} ${statusText}</p>
                ${hitTypesHTML}
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}

// Render Chart
function renderChart() {
    const ctx = document.getElementById('balanceChart')?.getContext('2d');
    if (!ctx) return;
    
    if (chart) chart.destroy();

    let labels = [];
    let cumulativeBalance = [];

    if (venueData.length > 0) {
        const sortedVenues = [...venueData].sort((a, b) => a.date.localeCompare(b.date));
        const dailyData = {};
        sortedVenues.forEach(venue => {
            const dateStr = venue.date;
            if (!dailyData[dateStr]) dailyData[dateStr] = { date: dateStr, balance: 0 };
            dailyData[dateStr].balance += venue.balance;
        });

        const dailyArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
        let cumulative = 0;
        dailyArray.forEach(day => {
            const dateStr = day.date;
            const month = dateStr.substring(4, 6);
            const dayNum = dateStr.substring(6, 8);
            cumulative += day.balance;
            labels.push(`${month}/${dayNum}`);
            cumulativeBalance.push(cumulative);
        });
    }

    const maxValue = Math.max(...cumulativeBalance, 0);
    const minValue = Math.min(...cumulativeBalance, 0);
    const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));
    const yAxisMax = maxAbsValue * 1.2;
    const yAxisMin = -maxAbsValue * 1.2;

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '累積収支',
                data: cumulativeBalance,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#D4AF37',
                pointBorderColor: '#000',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#000', titleColor: '#D4AF37', bodyColor: '#fff',
                    borderColor: '#D4AF37', borderWidth: 1, padding: 12, displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const sign = value >= 0 ? '+' : '';
                            return '累積: ' + sign + '¥' + value.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: { grid: { color: '#2a2a2a', drawBorder: false }, ticks: { color: '#666', maxRotation: 0, minRotation: 0 } },
                y: {
                    min: yAxisMin, max: yAxisMax,
                    grid: {
                        color: (context) => context.tick.value === 0 ? '#666' : '#2a2a2a',
                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1,
                        drawBorder: false
                    },
                    ticks: {
                        color: (context) => context.tick.value === 0 ? '#999' : '#666',
                        callback: function(value) {
                            return (value > 0 ? '+' : '') + '¥' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// Scroll Animations
function setupScrollAnimations() {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));
}

// Error Display
function showError() {
    const totalRoi = document.getElementById('total-roi');
    const totalBal = document.getElementById('total-balance');
    const winRate = document.getElementById('win-rate');
    
    if (totalRoi) totalRoi.textContent = 'ERROR';
    if (totalBal) totalBal.textContent = 'ERROR';
    if (winRate) winRate.textContent = 'ERROR';
}

// Main Load Function
async function loadGasData() {
    try {
        console.log('Fetching data from Google Sheets...');
        const cacheBuster = Date.now();
        const response = await fetch(`${GAS_URL}?t=${cacheBuster}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // 1. Process Results
        if (data.results && data.results.length > 0) {
            const rawData = parseGasResults(data.results);
            venueData = groupByRaceName(rawData);
            
            const balances = parseCumulativeFromGas(data.results);
            if (balances) {
                updateBalanceCards(balances.weekendBalance, balances.monthlyBalance, balances.cumulativeBalance);
            }
        }
        
        // 2. Process Settings
        if (data.settings) {
            if (data.settings.adminMessage) {
                const section = document.getElementById('admin-message-section');
                const textEl = document.getElementById('admin-message-text');
                if (section && textEl) {
                    textEl.textContent = data.settings.adminMessage;
                    section.classList.remove('hidden');
                }
            }
            
            if (data.settings.qrImageUrl) {
                const qrCodeImage = document.getElementById('qr-code-image');
                if (qrCodeImage) {
                    qrCodeImage.src = data.settings.qrImageUrl;
                    qrCodeImage.classList.remove('hidden');
                    const placeholder = qrCodeImage.parentElement?.querySelector('div');
                    if (placeholder) placeholder.classList.add('hidden');
                }
            }
        }

        // 3. Render Views
        updateDashboard();
        renderVenueCards();
        renderChart();
        
    } catch (error) {
        console.error('Data loading error:', error);
        showError();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGasData();
    setupScrollAnimations();
    const hero = document.getElementById('hero');
    if (hero) hero.classList.add('visible');

    const filterCheckbox = document.getElementById('filter-winning-only');
    if (filterCheckbox) {
        filterCheckbox.addEventListener('change', (e) => {
            renderVenueCards(e.target.checked);
        });
    }
});
