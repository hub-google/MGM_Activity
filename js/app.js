const SUPABASE_URL = "https://unapiwajmgqqtdkixaab.supabase.co";
const SUPABASE_KEY = "sb_publishable_L09XC4Tekm6cZaPTTczm3g_Aap-SOSy";

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
                const uuid = generateUUID();
                const now = new Date();
                const createdAt = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');

                await supabaseFetch('MGM', {
                    method: 'POST',
                    body: JSON.stringify({
                        space: space,
                        uuid: uuid,
                        name: name,
                        phone: phone,
                        created_at: createdAt,
                        click_count: 0
                    })
                });

                let basePath = window.location.pathname.replace('register.html', '');
                if(!basePath.endsWith('/')) basePath += '/';
                const origin = window.location.origin === "file://" || window.location.origin === "null" ? "https://hub-google.github.io" : window.location.origin;
                const link = `${origin}${basePath}index.html?ref=${uuid}`;
                
                document.getElementById('modal-generated-link').value = link;
                document.getElementById('link-modal').classList.remove('hidden');
                const oldContainer = document.getElementById('result-link-container');
                if (oldContainer) oldContainer.classList.add('hidden');
                
            } catch (error) {
                showToast('發生嚴重連線錯誤');
                console.error(error);
                let debugMsg = `【系統錯誤】\n\n錯誤訊息：${error.message}`;
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
                const data = await supabaseFetch(`MGM?phone=eq.${encodeURIComponent(phone)}`);
                if (data.length > 0) {
                    const userRow = data[0];
                    const allUsers = await supabaseFetch('MGM?select=phone,click_count&order=click_count.desc');
                    let rank = -1;
                    let rankCounter = 1;
                    let prevClicks = -1;
                    for (let i = 0; i < allUsers.length; i++) {
                        if (allUsers[i].click_count !== prevClicks) {
                            rankCounter = i + 1;
                            prevClicks = allUsers[i].click_count;
                        }
                        if (allUsers[i].phone === phone) {
                            rank = rankCounter;
                            break;
                        }
                    }

                    document.getElementById('stat-clicks').innerText = userRow.click_count;
                    document.getElementById('stat-rank').innerText = rank !== -1 ? rank : '-';
                    document.getElementById('query-result-container').classList.remove('hidden');
                    showToast('查詢成功！');
                } else {
                    showToast(`錯誤: 找不到此電話的報名紀錄`);
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
        const data = await supabaseFetch('MGM?select=name,click_count&order=click_count.desc&limit=10');
        const loading = document.getElementById('leaderboard-loading');
        const container = document.getElementById('leaderboard-container');
        
        if (loading) loading.classList.add('hidden');
        if (!container) return;

        if (data && data.length > 0) {
            let html = '';
            let rank = 1;
            let prevClicks = -1;
            
            data.forEach((row, index) => {
                if (row.click_count !== prevClicks) {
                    rank = index + 1;
                    prevClicks = row.click_count;
                }
                const rankClass = rank <= 3 ? `rank-${rank}` : '';
                const maskedName = maskName(row.name);
                
                html += `
                    <div class="leaderboard-item ${rankClass}">
                        <div class="rank-badge">${rank}</div>
                        <div class="leaderboard-name">${maskedName}</div>
                        <div class="leaderboard-clicks">${row.click_count} 點</div>
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
        // 使用 Supabase RPC 來進行原子化點擊加一，避免併發問題
        const result = await supabaseFetch('rpc/increment_click', {
            method: 'POST',
            body: JSON.stringify({ target_uuid: uuid })
        });
        
        // 如果找不到該 UUID，RPC 會回傳空陣列
        if (result && result.length > 0 && result[0].name) {
            const name = result[0].name;
            const msgElement = document.getElementById('referral-message');
            if(msgElement) {
                msgElement.innerText = `您已成功為【${name}】增加 1 點人氣！`;
                document.getElementById('referral-success').classList.remove('hidden');
            }
        } else {
            console.log("Click tracking failed or inactive");
        }
    } catch (error) {
        console.error("Failed to track click:", error);
    }
}

async function supabaseFetch(endpoint, options = {}) {
    if (!options.headers) options.headers = {};
    Object.assign(options.headers, {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    });
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || response.statusText);
    }
    return response.json();
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function maskName(name) {
    if (!name) return "";
    if (name.length <= 2) {
        return name.substring(0, 1) + "O";
    }
    return name.substring(0, 1) + "O" + name.substring(2);
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
