// 請將下方的網址替換成您的 Google Apps Script 網頁應用程式網址 (Web App URL)
const API_URL = "https://script.google.com/macros/s/AKfycbxtpNw4kOonP2Uh6Jg89LsHtHrqQUBqbbdZNO0DUBn67-GTi-MO3ECBHZnVx7e8UwFi/exec"; 

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", currentTheme);

    // Toggle theme
    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute("data-theme") === "dark") {
            document.body.setAttribute("data-theme", "light");
            localStorage.setItem("theme", "light");
        } else {
            document.body.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        }
    });

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
            const name = document.getElementById('reg-name').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const btn = document.getElementById('btn-register');
            
            if (!name || !phone) {
                showToast('請填寫完整資訊');
                return;
            }

            setLoading(btn, true);

            try {
                const res = await fetchAPI({ action: 'register', name, phone });
                if (res.success) {
                    const link = `${window.location.origin}${window.location.pathname}?ref=${res.uuid}`;
                    document.getElementById('generated-link').value = link;
                    document.getElementById('result-link-container').classList.remove('hidden');
                    showToast('連結產生成功！');
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
});

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
