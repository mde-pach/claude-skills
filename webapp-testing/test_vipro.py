#!/usr/bin/env python3
"""
ViPro App Testing Script
Tests all main modules: Yum, Event, Market, CoVoit, CSE
"""

from playwright.sync_api import sync_playwright
import time
import os

# Test credentials
TEST_EMAIL = "admin@acme.com"
TEST_PASSWORD = "Admin123!"

def test_vipro_app():
    """Main test function for ViPro application"""

    bugs_found = []
    screenshots_dir = "/tmp/vipro-test-screenshots"
    os.makedirs(screenshots_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # Enable console logging to capture errors
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

        # Enable error tracking
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        try:
            print("=" * 80)
            print("VIPRO APP TESTING REPORT")
            print("=" * 80)
            print()

            # Step 1: Load homepage
            print("[1/10] Loading homepage...")
            page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
            page.screenshot(path=f'{screenshots_dir}/01_homepage.png', full_page=True)
            print(f"✓ Homepage loaded: {page.title()}")
            print(f"   URL: {page.url}")

            # Step 2: Login
            print("\n[2/10] Attempting login...")

            # Look for login form
            email_input = page.locator('input[type="email"], input[name="email"]').first
            password_input = page.locator('input[type="password"], input[name="password"]').first

            if email_input.count() == 0:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'Login Page',
                    'issue': 'Email input field not found',
                    'screenshot': f'{screenshots_dir}/01_homepage.png'
                })
                print("✗ ERROR: Email input not found")
            else:
                email_input.fill(TEST_EMAIL)
                print(f"   Filled email: {TEST_EMAIL}")

            if password_input.count() == 0:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'Login Page',
                    'issue': 'Password input field not found',
                    'screenshot': f'{screenshots_dir}/01_homepage.png'
                })
                print("✗ ERROR: Password input not found")
            else:
                password_input.fill(TEST_PASSWORD)
                print("   Filled password")

            # Find and click submit button
            submit_button = page.locator('button[type="submit"]').first
            if submit_button.count() > 0:
                page.screenshot(path=f'{screenshots_dir}/02_before_login.png', full_page=True)
                submit_button.click()
                page.wait_for_load_state('networkidle', timeout=10000)
                page.screenshot(path=f'{screenshots_dir}/03_after_login.png', full_page=True)
                print(f"✓ Login submitted")
                print(f"   Current URL: {page.url}")
            else:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'Login Page',
                    'issue': 'Submit button not found',
                    'screenshot': f'{screenshots_dir}/02_before_login.png'
                })
                print("✗ ERROR: Submit button not found")

            # Step 3: Check if logged in (dashboard visible)
            print("\n[3/10] Verifying login success...")
            time.sleep(2)  # Wait for potential redirects
            current_url = page.url

            if 'dashboard' in current_url or 'yum' in current_url or 'event' in current_url:
                print(f"✓ Login successful - redirected to: {current_url}")
            else:
                bugs_found.append({
                    'severity': 'CRITICAL',
                    'location': 'Authentication',
                    'issue': f'Login may have failed - unexpected URL: {current_url}',
                    'screenshot': f'{screenshots_dir}/03_after_login.png'
                })
                print(f"✗ WARNING: Unexpected URL after login: {current_url}")

            # Step 4: Test Yum Module
            print("\n[4/10] Testing Yum module...")
            try:
                # Try to navigate to Yum
                yum_link = page.locator('a[href*="yum"], nav >> text=/yum/i').first
                if yum_link.count() > 0:
                    yum_link.click()
                    page.wait_for_load_state('networkidle', timeout=10000)
                    page.screenshot(path=f'{screenshots_dir}/04_yum_module.png', full_page=True)
                    print(f"✓ Yum module loaded: {page.url}")
                else:
                    page.goto('http://localhost:3000/yum', wait_until='networkidle')
                    page.screenshot(path=f'{screenshots_dir}/04_yum_module.png', full_page=True)
                    print(f"✓ Yum module loaded directly: {page.url}")
            except Exception as e:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'Yum Module',
                    'issue': f'Failed to load: {str(e)}',
                    'screenshot': f'{screenshots_dir}/04_yum_module.png'
                })
                print(f"✗ ERROR in Yum module: {str(e)}")

            # Step 5: Test Event Module
            print("\n[5/10] Testing Event module...")
            try:
                event_link = page.locator('a[href*="event"], nav >> text=/event/i').first
                if event_link.count() > 0:
                    event_link.click()
                    page.wait_for_load_state('networkidle', timeout=10000)
                    page.screenshot(path=f'{screenshots_dir}/05_event_module.png', full_page=True)
                    print(f"✓ Event module loaded: {page.url}")
                else:
                    page.goto('http://localhost:3000/event', wait_until='networkidle')
                    page.screenshot(path=f'{screenshots_dir}/05_event_module.png', full_page=True)
                    print(f"✓ Event module loaded directly: {page.url}")
            except Exception as e:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'Event Module',
                    'issue': f'Failed to load: {str(e)}',
                    'screenshot': f'{screenshots_dir}/05_event_module.png'
                })
                print(f"✗ ERROR in Event module: {str(e)}")

            # Step 6: Test Market Module
            print("\n[6/10] Testing Market module...")
            try:
                market_link = page.locator('a[href*="market"], nav >> text=/market/i').first
                if market_link.count() > 0:
                    market_link.click()
                    page.wait_for_load_state('networkidle', timeout=10000)
                    page.screenshot(path=f'{screenshots_dir}/06_market_module.png', full_page=True)
                    print(f"✓ Market module loaded: {page.url}")
                else:
                    page.goto('http://localhost:3000/market', wait_until='networkidle')
                    page.screenshot(path=f'{screenshots_dir}/06_market_module.png', full_page=True)
                    print(f"✓ Market module loaded directly: {page.url}")
            except Exception as e:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'Market Module',
                    'issue': f'Failed to load: {str(e)}',
                    'screenshot': f'{screenshots_dir}/06_market_module.png'
                })
                print(f"✗ ERROR in Market module: {str(e)}")

            # Step 7: Test CoVoit Module
            print("\n[7/10] Testing CoVoit module...")
            try:
                covoit_link = page.locator('a[href*="covoit"], nav >> text=/covoit/i').first
                if covoit_link.count() > 0:
                    covoit_link.click()
                    page.wait_for_load_state('networkidle', timeout=10000)
                    page.screenshot(path=f'{screenshots_dir}/07_covoit_module.png', full_page=True)
                    print(f"✓ CoVoit module loaded: {page.url}")
                else:
                    page.goto('http://localhost:3000/covoit', wait_until='networkidle')
                    page.screenshot(path=f'{screenshots_dir}/07_covoit_module.png', full_page=True)
                    print(f"✓ CoVoit module loaded directly: {page.url}")
            except Exception as e:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'CoVoit Module',
                    'issue': f'Failed to load: {str(e)}',
                    'screenshot': f'{screenshots_dir}/07_covoit_module.png'
                })
                print(f"✗ ERROR in CoVoit module: {str(e)}")

            # Step 8: Test CSE Module
            print("\n[8/10] Testing CSE module...")
            try:
                cse_link = page.locator('a[href*="cse"], nav >> text=/cse/i').first
                if cse_link.count() > 0:
                    cse_link.click()
                    page.wait_for_load_state('networkidle', timeout=10000)
                    page.screenshot(path=f'{screenshots_dir}/08_cse_module.png', full_page=True)
                    print(f"✓ CSE module loaded: {page.url}")
                else:
                    page.goto('http://localhost:3000/cse', wait_until='networkidle')
                    page.screenshot(path=f'{screenshots_dir}/08_cse_module.png', full_page=True)
                    print(f"✓ CSE module loaded directly: {page.url}")
            except Exception as e:
                bugs_found.append({
                    'severity': 'HIGH',
                    'location': 'CSE Module',
                    'issue': f'Failed to load: {str(e)}',
                    'screenshot': f'{screenshots_dir}/08_cse_module.png'
                })
                print(f"✗ ERROR in CSE module: {str(e)}")

            # Step 9: Check for console errors
            print("\n[9/10] Analyzing console messages...")
            error_messages = [msg for msg in console_messages if '[error]' in msg.lower()]
            if error_messages:
                for err in error_messages:
                    bugs_found.append({
                        'severity': 'MEDIUM',
                        'location': 'Browser Console',
                        'issue': err,
                        'screenshot': 'See browser console'
                    })
                    print(f"   ✗ Console error: {err}")
            else:
                print("   ✓ No console errors detected")

            # Step 10: Check for page errors
            print("\n[10/10] Checking for JavaScript errors...")
            if page_errors:
                for err in page_errors:
                    bugs_found.append({
                        'severity': 'HIGH',
                        'location': 'JavaScript Runtime',
                        'issue': err,
                        'screenshot': 'N/A'
                    })
                    print(f"   ✗ Page error: {err}")
            else:
                print("   ✓ No JavaScript errors detected")

        except Exception as e:
            print(f"\n✗ FATAL ERROR during testing: {str(e)}")
            bugs_found.append({
                'severity': 'CRITICAL',
                'location': 'Test Execution',
                'issue': f'Test crashed: {str(e)}',
                'screenshot': 'N/A'
            })

        finally:
            browser.close()

        # Print summary report
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total bugs found: {len(bugs_found)}")
        print(f"Screenshots saved to: {screenshots_dir}")

        if bugs_found:
            print("\n" + "-" * 80)
            print("BUG REPORT")
            print("-" * 80)

            # Group by severity
            critical = [b for b in bugs_found if b['severity'] == 'CRITICAL']
            high = [b for b in bugs_found if b['severity'] == 'HIGH']
            medium = [b for b in bugs_found if b['severity'] == 'MEDIUM']

            if critical:
                print("\n🔴 CRITICAL ISSUES:")
                for i, bug in enumerate(critical, 1):
                    print(f"  {i}. [{bug['location']}] {bug['issue']}")
                    print(f"     Screenshot: {bug['screenshot']}")

            if high:
                print("\n🟠 HIGH PRIORITY ISSUES:")
                for i, bug in enumerate(high, 1):
                    print(f"  {i}. [{bug['location']}] {bug['issue']}")
                    print(f"     Screenshot: {bug['screenshot']}")

            if medium:
                print("\n🟡 MEDIUM PRIORITY ISSUES:")
                for i, bug in enumerate(medium, 1):
                    print(f"  {i}. [{bug['location']}] {bug['issue']}")
                    print(f"     Screenshot: {bug['screenshot']}")
        else:
            print("\n✅ No bugs detected! App is working well.")

        print("\n" + "=" * 80)
        return len(bugs_found)

if __name__ == "__main__":
    exit_code = test_vipro_app()
    exit(0 if exit_code == 0 else 1)
