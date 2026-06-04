const API_URL = "https://script.google.com/macros/s/AKfycbxtpNw4kOonP2Uh6Jg89LsHtHrqQUBqbbdZNO0DUBn67-GTi-MO3ECBHZnVx7e8UwFi/exec";

async function fetchAPI(payload) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("text/html") !== -1) {
        throw new Error("Returned HTML instead of JSON. Likely a permissions issue.");
    }

    return await response.json();
}

async function runTests() {
    console.log("=== Starting Automated Tests ===");
    let uuid = null;
    let testPhone = "0999" + Math.floor(Math.random() * 1000000);

    // Test 1: Register
    console.log(`[Test 1] Registering phone: ${testPhone}`);
    try {
        const regRes = await fetchAPI({ action: "register", name: "AutomationBot", phone: testPhone });
        if (regRes.success && regRes.uuid) {
            console.log("✅ Register PASS:", regRes.uuid);
            uuid = regRes.uuid;
        } else {
            console.error("❌ Register FAIL:", regRes);
            return;
        }
    } catch (e) {
        console.error("❌ Register CRASH:", e.message);
        return;
    }

    // Test 2: Click
    console.log(`[Test 2] Simulating click for UUID: ${uuid}`);
    try {
        const clickRes = await fetchAPI({ action: "click", uuid: uuid });
        if (clickRes.success) {
            console.log("✅ Click PASS");
        } else {
            console.error("❌ Click FAIL:", clickRes);
            return;
        }
    } catch (e) {
        console.error("❌ Click CRASH:", e.message);
        return;
    }

    // Test 3: Query
    console.log(`[Test 3] Querying phone: ${testPhone}`);
    try {
        const queryRes = await fetchAPI({ action: "query", phone: testPhone });
        if (queryRes.success && queryRes.clicks >= 1) {
            console.log("✅ Query PASS. Clicks:", queryRes.clicks, "Rank:", queryRes.rank);
        } else {
            console.error("❌ Query FAIL:", queryRes);
            return;
        }
    } catch (e) {
        console.error("❌ Query CRASH:", e.message);
        return;
    }

    console.log("=== ALL TESTS PASSED ===");
}

runTests();
