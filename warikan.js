// ---------- Storage & State ----------
const PROJECTS_KEY = "warikan-projects-v1";
const ACTIVE_PROJECT_KEY = "warikan-active-project-v1";

let projects = []; // { id, name, createdAt, state: { members, events, paidStatus } }
let activeProjectId = null;

let state = {
    members: [], // { id, name }
    events: [],  // { id, title, totalAmount, roundUnit, deductions: [], payerId, payerPaypayUrl, notes, participants: {}, adjustments: {} }
    paidStatus: {} // { memberId: boolean }
};

let activeTab = "members";
let newMemberName = "";
let copiedKey = null;
let isComposing = false; // IME入力中フラグ
let projectMenuOpen = false; // プロジェクトメニュー開閉

// ---------- Project Management ----------
function loadProjects() {
    try {
        const raw = localStorage.getItem(PROJECTS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            projects = Array.isArray(parsed) ? parsed : [];
        }
    } catch (e) {
        console.error("プロジェクト一覧の読み込みに失敗しました", e);
        projects = [];
    }
}

function saveProjects() {
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error("プロジェクト一覧の保存に失敗しました", e);
    }
}

function migrateOldData() {
    // 旧フォーマット(warikan-state-v1)からの移行
    const oldKey = "warikan-state-v1";
    const oldRaw = localStorage.getItem(oldKey);
    if (oldRaw && projects.length === 0) {
        try {
            const parsed = JSON.parse(oldRaw);
            const hasData = (Array.isArray(parsed.members) && parsed.members.length > 0) ||
                            (Array.isArray(parsed.events) && parsed.events.length > 0);
            if (hasData) {
                const proj = {
                    id: uid(),
                    name: "移行データ",
                    createdAt: new Date().toISOString(),
                    state: {
                        members: Array.isArray(parsed.members) ? parsed.members : [],
                        events: Array.isArray(parsed.events) ? parsed.events : [],
                        paidStatus: (parsed.paidStatus && typeof parsed.paidStatus === "object") ? parsed.paidStatus : {}
                    }
                };
                projects.push(proj);
                activeProjectId = proj.id;
                saveProjects();
                localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
            }
            localStorage.removeItem(oldKey);
        } catch (e) {
            // ignore
        }
    }
}

function createProject(name) {
    const proj = {
        id: uid(),
        name: name || `プロジェクト ${projects.length + 1}`,
        createdAt: new Date().toISOString(),
        state: { members: [], events: [], paidStatus: {} }
    };
    projects.push(proj);
    switchProject(proj.id);
    saveProjects();
    return proj;
}

function switchProject(projectId) {
    // 現在のプロジェクトを保存
    saveCurrentProjectState();
    
    activeProjectId = projectId;
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
        state.members = Array.isArray(proj.state.members) ? proj.state.members : [];
        state.events = Array.isArray(proj.state.events) ? proj.state.events : [];
        state.paidStatus = (proj.state.paidStatus && typeof proj.state.paidStatus === "object") ? proj.state.paidStatus : {};
    } else {
        state = { members: [], events: [], paidStatus: {} };
    }
    activeTab = "members";
    newMemberName = "";
    projectMenuOpen = false;
}

function saveCurrentProjectState() {
    if (!activeProjectId) return;
    const proj = projects.find(p => p.id === activeProjectId);
    if (proj) {
        proj.state = JSON.parse(JSON.stringify(state));
        saveProjects();
    }
}

function deleteProject(projectId) {
    projects = projects.filter(p => p.id !== projectId);
    saveProjects();
    if (activeProjectId === projectId) {
        if (projects.length > 0) {
            switchProject(projects[0].id);
        } else {
            activeProjectId = null;
            localStorage.removeItem(ACTIVE_PROJECT_KEY);
            state = { members: [], events: [], paidStatus: {} };
        }
    }
}

function renameProject(projectId, newName) {
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
        proj.name = newName;
        saveProjects();
    }
}

// Initialize App
function init() {
    loadProjects();
    migrateOldData();
    
    // アクティブプロジェクトを復元
    const savedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (savedActiveId && projects.find(p => p.id === savedActiveId)) {
        switchProject(savedActiveId);
    } else if (projects.length > 0) {
        switchProject(projects[0].id);
    }
    
    // Set up event listeners (delegation)
    setupEventListeners();
    
    // Initial Render
    render();
}

function saveState() {
    saveCurrentProjectState();
}

// ---------- Inline SVG Icons Generator ----------
function getIcon(name, extraClasses = "") {
    const icons = {
        users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        receipt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path><path d="M6 8h12"></path><path d="M6 12h12"></path><path d="M6 16h10"></path></svg>`,
        "clipboard-check": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"></path></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        minus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        "trash-2": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
        copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        "check-circle": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        "alert-circle": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
        folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        "folder-plus": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${extraClasses}"><polyline points="6 9 12 15 18 9"></polyline></svg>`
    };
    return icons[name] || "";
}

// ---------- Helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const yen = (n) => `¥${Math.round(n).toLocaleString()}`;

function roundTo(value, unit) {
    if (!unit || unit <= 1) return Math.round(value);
    return Math.round(value / unit) * unit;
}

// Copy text to clipboard with fallback
async function copyText(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        throw new Error("clipboard api unavailable");
    } catch (e) {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return ok;
        } catch (err) {
            return false;
        }
    }
}

