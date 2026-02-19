#!/usr/bin/env tsx
/**
 * Railway Playwright verification script
 * Tests if Playwright is installed and can launch Chromium
 * Run on Railway: railway run npx tsx server/scripts/test-playwright-railway.ts
 */

console.log('\n🔍 Testing Playwright Installation on Railway\n');
console.log('='.repeat(60));

// Test 1: Check if Playwright module exists
console.log('\n[1/4] Checking if Playwright module is installed...');
try {
  const pw = await import('playwright');
  console.log('✅ Playwright module found');
  console.log(`    Version: ${pw.chromium.name()}`);
} catch (error) {
  console.error('❌ Playwright module NOT found');
  console.error('    Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// Test 2: Import chromium
console.log('\n[2/4] Importing Chromium...');
let chromium: any;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
  console.log('✅ Chromium imported successfully');
} catch (error) {
  console.error('❌ Failed to import Chromium');
  console.error('    Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// Test 3: Check executable path
console.log('\n[3/4] Checking Chromium executable path...');
try {
  const execPath = chromium.executablePath();
  console.log('✅ Executable path found');
  console.log(`    Path: ${execPath}`);

  // Check if file exists (try to require fs)
  const fs = await import('fs');
  if (fs.existsSync(execPath)) {
    console.log('✅ Executable file exists');
  } else {
    console.error('❌ Executable file NOT found at path');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to get executable path');
  console.error('    Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

// Test 4: Launch browser
console.log('\n[4/4] Attempting to launch Chromium browser...');
let browser: any = null;
try {
  browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });
  console.log('✅ Browser launched successfully');

  // Test creating a page
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('data:text/html,<h1>Test</h1>');
  const title = await page.title();
  console.log(`✅ Page created and navigated (title: "${title}")`);

  await browser.close();
  console.log('✅ Browser closed successfully');
} catch (error) {
  console.error('❌ Failed to launch browser');
  console.error('    Error:', error instanceof Error ? error.message : error);
  if (browser) {
    try {
      await browser.close();
    } catch {}
  }
  process.exit(1);
}

// Success summary
console.log('\n' + '='.repeat(60));
console.log('🎉 SUCCESS: Playwright is fully functional!');
console.log('='.repeat(60));
console.log('\nPlaywright Details:');
console.log(`  ✓ Module: Installed`);
console.log(`  ✓ Executable: Found and working`);
console.log(`  ✓ Browser: Can launch and navigate`);
console.log(`  ✓ Ready: For production scraping`);
console.log('\n✅ The scraper should work on Railway!\n');

process.exit(0);
