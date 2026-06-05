// 請將下方的網址替換成您的 Google Apps Script 網頁應用程式網址 (Web App URL)
const API_URL = "https://script.google.com/macros/s/AKfycbxtpNw4kOonP2Uh6Jg89LsHtHrqQUBqbbdZNO0DUBn67-GTi-MO3ECBHZnVx7e8UwFi/exec"; 

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", currentTheme);

    // Toggle theme
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (document.body.getAttribute("data-theme") === "dark") {
                document.body.setAttribute("data-theme", "light");
                localStorage.setItem("theme", "light");
            } else {
                document.body.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
            }
        });
    }

    // Check URL for referral UUID
    const urlParams = new URLSearchParams(window.location.search);
    const refUuid = urlParams.get('ref');
    
    if (refUuid) {
        processClick(refUuid);
    }

    // Registration Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const space = document.getElementById('reg-space').value.trim();
            const name = document.getElementById('reg-name').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const btn = document.getElementById('btn-register');
            
            if (!space || !name || !phone) {
                showToast('請填寫完整資訊');
                return;
            }

            setLoading(btn, true);

            try {
                const res = await fetchAPI({ action: 'register', space, name, phone });
                if (res.success) {
                    let basePath = window.location.pathname.replace('register.html', '');
                    if(!basePath.endsWith('/')) basePath += '/';
                    // 確保若是本機開啟 (file://)，依舊能產生出 GitHub Pages 的連結
                    const origin = window.location.origin === "file://" || window.location.origin === "null" ? "https://hub-google.github.io" : window.location.origin;
                    const link = `${origin}${basePath}index.html?ref=${res.uuid}`;
                    
                    document.getElementById('modal-generated-link').value = link;
                    document.getElementById('link-modal').classList.remove('hidden');
                    // 隱藏行內的舊版提示
                    const oldContainer = document.getElementById('result-link-container');
                    if (oldContainer) oldContainer.classList.add('hidden');
                } else {
                    showToast(`錯誤: ${res.message}`);
                    alert(`錯誤: ${res.message}`);
                }
            } catch (error) {
                showToast('發生嚴重連線錯誤');
                console.error(error);
                let debugMsg = `【系統錯誤】\n\n錯誤訊息：${error.message}\n\n可能是以下原因：\n1. 如果您是直接點兩下打開網頁(file://)，請改用 GitHub Pages 網址測試，因為瀏覽器會阻擋本機端的跨域請求！\n2. 您的防毒軟體或擋廣告外掛可能阻擋了 Google Apps Script 的連線。\n\n請前往 GitHub Pages 測試：https://hub-google.github.io/MGM_Activity/index.html`;
                alert(debugMsg);
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // Modal Copy Link functionality
    const btnModalCopy = document.getElementById('modal-btn-copy');
    if (btnModalCopy) {
        btnModalCopy.addEventListener('click', () => {
            const linkInput = document.getElementById('modal-generated-link');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(linkInput.value).then(() => {
                showToast('連結已複製！');
                btnModalCopy.innerText = "已複製！";
                setTimeout(() => btnModalCopy.innerText = "複製", 2000);
            }).catch(() => {
                showToast('複製失敗，請手動複製');
            });
        });
    }

    // Modal Close functionality
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            document.getElementById('link-modal').classList.add('hidden');
        });
    }

    // Copy Link functionality
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const linkInput = document.getElementById('generated-link');
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(linkInput.value).then(() => {
                showToast('連結已複製！');
            }).catch(() => {
                showToast('複製失敗，請手動複製');
            });
        });
    }

    // Query Form
    const queryForm = document.getElementById('query-form');
    if (queryForm) {
        queryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('query-phone').value.trim();
            const btn = document.getElementById('btn-query');

            if (!phone) {
                showToast('請輸入電話號碼');
                return;
            }

            setLoading(btn, true);

            try {
                const res = await fetchAPI({ action: 'query', phone });
                if (res.success) {
                    document.getElementById('stat-clicks').innerText = res.clicks;
                    document.getElementById('stat-rank').innerText = res.rank;
                    document.getElementById('query-result-container').classList.remove('hidden');
                    showToast('查詢成功！');
                } else {
                    showToast(`錯誤: ${res.message}`);
                }
            } catch (error) {
                showToast(error.message || '系統發生錯誤，請稍後再試');
                console.error(error);
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // Load Leaderboard on page load if container exists
    if (document.getElementById('leaderboard-container')) {
        loadLeaderboard();
    }
});

async function loadLeaderboard() {
    try {
        const res = await fetchAPI({ action: 'leaderboard' });
        const loading = document.getElementById('leaderboard-loading');
        const container = document.getElementById('leaderboard-container');
        
        if (loading) loading.classList.add('hidden');
        if (!container) return;

        if (res.success && res.leaderboard && res.leaderboard.length > 0) {
            let html = '';
            res.leaderboard.forEach((item, index) => {
                const rankClass = item.rank <= 3 ? `rank-${item.rank}` : '';
                html += `
                    <div class="leaderboard-item ${rankClass}">
                        <div class="rank-badge">${item.rank}</div>
                        <div class="leaderboard-name">${item.name}</div>
                        <div class="leaderboard-clicks">${item.clicks} 點</div>
                    </div>
                `;
            });
            container.innerHTML = html;
            container.classList.remove('hidden');
        } else {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 10px;">目前尚無排行榜資料</div>';
            container.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Failed to load leaderboard:", error);
        const loading = document.getElementById('leaderboard-loading');
        if (loading) loading.innerHTML = '<div style="text-align: center; color: var(--accent-red); padding: 10px;">載入失敗，請稍後再試</div>';
    }
}

async function processClick(uuid) {
    try {
        const res = await fetchAPI({ action: 'click', uuid });
        if (res.success) {
            const msgElement = document.getElementById('referral-message');
            msgElement.innerText = `您已成功為【${res.name}】增加 1 點人氣！`;
            document.getElementById('referral-success').classList.remove('hidden');
        } else {
            console.log("Click tracking failed or inactive:", res.message);
        }
    } catch (error) {
        console.error("Failed to track click:", error);
    }
}

async function fetchAPI(payload) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
    });

    // Handle HTML error pages (e.g. Google Login redirect due to permission failure)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("text/html") !== -1) {
        throw new Error("API 權限錯誤：請確認是否已自行使用您的 Google 帳號部署 Apps Script，並更新 API_URL。");
    }

    return await response.json();
}

function setLoading(btnElement, isLoading) {
    const spinner = btnElement.querySelector('.spinner');
    if (isLoading) {
        btnElement.disabled = true;
        if(spinner) spinner.classList.remove('hidden');
    } else {
        btnElement.disabled = false;
        if(spinner) spinner.classList.add('hidden');
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3000);
}
