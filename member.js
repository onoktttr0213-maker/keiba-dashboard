// Member Page JavaScript
// Password management and authentication

const DEFAULT_MEMBER_PASSWORD = 'sanwa1979';
const MEMBER_PASSWORD_KEY = 'keibaMemberPassword';
const MEMBER_LOGGED_IN_KEY = 'keibaMemberLoggedIn';

// Update password if it's the old default or not set
const currentStoredPassword = localStorage.getItem(MEMBER_PASSWORD_KEY);
if (!currentStoredPassword || currentStoredPassword === '0000') {
    localStorage.setItem(MEMBER_PASSWORD_KEY, DEFAULT_MEMBER_PASSWORD);
}

// DOM Elements
const loginSection = document.getElementById('login-section');
const memberContent = document.getElementById('member-content');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');
const logoutButton = document.getElementById('logout-button');

// Check if already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem(MEMBER_LOGGED_IN_KEY) === 'true';
    if (isLoggedIn) {
        showMemberContent();
    } else {
        showLoginScreen();
    }
}

// Login functionality
loginButton.addEventListener('click', () => {
    const enteredPassword = passwordInput.value;
    const storedPassword = localStorage.getItem(MEMBER_PASSWORD_KEY);

    if (enteredPassword === storedPassword) {
        // Login successful
        localStorage.setItem(MEMBER_LOGGED_IN_KEY, 'true');
        showMemberContent();
    } else {
        // Login failed
        showError('パスワードが正しくありません');
        passwordInput.value = '';
        passwordInput.focus();
    }
});

// Allow Enter key to login
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    localStorage.setItem(MEMBER_LOGGED_IN_KEY, 'false');
    showLoginScreen();
    passwordInput.value = '';
});

// Show member content
function showMemberContent() {
    loginSection.classList.add('hidden');
    memberContent.classList.remove('hidden');
    memberContent.style.opacity = '1';
    memberContent.style.transform = 'translateY(0)';
    errorMessage.classList.add('hidden');
}

// Show login screen
function showLoginScreen() {
    loginSection.classList.remove('hidden');
    loginSection.style.opacity = '1';
    loginSection.style.transform = 'translateY(0)';
    memberContent.classList.add('hidden');
    passwordInput.focus();
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');

    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    passwordInput.focus();

    // Load and render articles
    loadAndRenderArticles();

    // Category Tab Interaction
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.innerText;

            // Remove active state from all tabs
            categoryTabs.forEach(t => {
                t.classList.remove('active', 'text-champagne-gold', 'border-b-2', 'border-champagne-gold', 'font-bold');
                t.classList.add('text-gray-500');
            });

            // Add active state to clicked tab
            tab.classList.add('active', 'text-champagne-gold', 'border-b-2', 'border-champagne-gold', 'font-bold');
            tab.classList.remove('text-gray-500');

            // Render articles for the selected category
            renderArticles(category);
        });
    });
});

let allArticles = [];

async function loadAndRenderArticles() {
    try {
        // Try to load from db.json first (production/public)
        const response = await fetch('public_test/data/db.json');
        if (response.ok) {
            const data = await response.json();
            allArticles = data.articles || [];
        } else {
            // Fallback to localStorage (admin development)
            allArticles = JSON.parse(localStorage.getItem('keibaArticles') || '[]');
        }

        // If still no articles, use sample data for WOW effect
        if (allArticles.length === 0) {
            allArticles = getSampleArticles();
        }

        renderArticles('ホーム');
    } catch (e) {
        console.error('Error loading articles:', e);
        allArticles = getSampleArticles();
        renderArticles('ホーム');
    }
}

function renderArticles(category) {
    const feed = document.getElementById('article-feed');
    if (!feed) return;

    feed.innerHTML = '';

    const filtered = category === 'ホーム'
        ? allArticles
        : allArticles.filter(a => a.category === category);

    if (filtered.length === 0) {
        feed.innerHTML = `<div class="text-center py-20 text-gray-600">このカテゴリーに記事はまだありません。</div>`;
        return;
    }

    filtered.forEach(article => {
        const articleEl = document.createElement('article');
        articleEl.className = 'group cursor-pointer';
        articleEl.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8 items-start">
                <div class="w-full md:w-2/5 aspect-video overflow-hidden rounded-lg">
                    <img src="${article.thumbnail}" alt="${article.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100">
                </div>
                <div class="w-full md:w-3/5">
                    <div class="flex items-center gap-3 mb-3 text-xs font-mono text-gray-500">
                        <span>${article.date}</span>
                        <span class="px-2 py-0.5 border border-gray-800 rounded">${article.category}</span>
                    </div>
                    <h3 class="text-2xl font-serif-jp font-bold text-white mb-4 group-hover:text-champagne-gold transition-colors leading-tight">
                        ${article.title}
                    </h3>
                    <div class="text-gray-400 leading-relaxed mb-6 line-clamp-2">
                        ${article.excerpt}
                    </div>
                    <div class="flex items-center gap-4 text-gray-600">
                        <span class="flex items-center gap-1 text-xs"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> 0</span>
                        <span class="flex items-center gap-1 text-xs"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.15 15.011 3 13.593 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> 0</span>
                    </div>
                </div>
            </div>
        `;

        // Modal / Detailed View could be added here
        articleEl.addEventListener('click', () => {
            alert('記事の詳細は現在準備中です。アップロード機能のテスト用サンプルです。');
        });

        feed.appendChild(articleEl);
    });
}

function getSampleArticles() {
    return [
        {
            id: 'sample-1',
            title: '冬の京都競馬場、静止した時間のなかで見た「本気」',
            category: '観戦日記',
            date: '2026.02.20',
            thumbnail: 'assets/images/blog_thumbnail_watch_diary_1771595409912.png',
            excerpt: '今年最初の現地参戦。早朝の淀、まだ誰もいないパドックに漂う緊張感。雪混じりの風が吹き抜けるなか、馬たちの白い息と力強い足音が響く...'
        },
        {
            id: 'sample-2',
            title: 'フェブラリーステークス、荒れるダート戦を読み解く鍵',
            category: '予想・分析',
            date: '2026.02.18',
            thumbnail: 'assets/images/blog_thumbnail_forecast_1771595463127.png',
            excerpt: '砂の王者を決める一戦。今年のメンバー構成から導き出される「死角」と、爆発力のある伏兵の見極め方。展開予想から本命馬の絞り込みまで。'
        }
    ];
}