// ---------- Math & Logic ----------
function calcEvent(event) {
    const totalDeduction = (event.deductions || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const splitAmount = Math.max(0, (Number(event.totalAmount) || 0) - totalDeduction);
    
    const participantIds = state.members
        .map((m) => m.id)
        .filter((id) => event.participants && event.participants[id]);
    
    const count = participantIds.length;
    const base = count > 0 ? splitAmount / count : 0;

    const payerId = participantIds.includes(event.payerId) ? event.payerId : null;

    const rows = participantIds
        .filter((id) => id !== payerId)
        .map((id) => {
            const adj = Number(event.adjustments ? event.adjustments[id] : 0) || 0;
            const raw = base + adj;
            const rounded = roundTo(raw, event.roundUnit);
            return { id, raw, rounded };
        });

    const targetTotal = payerId ? splitAmount - base : splitAmount;
    const collectedTotal = rows.reduce((s, r) => s + r.rounded, 0);
    const diff = targetTotal - collectedTotal;

    const perPerson = Object.fromEntries(rows.map((r) => [r.id, r.rounded]));
    if (payerId) perPerson[payerId] = 0;

    return { splitAmount, count, perPerson, payerId, targetTotal, collectedTotal, diff };
}

function finalTotals() {
    const totals = Object.fromEntries(state.members.map((m) => [m.id, 0]));
    state.events.forEach((ev) => {
        const { perPerson } = calcEvent(ev);
        Object.entries(perPerson).forEach(([id, amt]) => {
            totals[id] = (totals[id] || 0) + amt;
        });
    });
    return totals;
}

function memberBreakdown(memberId) {
    return state.events
        .filter((ev) => ev.participants && ev.participants[memberId])
        .map((ev) => {
            const c = calcEvent(ev);
            return {
                eventId: ev.id,
                eventTitle: ev.title,
                amount: c.perPerson[memberId] || 0,
                isPayer: c.payerId === memberId,
            };
        });
}

// ---------- Copy Actions ----------
async function triggerCopy(key, text) {
    const ok = await copyText(text);
    if (ok) {
        copiedKey = key;
        render();
        setTimeout(() => {
            copiedKey = null;
            render();
        }, 1500);
    } else {
        window.alert("コピーに失敗しました。長押しして手動でコピーしてください。");
    }
}

function copyResultText() {
    const totals = finalTotals();
    const lines = [];
    
    // Group by payer for PayPay links
    const payerUrls = {};
    state.events.forEach(ev => {
        if (ev.payerId && ev.payerPaypayUrl && ev.payerPaypayUrl.trim()) {
            const payer = state.members.find(m => m.id === ev.payerId);
            if (payer) payerUrls[payer.name] = ev.payerPaypayUrl.trim();
        }
    });
    
    state.members
        .filter((m) => totals[m.id] > 0)
        .forEach((m) => {
            lines.push(`${m.name}：${yen(totals[m.id])}`);
        });
    
    const parts = ["【最終支払額】", ...lines];
    
    // Add PayPay URLs
    const urlEntries = Object.entries(payerUrls);
    if (urlEntries.length > 0) {
        parts.push("");
        parts.push("💰 PayPay送金先:");
        urlEntries.forEach(([name, url]) => {
            parts.push(`${name}：${url}`);
        });
    }
    
    const text = parts.join("\n");
    triggerCopy("final", text);
}

function copyEventText(event) {
    const c = calcEvent(event);
    const payerMember = event.payerId ? state.members.find(m => m.id === event.payerId) : null;
    const lines = state.members
        .filter((m) => event.participants[m.id])
        .map((m) => {
            const isPayer = c.payerId === m.id;
            return `${m.name}：${isPayer ? "支払済（代表支払）" : yen(c.perPerson[m.id] || 0)}`;
        });
    const header = [`【${event.title}】`, `合計：${yen(event.totalAmount)}`];
    if (payerMember) header.push(`代表支払者：${payerMember.name}`);
    if (event.notes) header.push(`備考：${event.notes}`);
    if (event.payerPaypayUrl && event.payerPaypayUrl.trim()) {
        header.push(``);
        header.push(`💰 PayPay送金はこちら:`);
        header.push(event.payerPaypayUrl.trim());
    }
    const text = [...header, "", ...lines].join("\n");
    triggerCopy(`event-${event.id}`, text);
}

// ---------- Input → State 更新ヘルパー ----------
function updateStateFromInput(target, bind) {
    const parts = bind.split(".");
    const value = target.value;
    
    if (parts[0] === "newMemberName") {
        newMemberName = value;
    } else if (parts[0] === "event") {
        const eventId = target.getAttribute("data-event-id");
        const ev = state.events.find(x => x.id === eventId);
        if (ev) {
            if (parts[1] === "title") ev.title = value;
            if (parts[1] === "totalAmount") ev.totalAmount = value;
            if (parts[1] === "payerPaypayUrl") ev.payerPaypayUrl = value;
            if (parts[1] === "notes") ev.notes = value;
        }
    } else if (parts[0] === "deduction") {
        const eventId = target.getAttribute("data-event-id");
        const dedId = target.getAttribute("data-ded-id");
        const ev = state.events.find(x => x.id === eventId);
        if (ev && ev.deductions) {
            const d = ev.deductions.find(x => x.id === dedId);
            if (d) {
                if (parts[1] === "name") d.name = value;
                if (parts[1] === "amount") d.amount = value;
            }
        }
    } else if (parts[0] === "adjustment") {
        const eventId = target.getAttribute("data-event-id");
        const memberId = target.getAttribute("data-member-id");
        const ev = state.events.find(x => x.id === eventId);
        if (ev) {
            ev.adjustments[memberId] = Number(value) || 0;
        }
    }
}

// ---------- Event Listeners (Delegation) ----------
function setupEventListeners() {
    const app = document.getElementById("app-container");
    
    // IME入力の開始・終了を監視（日本語入力対応：ひらがな・漢字変換）
    app.addEventListener("compositionstart", () => {
        isComposing = true;
    });
    app.addEventListener("compositionend", (e) => {
        isComposing = false;
        // ブラウザごとのイベント発火順の違いに対応するため、
        // 次のティックまで再描画を遅延する
        // Chrome: compositionend → input の順（inputで再描画される）
        // Firefox: input → compositionend の順（ここで再描画が必要）
        const target = e.target;
        const bind = target.getAttribute("data-bind");
        if (bind) {
            setTimeout(() => {
                updateStateFromInput(target, bind);
                saveState();
                render(true);
            }, 0);
        }
    });

    // Input/Change updates state immediately
    app.addEventListener("input", (e) => {
        const target = e.target;
        const bind = target.getAttribute("data-bind");
        if (!bind) return;
        
        updateStateFromInput(target, bind);
        saveState();
        
        // IME入力中（ひらがな入力中・漢字変換候補選択中）は再描画しない
        // 再描画するとIMEの変換状態がリセットされて正しく入力できなくなる
        if (!isComposing && !e.isComposing) {
            render(true);
        }
    });

    app.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        
        const action = btn.getAttribute("data-action");
        
        // ----- Project Actions -----
        if (action === "create-project") {
            const name = prompt("プロジェクト名を入力してください", `プロジェクト ${projects.length + 1}`);
            if (name !== null && name.trim()) {
                createProject(name.trim());
                render();
            }
        }
        
        else if (action === "switch-project") {
            const projectId = btn.getAttribute("data-project-id");
            switchProject(projectId);
            render();
        }
        
        else if (action === "toggle-project-menu") {
            projectMenuOpen = !projectMenuOpen;
            render();
        }
        
        else if (action === "rename-project") {
            const projectId = btn.getAttribute("data-project-id");
            const proj = projects.find(p => p.id === projectId);
            if (proj) {
                const newName = prompt("新しいプロジェクト名を入力してください", proj.name);
                if (newName !== null && newName.trim()) {
                    renameProject(projectId, newName.trim());
                    render();
                }
            }
        }
        
        else if (action === "delete-project") {
            const projectId = btn.getAttribute("data-project-id");
            const proj = projects.find(p => p.id === projectId);
            if (proj && confirm(`「${proj.name}」を削除しますか？\nこの操作は取り消せません。`)) {
                deleteProject(projectId);
                render();
            }
        }
        
        // ----- Tab & Content Actions -----
        else if (action === "tab-click") {
            activeTab = btn.getAttribute("data-tab-key");
            render();
        } 
        
        else if (action === "add-member") {
            const name = newMemberName.trim();
            if (name) {
                state.members.push({ id: uid(), name });
                newMemberName = "";
                saveState();
                render();
            }
        } 
        
        else if (action === "remove-member") {
            const id = btn.getAttribute("data-member-id");
            state.members = state.members.filter(m => m.id !== id);
            // clean up participants and adjustments in all events
            state.events.forEach((ev) => {
                delete ev.participants[id];
                delete ev.adjustments[id];
            });
            saveState();
            render();
        } 
        
        else if (action === "add-event") {
            if (state.members.length === 0) return;
            const newEvent = {
                id: uid(),
                title: `${state.events.length + 1}次会`,
                totalAmount: 0,
                roundUnit: 100,
                deductions: [],
                payerId: null,
                payerPaypayUrl: "",
                notes: "",
                participants: Object.fromEntries(state.members.map((m) => [m.id, true])),
                adjustments: Object.fromEntries(state.members.map((m) => [m.id, 0])),
            };
            state.events.push(newEvent);
            activeTab = `event-${newEvent.id}`;
            saveState();
            render();
        } 
        
        else if (action === "remove-event") {
            const id = btn.getAttribute("data-event-id");
            if (confirm("この会を削除してもよろしいですか？")) {
                state.events = state.events.filter(e => e.id !== id);
                activeTab = "members";
                saveState();
                render();
            }
        } 
        
        else if (action === "set-round-unit") {
            const eventId = btn.getAttribute("data-event-id");
            const unit = Number(btn.getAttribute("data-unit"));
            const ev = state.events.find(x => x.id === eventId);
            if (ev) {
                ev.roundUnit = unit;
                saveState();
                render();
            }
        } 
        
        else if (action === "add-deduction") {
            const eventId = btn.getAttribute("data-event-id");
            const ev = state.events.find(x => x.id === eventId);
            if (ev) {
                if (!ev.deductions) ev.deductions = [];
                ev.deductions.push({ id: uid(), name: "", amount: 0 });
                saveState();
                render();
            }
        } 
        
        else if (action === "remove-deduction") {
            const eventId = btn.getAttribute("data-event-id");
            const dedId = btn.getAttribute("data-ded-id");
            const ev = state.events.find(x => x.id === eventId);
            if (ev && ev.deductions) {
                ev.deductions = ev.deductions.filter(d => d.id !== dedId);
                saveState();
                render();
            }
        } 
        
        else if (action === "toggle-participant") {
            const eventId = btn.getAttribute("data-event-id");
            const memberId = btn.getAttribute("data-member-id");
            const status = btn.getAttribute("data-status") === "true";
            const ev = state.events.find(x => x.id === eventId);
            if (ev) {
                ev.participants[memberId] = status;
                saveState();
                render();
            }
        } 
        
        else if (action === "toggle-payer") {
            const eventId = btn.getAttribute("data-event-id");
            const memberId = btn.getAttribute("data-member-id");
            const ev = state.events.find(x => x.id === eventId);
            if (ev) {
                ev.payerId = ev.payerId === memberId ? null : memberId;
                saveState();
                render();
            }
        } 
        
        else if (action === "bump-adjustment") {
            const eventId = btn.getAttribute("data-event-id");
            const memberId = btn.getAttribute("data-member-id");
            const delta = Number(btn.getAttribute("data-delta"));
            const ev = state.events.find(x => x.id === eventId);
            if (ev) {
                const cur = Number(ev.adjustments[memberId]) || 0;
                ev.adjustments[memberId] = cur + delta;
                saveState();
                render();
            }
        } 
        
        else if (action === "copy-event") {
            const eventId = btn.getAttribute("data-event-id");
            const ev = state.events.find(x => x.id === eventId);
            if (ev) copyEventText(ev);
        } 
        
        else if (action === "copy-final") {
            copyResultText();
        } 
        
        else if (action === "toggle-paid") {
            const memberId = btn.getAttribute("data-member-id");
            state.paidStatus[memberId] = !state.paidStatus[memberId];
            saveState();
            render();
        }
    });

    // Enter Key to blur input or add member
    // ※ IME変換中のEnter（漢字確定）やSpace（変換候補）は横取りしない
    app.addEventListener("keydown", (e) => {
        // IME変換中はすべてのキー操作をIMEに委ねる
        if (isComposing || e.isComposing) return;
        
        if (e.key === "Enter") {
            if (e.target.id === "new-member-input") {
                e.preventDefault();
                const addBtn = document.getElementById("add-member-btn");
                if (addBtn) addBtn.click();
            } else if (e.target.tagName === "INPUT") {
                e.target.blur();
            }
        }
    });
}

