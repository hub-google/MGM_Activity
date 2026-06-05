from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    print("Navigating to register.html...")
    page.goto("https://hub-google.github.io/MGM_Activity/register.html", wait_until="networkidle")
    
    print("Filling form...")
    page.fill("#reg-name", "GUITester")
    page.fill("#reg-phone", "0912345678")
    
    print("Clicking submit...")
    page.click("#btn-register")
    
    print("Waiting for modal...")
    try:
        page.wait_for_selector("#link-modal:not(.hidden)", timeout=10000)
        print("Modal appeared successfully!")
        
        # Take a screenshot of the modal
        page.locator(".modal-content").screenshot(path="C:\\Users\\cyt18\\.gemini\\antigravity-ide\\brain\\c62e6837-ff59-4542-9601-33bcc65a315c\\proof.png")
        print("Screenshot saved to proof.png")
    except Exception as e:
        print("Modal did not appear:", e)
        page.screenshot(path="C:\\Users\\cyt18\\.gemini\\antigravity-ide\\brain\\c62e6837-ff59-4542-9601-33bcc65a315c\\error_proof.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
