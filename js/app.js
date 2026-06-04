const API_URL = "https://script.google.com/macros/s/AKfycbxtpNw4kOonP2Uh6Jg89LsHtHrqQUBqbbdZNO0DUBn67-GTi-MO3ECBHZnVx7e8UwFi/exec";

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "dark") {
        document.body.setAttribute("data-theme", "dark");
    } else if (currentTheme === "light") {
        document.body.removeAttribute("data-theme");
    } else if (prefersDarkScheme.matches) {
        document.body.setAttribute("data-theme", "dark");
    }

    // Toggle theme
    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute("data-theme") === "dark") {
            document.body.removeAttribute("data-theme");
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
                
                document.getElementById('result-link-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                showToast(`錯誤: ${res.message}`);
            }
        } catch (error) {
            showToast('系統發生錯誤，請稍後再試');
            console.error(error);
        } finally {
            setLoading(btn, false);
        }
    });

    // Copy Link functionality
    document.getElementById('btn-copy').addEventListener('click', () => {
        const linkInput = document.getElementById('generated-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(linkInput.value).then(() => {
            showToast('連結已複製！');
        }).catch(() => {
            showToast('複製失敗，請手動複製');
        });
    });

    // Query Form
    const queryForm = document.getElementById('query-form');
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
            showToast('系統發生錯誤，請稍後再試');
            console.error(error);
        } finally {
            setLoading(btn, false);
        }
    });
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
    if (API_URL === "YOUR_GAS_WEBAPP_URL_HERE") {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (payload.action === 'register') {
                    resolve({ success: true, uuid: 'demo-uuid-1234' });
                } else if (payload.action === 'query') {
                    resolve({ success: true, clicks: 99, rank: 1 });
                } else {
                    resolve({ success: true, name: '示範帳號' });
                }
            }, 1000);
            showToast('⚠ 目前為 DEMO 模式，請替換 API_URL');
        });
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
    });

    return await response.json();
}

function setLoading(btnElement, isLoading) {
    const spinner = btnElement.querySelector('.spinner');
    if (isLoading) {
        btnElement.disabled = true;
        spinner.classList.remove('hidden');
    } else {
        btnElement.disabled = false;
        spinner.classList.add('hidden');
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