// ---------- Project Selector UI ----------
function renderProjectSelector() {
    const activeProj = projects.find(p => p.id === activeProjectId);
    const activeName = activeProj ? activeProj.name : "プロジェクト未選択";
    
    let html = `
    <div class="mb-6" style="position:relative">
        <!-- Project Header -->
        <div style="display:flex;align-items:center;gap:8px">
            <button data-action="toggle-project-menu"
                class="flex-1 flex items-center justify-between bg-dark-gray border border-gray-800 rounded-xl px-4 py-3 text-left transition-all hover:border-gray-700"
                style="min-height:48px">
                <span class="flex items-center gap-2">
                    ${getIcon("folder", "w-4 h-4 text-champagne-gold")}
                    <span class="text-white text-sm font-semibold">${activeName}</span>
                </span>
                <span class="text-gray-500 transition-transform ${projectMenuOpen ? 'rotate-180' : ''}" style="display:inline-block;${projectMenuOpen ? 'transform:rotate(180deg)' : ''}">
                    ${getIcon("chevron", "w-4 h-4")}
                </span>
            </button>
            <button data-action="create-project"
                class="bg-gradient-to-r from-champagne-gold to-silver text-black rounded-xl transition-all active:scale-[0.95] flex items-center justify-center"
                style="min-width:48px;min-height:48px"
                title="新規プロジェクト">
                ${getIcon("folder-plus", "w-5 h-5")}
            </button>
        </div>
    `;

    // Dropdown Panel
    if (projectMenuOpen) {
        html += `
        <div class="mt-2 bg-dark-gray border border-gray-800 rounded-xl overflow-hidden" style="position:absolute;left:0;right:0;z-index:50">
        `;
        
        if (projects.length === 0) {
            html += `
            <div class="px-4 py-6 text-center">
                <p class="text-gray-500 text-xs font-serif-jp">プロジェクトがありません</p>
            </div>
            `;
        } else {
            html += `<ul>`;
            projects.forEach(p => {
                const isActive = p.id === activeProjectId;
                const dateStr = new Date(p.createdAt).toLocaleDateString("ja-JP");
                const memberCount = Array.isArray(p.state.members) ? p.state.members.length : 0;
                const eventCount = Array.isArray(p.state.events) ? p.state.events.length : 0;
                
                html += `
                <li class="border-b border-gray-800/50 last:border-b-0">
                    <div style="display:flex;align-items:center;gap:0">
                        <button data-action="switch-project" data-project-id="${p.id}"
                            class="flex-1 text-left px-4 py-3 transition-colors ${isActive ? 'bg-champagne-gold/10' : 'hover:bg-gray-800/50'}"
                            style="min-height:48px">
                            <div class="flex items-center gap-2">
                                ${isActive ? getIcon("check", "w-3 h-3 text-champagne-gold") : '<span style="width:12px;height:12px;display:inline-block"></span>'}
                                <span class="${isActive ? 'text-champagne-gold font-bold' : 'text-gray-300'} text-sm">${p.name}</span>
                            </div>
                            <div class="ml-5 mt-0.5 text-gray-600 text-[10px]">
                                ${dateStr} ・ ${memberCount}人 ・ ${eventCount}次会
                            </div>
                        </button>
                        <button data-action="rename-project" data-project-id="${p.id}"
                            class="text-gray-600 hover:text-champagne-gold transition-colors px-2"
                            style="width:40px;height:48px;display:flex;align-items:center;justify-content:center"
                            title="名前変更">
                            ${getIcon("edit", "w-3.5 h-3.5")}
                        </button>
                        <button data-action="delete-project" data-project-id="${p.id}"
                            class="text-gray-600 hover:text-red-500 transition-colors px-2"
                            style="width:40px;height:48px;display:flex;align-items:center;justify-content:center"
                            title="削除">
                            ${getIcon("trash-2", "w-3.5 h-3.5")}
                        </button>
                    </div>
                </li>
                `;
            });
            html += `</ul>`;
        }
        
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

// ---------- UI Rendering ----------
function render(typing = false) {
    const container = document.getElementById("app-container");
    if (!container) return;
    
    // Save focus element and cursor selection before rendering
    const activeEl = document.activeElement;
    const focusId = activeEl ? activeEl.getAttribute("data-focus-id") : null;
    const selStart = activeEl && (activeEl.type === 'text' || activeEl.type === 'textarea') ? activeEl.selectionStart : null;
    const selEnd = activeEl && (activeEl.type === 'text' || activeEl.type === 'textarea') ? activeEl.selectionEnd : null;

    // Create the navigation tabs list
    const tabs = [
        { key: "members", label: "メンバー", icon: "users" },
        ...state.events.map((e) => ({ key: `event-${e.id}`, label: e.title, icon: "receipt" })),
        { key: "result", label: "結果", icon: "clipboard-check" }
    ];

    let html = "";

    // 0. Render Project Selector
    html += renderProjectSelector();

    // 1. Render Tab Bar (Horizontal Scrollable)
    if (activeProjectId) {
        html += `
        <nav class="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            ${tabs.map((t) => {
                const active = activeTab === t.key;
                return `
                <button data-action="tab-click" data-tab-key="${t.key}"
                    class="flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                        active
                            ? "bg-gradient-to-r from-champagne-gold to-silver border-champagne-gold text-black shadow-md shadow-champagne-gold/20"
                            : "bg-dark-gray border-gray-800/80 text-gray-400 hover:text-white hover:border-gray-700"
                    }">
                    ${getIcon(t.icon, "w-3.5 h-3.5")}
                    <span>${t.label}</span>
                </button>
                `;
            }).join("")}
        </nav>
        `;
    }

    // 2. Render active panel
    if (!activeProjectId) {
        html += `
        <div class="text-center py-16">
            <div class="text-gray-600 mb-4">${getIcon("folder", "w-12 h-12 mx-auto")}</div>
            <p class="text-gray-500 font-serif-jp text-sm mb-6">プロジェクトを作成して始めましょう</p>
            <button data-action="create-project"
                class="bg-gradient-to-r from-champagne-gold to-silver text-black font-bold rounded-xl px-8 py-3 text-sm transition-all active:scale-[0.98]"
                style="min-height:48px">
                ${getIcon("folder-plus", "w-4 h-4 inline-block mr-1")} 新規プロジェクト作成
            </button>
        </div>
        `;
    } else if (activeTab === "members") {
        html += renderMembersPanel();
    } else if (activeTab === "result") {
        html += renderResultPanel();
    } else if (activeTab.startsWith("event-")) {
        const eventId = activeTab.replace("event-", "");
        const ev = state.events.find(x => x.id === eventId);
        if (ev) {
            html += renderEventPanel(ev);
        } else {
            activeTab = "members";
            html += renderMembersPanel();
        }
    }

    container.innerHTML = html;
    
    // Restore focus and selection
    if (focusId) {
        const targetEl = container.querySelector(`[data-focus-id="${focusId}"]`);
        if (targetEl) {
            targetEl.focus();
            if (selStart !== null && selEnd !== null) {
                try {
                    targetEl.setSelectionRange(selStart, selEnd);
                } catch (e) {
                    // ignore if not support selection
                }
            }
        }
    }
}

// Members Panel Template
function renderMembersPanel() {
    let html = `
    <div class="space-y-6">
        <button data-action="add-event" ${state.members.length === 0 ? "disabled" : ""}
            class="w-full bg-gradient-to-r from-champagne-gold to-silver disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 text-black rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            style="min-height:48px">
            ${getIcon("receipt", "w-4 h-4")}
            <span>${state.events.length === 0 ? "1次会を作成" : `${state.events.length + 1}次会を作成`}</span>
        </button>
        ${state.members.length === 0 ? `
        <p class="text-gray-500 text-xs text-center -mt-3 font-serif-jp">
            ※先にメンバーを1人以上登録してください
        </p>
        ` : ""}

        <section class="visible glass-card p-5 rounded-2xl border border-champagne-gold/10">
            <h2 class="text-champagne-gold font-serif-jp font-bold text-sm mb-4 tracking-widest">メンバーを登録</h2>
            
            <div>
                <input id="new-member-input"
                    value="${newMemberName}"
                    data-bind="newMemberName"
                    data-focus-id="new-member-input"
                    placeholder="名前を入力"
                    autocomplete="off"
                    class="w-full bg-pure-black text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm outline-none border border-gray-800 focus:border-champagne-gold transition-colors"
                />
                <button id="add-member-btn" data-action="add-member"
                    class="w-full mt-2 bg-gradient-to-r from-champagne-gold to-silver text-black font-bold rounded-lg py-3 text-sm transition-all active:scale-[0.98]"
                    style="min-height:48px">
                    ＋ 追加する
                </button>
            </div>

            <ul class="mt-5 space-y-2">
                ${state.members.length === 0 ? `
                <li class="text-gray-600 text-xs py-8 text-center font-serif-jp">
                    登録されているメンバーはいません。名前を追加してください。
                </li>
                ` : state.members.map((m) => `
                <li class="flex items-center justify-between bg-pure-black border border-gray-900 rounded-lg px-4 py-3 transition-colors hover:border-gray-800">
                    <span class="text-gray-300 text-sm">${m.name}</span>
                    <button data-action="remove-member" data-member-id="${m.id}"
                        class="text-gray-600 hover:text-red-500 transition-colors"
                        style="width:32px;height:32px;display:flex;align-items:center;justify-content:center">
                        ${getIcon("trash-2", "w-4 h-4")}
                    </button>
                </li>
                `).join("")}
            </ul>
        </section>
    </div>
    `;
    return html;
}

// Event Panel Template
function renderEventPanel(event) {
    const calc = calcEvent(event);
    
    let html = `
    <div class="space-y-6">
        <!-- Event Settings -->
        <section class="visible glass-card p-5 rounded-2xl border border-champagne-gold/10">
            <div class="flex items-start justify-between mb-4 gap-4">
                <div class="flex-1 min-w-0">
                    <label class="text-gray-500 text-[10px] tracking-widest font-serif-jp">会の名前（タップして編集）</label>
                    <input
                        value="${event.title}"
                        data-bind="event.title"
                        data-event-id="${event.id}"
                        data-focus-id="event-title-${event.id}"
                        placeholder="例：歓迎会1次会"
                        class="block w-full bg-transparent text-white font-serif-jp font-bold text-xl outline-none border-b border-gray-800 focus:border-champagne-gold pb-1 mt-1 transition-colors"
                    />
                </div>
                <button data-action="remove-event" data-event-id="${event.id}"
                    class="text-gray-600 hover:text-red-500 transition-colors mt-5 p-1">
                    ${getIcon("trash-2", "w-5 h-5")}
                </button>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="text-gray-400 text-xs font-serif-jp">合計金額</label>
                    <div class="flex items-center gap-2 mt-1.5">
                        <span class="text-gray-600 font-mono text-lg">¥</span>
                        <input
                            type="number"
                            value="${event.totalAmount || ""}"
                            data-bind="event.totalAmount"
                            data-event-id="${event.id}"
                            data-focus-id="event-amount-${event.id}"
                            placeholder="32000"
                            class="flex-1 bg-pure-black text-white font-mono rounded-lg px-4 py-3 text-sm outline-none border border-gray-800 focus:border-champagne-gold transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label class="text-gray-400 text-xs font-serif-jp">端数処理単位</label>
                    <div class="flex gap-2 mt-1.5">
                        ${[1, 10, 100].map((u) => `
                        <button data-action="set-round-unit" data-event-id="${event.id}" data-unit="${u}"
                            class="flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                                event.roundUnit === u
                                    ? "bg-gradient-to-r from-champagne-gold to-silver border-champagne-gold text-black"
                                    : "bg-pure-black border-gray-800 text-gray-500 hover:text-white"
                            }">
                            ${u}円単位
                        </button>
                        `).join("")}
                    </div>
                </div>

                <div>
                    <label class="text-gray-400 text-xs font-serif-jp">備考</label>
                    <textarea
                        data-bind="event.notes"
                        data-event-id="${event.id}"
                        data-focus-id="event-notes-${event.id}"
                        placeholder="例：お店の名前、幹事メモなど（任意）"
                        rows="2"
                        class="w-full mt-1.5 bg-pure-black text-gray-300 placeholder-gray-600 rounded-lg px-4 py-3 text-xs outline-none border border-gray-800 focus:border-champagne-gold transition-colors resize-none"
                    >${event.notes || ""}</textarea>
                </div>

                <div>
                    <label class="text-gray-400 text-xs font-serif-jp flex items-center gap-1.5">
                        <span style="color:#ff0033">P</span>ayPay送金URL（代表支払者へのリンク）
                    </label>
                    <input
                        type="url"
                        value="${event.payerPaypayUrl || ""}"
                        data-bind="event.payerPaypayUrl"
                        data-event-id="${event.id}"
                        data-focus-id="event-paypay-${event.id}"
                        placeholder="https://qr.paypay.ne.jp/xxxx"
                        class="w-full mt-1.5 bg-pure-black text-gray-300 placeholder-gray-600 rounded-lg px-4 py-3 text-xs outline-none border border-gray-800 focus:border-champagne-gold transition-colors font-mono"
                    />
                    ${event.payerPaypayUrl && event.payerPaypayUrl.trim() ? `
                    <p class="mt-1 text-[10px] text-green-500 font-serif-jp">✓ PayPayリンク設定済み（明細コピーに含まれます）</p>
                    ` : `
                    <p class="mt-1 text-[10px] text-gray-600 font-serif-jp">※設定すると明細コピー時にリンクが含まれます</p>
                    `}
                </div>
            </div>
        </section>

        <!-- Deductions -->
        <section class="visible glass-card p-5 rounded-2xl border border-champagne-gold/10">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-champagne-gold font-serif-jp font-bold text-sm tracking-widest">差し引き対象</h3>
                <button data-action="add-deduction" data-event-id="${event.id}"
                    class="text-champagne-gold hover:text-silver text-xs flex items-center gap-1 font-semibold transition-colors">
                    ${getIcon("plus", "w-3.5 h-3.5")}
                    <span>追加</span>
                </button>
            </div>
            
            ${(!event.deductions || event.deductions.length === 0) ? `
            <p class="text-gray-500 text-xs py-4 text-center font-serif-jp">
                ※会社からの補助費や、特定役職者の個別負担金などがある場合に追加します
            </p>
            ` : `
            <div class="space-y-3.5">
                ${event.deductions.map((d) => `
                <div class="flex gap-2 items-center">
                    <input
                        value="${d.name}"
                        data-bind="deduction.name"
                        data-event-id="${event.id}"
                        data-ded-id="${d.id}"
                        data-focus-id="ded-name-${d.id}"
                        placeholder="名称（例：会社補助費）"
                        class="flex-1 bg-pure-black text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-xs outline-none border border-gray-800 focus:border-champagne-gold transition-colors"
                    />
                    <input
                        type="number"
                        value="${d.amount || ""}"
                        data-bind="deduction.amount"
                        data-event-id="${event.id}"
                        data-ded-id="${d.id}"
                        data-focus-id="ded-amount-${d.id}"
                        placeholder="金額"
                        class="w-24 bg-pure-black text-white font-mono rounded-lg px-3 py-2.5 text-xs outline-none border border-gray-800 focus:border-champagne-gold transition-colors"
                    />
                    <button data-action="remove-deduction" data-event-id="${event.id}" data-ded-id="${d.id}"
                        class="text-gray-600 hover:text-red-500 transition-colors p-1">
                        ${getIcon("trash-2", "w-4 h-4")}
                    </button>
                </div>
                `).join("")}
            </div>
            `}
            
            ${(event.deductions && event.deductions.length > 0) ? `
            <div class="mt-4 pt-3 border-t border-gray-900 flex justify-between items-center text-xs">
                <span class="text-gray-500 font-serif-jp">差引後の割当対象額</span>
                <span class="font-mono text-champagne-gold font-bold">${yen(calc.splitAmount)}</span>
            </div>
            ` : ""}
        </section>

        <!-- Participants -->
        <section class="visible glass-card p-5 rounded-2xl border border-champagne-gold/10">
            <h3 class="text-champagne-gold font-serif-jp font-bold text-sm tracking-widest mb-1">
                参加者（${calc.count}人）
            </h3>
            <p class="text-gray-500 text-[11px] font-serif-jp leading-relaxed mb-4">
                「参加/欠席」を切り替え。代表で一括支払した人は「★代表支払」を設定してください。
            </p>

            <!-- Difference Banner -->
            <div class="flex items-center justify-between rounded-xl px-4 py-3.5 mb-4 text-xs ${
                calc.diff === 0
                    ? "bg-[#2f9e5c]/10 border border-[#2f9e5c]/25 text-[#7ec98f]"
                    : "bg-[#e8b84b]/10 border border-[#e8b84b]/25 text-[#e8b84b]"
            }">
                <span class="flex items-center gap-1.5">
                    ${getIcon(calc.diff === 0 ? "check-circle" : "alert-circle", "w-4 h-4")}
                    <span class="font-serif-jp">
                        ${calc.diff === 0 ? "✓ 差額なし（合計金額と一致しています）" : `端数差額（未調整）：${calc.diff > 0 ? "+" : ""}${yen(calc.diff)}`}
                    </span>
                </span>
                ${calc.diff !== 0 ? `<span class="text-[9px] text-gray-500 font-serif-jp">個別調整で調整可</span>` : ""}
            </div>

            <div class="space-y-3">
                ${state.members.map((m) => {
                    const participating = !!(event.participants && event.participants[m.id]);
                    const isPayer = calc.payerId === m.id;
                    
                    return `
                    <div class="rounded-xl p-3 border border-gray-900/60 bg-pure-black/30 transition-all ${
                        participating ? "border-gray-800 bg-pure-black/70" : "opacity-40"
                    }">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-sm font-semibold truncate ${participating ? "text-white" : "text-gray-500"}">
                                ${m.name}
                                ${isPayer ? `<span class="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-champagne-gold/20 text-champagne-gold font-mono align-middle">★代表支払</span>` : ""}
                            </span>
                            
                            <!-- Participant toggle buttons -->
                            <div class="flex rounded-lg overflow-hidden border border-gray-800 shrink-0">
                                <button data-action="toggle-participant" data-event-id="${event.id}" data-member-id="${m.id}" data-status="true"
                                    class="px-3 py-1.5 text-xs font-semibold transition-all ${
                                        participating
                                            ? "bg-gradient-to-r from-champagne-gold to-silver text-black font-bold"
                                            : "bg-pure-black text-gray-600 hover:text-gray-400"
                                    }">
                                    参加
                                </button>
                                <button data-action="toggle-participant" data-event-id="${event.id}" data-member-id="${m.id}" data-status="false"
                                    class="px-3 py-1.5 text-xs font-semibold transition-all ${
                                        !participating
                                            ? "bg-gray-800 text-white font-bold"
                                            : "bg-pure-black text-gray-600 hover:text-gray-400"
                                    }">
                                    欠席
                                </button>
                            </div>
                        </div>

                        ${participating ? `
                        <div class="mt-3 pt-3 border-t border-dashed border-gray-900/60">
                            <div class="flex items-center justify-between text-xs">
                                <button data-action="toggle-payer" data-event-id="${event.id}" data-member-id="${m.id}"
                                    class="text-[10px] px-2 py-1.5 rounded-lg border transition-all ${
                                        isPayer
                                            ? "bg-champagne-gold/10 border-champagne-gold text-champagne-gold"
                                            : "bg-dark-gray border-gray-800 text-gray-400 hover:text-white"
                                    }">
                                    ${isPayer ? "代表支払を解除" : "代表支払者に設定"}
                                </button>
                                <span class="font-mono ${isPayer ? "text-champagne-gold font-semibold" : "text-gray-300"}">
                                    ${isPayer ? "請求なし（支払済）" : yen(calc.perPerson[m.id] || 0)}
                                </span>
                            </div>

                            ${!isPayer ? `
                            <!-- Individual Adjustments -->
                            <div class="flex items-center gap-1.5 mt-3 justify-end text-xs">
                                <span class="text-gray-500 text-[10px] font-serif-jp mr-auto">個別負担調整</span>
                                <button data-action="bump-adjustment" data-event-id="${event.id}" data-member-id="${m.id}" data-delta="-100"
                                    class="w-7 h-7 rounded-lg bg-dark-gray text-gray-400 border border-gray-800 flex items-center justify-center active:scale-95 transition-all">
                                    ${getIcon("minus", "w-3 h-3")}
                                </button>
                                <input
                                    type="number"
                                    value="${(event.adjustments && event.adjustments[m.id]) || 0}"
                                    data-bind="adjustment"
                                    data-event-id="${event.id}"
                                    data-member-id="${m.id}"
                                    data-focus-id="adj-${m.id}"
                                    placeholder="0"
                                    class="w-16 bg-pure-black text-center text-xs font-mono text-gray-300 py-1 border border-gray-900 rounded-md outline-none focus:border-champagne-gold transition-colors"
                                />
                                <button data-action="bump-adjustment" data-event-id="${event.id}" data-member-id="${m.id}" data-delta="100"
                                    class="w-7 h-7 rounded-lg bg-dark-gray text-gray-400 border border-gray-800 flex items-center justify-center active:scale-95 transition-all">
                                    ${getIcon("plus", "w-3 h-3")}
                                </button>
                            </div>
                            ` : ""}
                        </div>
                        ` : ""}
                    </div>
                    `;
                }).join("")}
            </div>
        </section>

        <!-- Copy Action -->
        <button data-action="copy-event" data-event-id="${event.id}"
            class="w-full bg-dark-gray hover:bg-gray-800/80 border border-gray-800 text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            ${copiedKey === `event-${event.id}` ? `
            ${getIcon("check", "w-4 h-4 text-[#7ec98f]")}
            <span class="text-[#7ec98f]">コピーしました</span>
            ` : `
            ${getIcon("copy", "w-4 h-4 text-champagne-gold")}
            <span>この会の明細をコピー</span>
            `}
        </button>
    </div>
    `;
    return html;
}

