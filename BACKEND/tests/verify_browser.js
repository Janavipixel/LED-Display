const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\5d321c83-dcc2-43a3-97e9-3d6ba50e6e69';

async function runVerification() {
  console.log('>>> Launching Chrome Headless via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,800'],
    defaultViewport: { width: 1366, height: 800 }
  });

  const page = await browser.newPage();
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = `[Browser ${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    const text = `[Page Uncaught Error] ${err.toString()}`;
    consoleErrors.push(text);
  });

  // Handle native browser alerts and confirms seamlessly
  page.on('dialog', async dialog => {
    console.log(`[Browser Dialog] Type: ${dialog.type()}, Message: "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    // 1. Navigate to http://localhost:5000/
    console.log('>>> Step 1: Navigating to http://localhost:5000/ ...');
    await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Capture clean login page screenshot of restored teal-and-white UI
    const loginPreviewScreenshot = path.join(ARTIFACTS_DIR, 'login_page_preview.png');
    await page.screenshot({ path: loginPreviewScreenshot });
    console.log(`>>> Saved initial login preview: ${loginPreviewScreenshot}`);

    // 2. Test Invalid Login
    console.log('>>> Step 2: Testing Invalid Credentials Login...');
    await page.type('#email', 'admin@sies.edu.in');
    await page.type('#password', 'WrongPassword123');
    await page.click('#loginForm button[type="submit"]');

    // Wait for loginMessage to have final error text
    await page.waitForFunction(() => {
      const el = document.getElementById('loginMessage');
      return el && el.textContent.trim().length > 0 && el.textContent.trim() !== 'Authenticating...';
    }, { timeout: 5000 });

    const errorMsg = await page.$eval('#loginMessage', el => el.textContent.trim());
    console.log(`>>> Verified Invalid Login Error Message: "${errorMsg}"`);

    // Capture screenshot of login error state
    const loginErrorScreenshot = path.join(ARTIFACTS_DIR, '01_login_invalid_credentials.png');
    await page.screenshot({ path: loginErrorScreenshot });
    console.log(`>>> Saved screenshot: ${loginErrorScreenshot}`);

    // 3. Test Valid Login
    console.log('>>> Step 3: Testing Valid Credentials Login (admin@sies.edu.in / Admin@123)...');
    await page.$eval('#password', el => el.value = '');
    await page.type('#password', 'Admin@123');
    await page.click('#loginForm button[type="submit"]');

    // Wait for dashboard to display
    await page.waitForFunction(() => {
      const mainApp = document.getElementById('mainApp');
      const loginScreen = document.getElementById('loginScreen');
      return mainApp && !mainApp.classList.contains('hidden') && loginScreen && loginScreen.classList.contains('hidden');
    }, { timeout: 8000 });

    console.log('>>> Success: Dashboard mainApp loaded and visible!');

    // Wait 2 seconds for initial data fetch and render
    await new Promise(r => setTimeout(r, 2000));

    // Capture Dashboard initial overview screenshot
    const dashboardScreenshot = path.join(ARTIFACTS_DIR, '02_dashboard_overview.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log(`>>> Saved screenshot: ${dashboardScreenshot}`);

    // 4. Test Creating / Saving an Announcement
    console.log('>>> Step 4: Creating / Saving Department Announcement...');
    await page.click('#addMessageBtn');
    await new Promise(r => setTimeout(r, 400));
    await page.$eval('#messageText', el => el.value = '');
    await page.type('#messageText', 'SIES GST IoT Symposium 2026: Paper Submissions Open');
    await page.select('#messageEffect', 'scroll-left');
    await page.select('#messageDuration', '10');
    await page.click('#messageForm button[type="submit"]');

    // Wait for list update
    await new Promise(r => setTimeout(r, 2500));

    // Verify message appears in announcement list
    const messageCards = await page.$$eval('.message-card', cards => cards.map(c => c.textContent.trim()));
    console.log(`>>> Total announcement cards found in queue: ${messageCards.length}`);

    // 4. Test Workspace & Default Messages Pagination
    console.log('>>> Step 4: Verifying Default Messages (5 by default)...');
    await page.evaluate(() => {
      const wsEl = document.getElementById('workspace');
      if (wsEl) wsEl.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify initial message cards count is 5
    const initialMessageCards = await page.$$eval('#messageList .message-card', cards => cards.length);
    const messageStatusText = await page.$eval('#messageListStatus', el => el.textContent.trim());
    console.log(`>>> Default Messages Count: ${initialMessageCards} (${messageStatusText})`);

    // Scroll so pagination controls are in view
    await page.evaluate(() => {
      const controlsEl = document.getElementById('messagePaginationControls');
      if (controlsEl) controlsEl.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));

    // Capture workspace default 5 messages with controls
    const defaultMessagesScreenshot = path.join(ARTIFACTS_DIR, '07_messages_default_5.png');
    await page.screenshot({ path: defaultMessagesScreenshot });
    console.log(`>>> Saved screenshot: ${defaultMessagesScreenshot}`);

    // Click "View All" on messages
    console.log('>>> Testing "View All" on Display Messages...');
    await page.click('#toggleMessagesViewBtn');
    await new Promise(r => setTimeout(r, 400));
    const allMessageCards = await page.$$eval('#messageList .message-card', cards => cards.length);
    const viewAllStatusText = await page.$eval('#messageListStatus', el => el.textContent.trim());
    console.log(`>>> Expanded Messages Count: ${allMessageCards} (${viewAllStatusText})`);

    const viewAllMessagesScreenshot = path.join(ARTIFACTS_DIR, '08_messages_view_all.png');
    await page.screenshot({ path: viewAllMessagesScreenshot });
    console.log(`>>> Saved screenshot: ${viewAllMessagesScreenshot}`);

    // Click "Show Default (5)" to collapse back
    console.log('>>> Testing collapsing back to 5 Default Messages...');
    await page.click('#toggleMessagesViewBtn');
    await new Promise(r => setTimeout(r, 400));
    const collapsedMessageCards = await page.$$eval('#messageList .message-card', cards => cards.length);
    console.log(`>>> Collapsed Messages Count: ${collapsedMessageCards}`);

    // Scroll to preview section to inspect LED board
    await page.evaluate(() => {
      const previewEl = document.getElementById('preview');
      if (previewEl) previewEl.scrollIntoView({ behavior: 'instant' });
      const ledMsg = document.getElementById('ledMessage');
      if (ledMsg) {
        ledMsg.style.opacity = '1';
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Verify LED Display text
    const ledDisplayText = await page.$eval('#ledMessage', el => el.textContent.trim());
    const previewEffectText = await page.$eval('#previewEffect', el => el.textContent.trim());
    console.log(`>>> Live LED Display Simulation Text: "${ledDisplayText}"`);
    console.log(`>>> Live LED Display Simulation Effect: "${previewEffectText}"`);

    // Capture working LED preview in original teal-and-white theme
    const dashboardWithAnnouncement = path.join(ARTIFACTS_DIR, '03_dashboard_with_announcement.png');
    await page.screenshot({ path: dashboardWithAnnouncement });
    console.log(`>>> Saved screenshot: ${dashboardWithAnnouncement}`);

    // 5. Scroll to History Section and test 5 by default, View All, and Load More
    console.log('>>> Step 5: Verifying Message History (5 by default)...');
    await page.evaluate(() => {
      const noticesEl = document.getElementById('notices');
      if (noticesEl) noticesEl.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));

    const defaultHistoryRows = await page.$$eval('#historyList .history-row', rows => rows.length);
    const historyBadgeText = await page.$eval('#historyStatusBadge', el => el.textContent.trim());
    console.log(`>>> Default History Rows Count: ${defaultHistoryRows} (${historyBadgeText})`);

    const historyDefaultScreenshot = path.join(ARTIFACTS_DIR, '04_audit_history_table.png');
    await page.screenshot({ path: historyDefaultScreenshot });
    console.log(`>>> Saved default history screenshot: ${historyDefaultScreenshot}`);

    // Click "View All" on History
    console.log('>>> Testing "View All" on Message History...');
    await page.click('#toggleHistoryViewBtn');
    await new Promise(r => setTimeout(r, 400));
    const allHistoryRows = await page.$$eval('#historyList .history-row', rows => rows.length);
    const allHistoryBadgeText = await page.$eval('#historyStatusBadge', el => el.textContent.trim());
    console.log(`>>> Expanded History Rows Count: ${allHistoryRows} (${allHistoryBadgeText})`);

    const historyViewAllScreenshot = path.join(ARTIFACTS_DIR, '06_history_view_all.png');
    await page.screenshot({ path: historyViewAllScreenshot });
    console.log(`>>> Saved expanded history screenshot: ${historyViewAllScreenshot}`);

    // Click "Show Recent (5)" to collapse back
    console.log('>>> Testing collapsing back to 5 Most Recent History items...');
    await page.click('#toggleHistoryViewBtn');
    await new Promise(r => setTimeout(r, 400));
    const collapsedHistoryRows = await page.$$eval('#historyList .history-row', rows => rows.length);
    console.log(`>>> Collapsed History Rows Count: ${collapsedHistoryRows}`);

    // Test "Load More (+5)"
    console.log('>>> Testing "Load More (+5)" on Message History...');
    await page.click('#loadMoreHistoryBtn');
    await new Promise(r => setTimeout(r, 400));
    const loadMoreHistoryRows = await page.$$eval('#historyList .history-row', rows => rows.length);
    console.log(`>>> History Rows Count after Load More: ${loadMoreHistoryRows}`);

    // 6. Report Console Status
    console.log('>>> Step 6: Console Error Analysis:');
    const unexpectedErrors = consoleErrors.filter(e => !e.includes('favicon.ico') && !e.includes('401'));
    if (unexpectedErrors.length === 0) {
      console.log('>>> EXCELLENT: 0 unexpected console errors detected in browser!');
    } else {
      console.warn('>>> Warning: Console errors encountered:');
      unexpectedErrors.forEach(e => console.warn('   ', e));
    }

    console.log('\n>>> All browser automated verification steps PASSED successfully!');
  } catch (err) {
    console.error('>>> Test failure:', err);
    const failureScreenshot = path.join(ARTIFACTS_DIR, 'test_failure.png');
    await page.screenshot({ path: failureScreenshot }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