// Result Panel Template
function renderResultPanel() {
    if (state.events.length === 0) {
        return `
        <p class="text-gray-500 text-sm text-center py-16 font-serif-jp">
            作成されている会がありません。
        </p>
        `;
    }

    const totals = finalTotals();
    const membersWithAmount = state.members.filter((m) => (totals[m.id] || 0) > 0);

    let html = `
    <div class="space-y-6">
        <!-- Final Totals Card -->
        <section class="visible glass-card p-5 rounded-2xl border border-champagne-gold/20 relative overflow-hidden">
            <!-- Decorative Seal stamp effect -->
            <div class="absolute -right-4 -top-4 w-20 h-20 rounded-full border border-champagne-gold/30 flex items-center justify-center rotate-[-12deg] pointer-events-none">
                <span class="text-champagne-gold/30 text-[10px] font-bold tracking-widest">精算済</span>
            </div>

            <h2 class="text-champagne-gold font-serif-jp font-black text-base mb-4 tracking-widest">最終支払額</h2>
            
            <div class="space-y-2.5">
                ${membersWithAmount.map((m) => {
                    const isPaid = !!state.paidStatus[m.id];
                    return `
                    <div class="flex items-center justify-between border-b border-dashed border-gray-900 py-2.5">
                        <button data-action="toggle-paid" data-member-id="${m.id}" class="flex items-center gap-2.5 text-left">
                            <span class="w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isPaid
                                    ? "bg-gradient-to-r from-champagne-gold to-silver border-champagne-gold text-black"
                                    : "border-gray-700 bg-pure-black"
                            }">
                                ${isPaid ? `${getIcon("check", "w-3 h-3 text-black")}` : ""}
                            </span>
                            <span class="text-sm font-semibold ${isPaid ? "text-gray-500 line-through" : "text-gray-200"}">${m.name}</span>
                        </button>
                        <span class="font-mono text-sm font-bold ${isPaid ? "text-gray-500" : "text-white"}">${yen(totals[m.id])}</span>
                    </div>
                    `;
                }).join("")}

                ${membersWithAmount.length === 0 ? `
                <p class="text-gray-500 text-xs py-4 text-center font-serif-jp">まだ精算金額がありません</p>
                ` : ""}
            </div>
            
            ${membersWithAmount.length > 0 ? `
            <p class="text-gray-600 text-[10px] mt-3 font-serif-jp">
                ※メンバーの左のチェックボックスをONにすることで、精算完了チェックを記録できます。
            </p>
            ` : ""}
        </section>

        <!-- Copy Final Totals -->
        <button data-action="copy-final"
            class="w-full bg-gradient-to-r from-champagne-gold to-silver hover:scale-[1.01] text-black rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            ${copiedKey === "final" ? `
            ${getIcon("check", "w-4 h-4 text-black")}
            <span>コピーしました</span>
            ` : `
            ${getIcon("copy", "w-4 h-4 text-black")}
            <span>精算一覧をコピー（連絡用）</span>
            `}
        </button>

        <!-- Detail Breakdown by Event -->
        <section class="visible space-y-4">
            <h3 class="text-gray-500 text-xs font-mono tracking-widest px-1">会ごとの詳細明細</h3>
            
            ${state.events.map((ev) => {
                const c = calcEvent(ev);
                return `
                <div class="glass-card p-4 rounded-xl border border-gray-900 bg-pure-black/30">
                    <div class="flex items-baseline justify-between mb-3 border-b border-gray-900 pb-2">
                        <span class="text-gray-300 text-sm font-bold font-serif-jp">${ev.title}</span>
                        <span class="text-champagne-gold text-xs font-mono font-semibold">合計 ${yen(ev.totalAmount)}</span>
                    </div>

                    <div class="space-y-2">
                        ${state.members.filter((m) => ev.participants && ev.participants[m.id]).map((m) => {
                            const isPayer = c.payerId === m.id;
                            return `
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-gray-400">${m.name}</span>
                                <span class="font-mono ${isPayer ? "text-champagne-gold font-semibold" : "text-gray-500"}">
                                    ${isPayer ? "支払済 (代表支払)" : yen(c.perPerson[m.id] || 0)}
                                </span>
                            </div>
                            `;
                        }).join("")}
                    </div>

                    <div class="mt-4 pt-3 border-t border-gray-900 flex justify-end">
                        <button data-action="copy-event" data-event-id="${ev.id}"
                            class="text-[11px] text-champagne-gold hover:text-silver flex items-center gap-1 font-semibold transition-all">
                            ${getIcon(copiedKey === `event-${ev.id}` ? "check" : "copy", "w-3.5 h-3.5")}
                            <span>${copiedKey === `event-${ev.id}` ? "コピー完了" : "この会の明細をコピー"}</span>
                        </button>
                    </div>
                </div>
                `;
            }).join("")}
        </section>
    </div>
    `;
    return html;
}

// Start App on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
