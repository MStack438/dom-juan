# Realtor.ca Scraper Fix Guide

## Current Status

❌ **The scraper runs but returns zero listings**

**Root cause:** CSS selectors in `parser.service.ts` don't match Realtor.ca's actual DOM structure.

## Quick Fix Steps

### Step 1: Install Test Dependencies

```bash
cd server
npm install
```

This installs `vitest` and `@vitest/ui` for testing.

### Step 2: Capture Real HTML

You have two options:

#### Option A: Automated Script (Recommended)

```bash
npm run capture-html
```

This will:
1. Open a browser window
2. Navigate to Realtor.ca
3. If CAPTCHA appears, complete it manually
4. Press Enter when listings are visible
5. Save HTML to `fixtures/realtor-search-YYYY-MM-DD.html`

#### Option B: Manual Browser Save

1. Visit this URL in your browser:
   ```
   https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&LatitudeMax=45.70244&LongitudeMax=-73.06393&LatitudeMin=45.31398&LongitudeMin=-74.05941&Sort=6-D&PropertyTypeGroupID=1&PropertySearchTypeId=1&TransactionTypeId=2&PriceMax=300000&BuildingTypeId=1&BedRange=3-0&Currency=CAD
   ```

2. Wait for listings to fully load (scroll down if needed)

3. Save the page:
   - **Chrome/Edge:** `Ctrl+S` / `Cmd+S` → "Webpage, Complete"
   - **Firefox:** `Ctrl+S` / `Cmd+S` → "Web Page, complete"

4. Copy to fixtures:
   ```bash
   cp ~/Downloads/Realtor.ca*.html src/services/scraper/fixtures/realtor-search-results.html
   ```

### Step 3: Analyze the HTML Structure

Open the saved HTML file in VS Code or a browser:

```bash
code src/services/scraper/fixtures/realtor-search-results.html
```

**What to look for:**

1. **Listing Cards** - Find the repeating container for each property
   - Right-click a listing card → "Inspect Element"
   - Look for parent `<article>`, `<div>`, or other container
   - Note any `data-*` attributes (e.g., `data-testid="listing-card"`)

2. **Price** - Within a card, find the price element
   - Look for text like "$299,000"
   - Note the element's classes or data attributes

3. **Address** - Find the address/location text

4. **MLS Number** - Find the unique listing ID (6-8 digits)
   - May be in the URL or displayed as "MLS# 12345678"

5. **Detail Link** - Find the `<a>` tag that links to the full listing

**Test in Browser Console:**

```javascript
// On the actual Realtor.ca page, open DevTools (F12) and test:

// 1. Find all listing cards
document.querySelectorAll('SELECTOR_HERE').length
// Should return the number of visible listings

// 2. Extract price from first card
document.querySelector('SELECTOR_HERE').querySelector('PRICE_SELECTOR').textContent

// 3. Extract address
document.querySelector('SELECTOR_HERE').querySelector('ADDRESS_SELECTOR').textContent
```

### Step 4: Update Selectors

Edit `src/services/scraper/parser.service.ts`:

```typescript
export const SELECTORS = {
  searchResults: {
    // Replace these with your discovered selectors:
    listingCard: '[data-testid="listing-card"]', // Example
    price: '[data-testid="listing-price"]',      // Example
    address: '[data-testid="listing-address"]',  // Example
    detailLink: 'a[href*="/real-estate/"]',
    mlsNumber: '[data-mls-number]',              // Example
    // ... rest of selectors
  },
  // ...
};
```

**Tips:**
- Use multiple fallback selectors: `'[data-testid="price"], .price, [class*="Price"]'`
- Prefer `data-*` attributes over classes (more stable)
- Test each selector individually in browser console first

### Step 5: Update Tests with Real HTML

Edit `src/services/scraper/parser.test.ts`:

Replace the placeholder HTML with snippets from your captured file:

```typescript
test('parseSearchResults extracts listings from real HTML', async () => {
  const html = `
    <!-- Paste ACTUAL listing card HTML here -->
    <article data-testid="listing-card">
      <div data-testid="listing-price">$299,000</div>
      <div data-testid="listing-address">123 Rue Example, Montréal</div>
      <a href="/real-estate/12345678">View Details</a>
    </article>
  `;

  await page.setContent(html);
  const results = await parseSearchResults(page);

  expect(results).toHaveLength(1);
  expect(results[0].price).toBe(299000);
  expect(results[0].address).toContain('Rue Example');
});
```

### Step 6: Run Tests

```bash
npm test
```

Or for watch mode:

```bash
npm run test:watch
```

Fix any failing tests by adjusting selectors.

### Step 7: Test with Real Scraper

Once tests pass, try a real scrape:

```bash
npm run scrape
```

Check the logs:
- Should see `Found X listing cards`
- Should see `Parse complete: X success, 0 failed`
- Should see listings in database

### Step 8: Verify in Database

```bash
npm run db:studio
```

Or via psql:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM listing;"
```

Should show newly scraped listings.

## Troubleshooting

### "Found 0 listing cards"

**Problem:** Selectors don't match any elements.

**Solutions:**
1. Verify you captured HTML from search results page (not detail page)
2. Check if page has actual listings (not empty results)
3. Re-run capture script and ensure listings are visible before saving
4. Test selectors in browser console on real Realtor.ca page

### "No price found" or "No MLS number found"

**Problem:** Card selector is correct, but child selectors are wrong.

**Solutions:**
1. Inspect one card in DevTools
2. Find the correct price/MLS selectors within that card
3. Update `SELECTORS.searchResults.price` and `mlsNumber`
4. Add multiple fallback selectors

### "Bot protection detected"

**Problem:** Incapsula is blocking Playwright.

**Solutions:**
1. Use non-headless mode: `headless: false` (already set in capture script)
2. Add delays: `await page.waitForTimeout(5000)`
3. Use stealth plugin (see Playwright stealth documentation)
4. Consider rotating User-Agents
5. Use residential proxies (last resort, costs money)

### Tests pass but real scraper fails

**Problem:** Real page structure differs from saved HTML.

**Solutions:**
1. Re-capture fresh HTML (Realtor.ca may have updated)
2. Check if real page requires authentication
3. Verify scraper is waiting for React to hydrate: `waitUntil: 'networkidle'`

## Need More Help?

See these files:
- `SELECTOR-GUIDE.md` - Detailed guide on finding selectors
- `fixtures/README.md` - Info on HTML fixtures
- `parser.service.ts` - The actual parser code with comments

Test in isolation:
```bash
# Test just the parser
npm test parser.test.ts

# Test with verbose output
npm test -- --reporter=verbose

# Open Vitest UI
npx vitest --ui
```

## Common Realtor.ca Selector Patterns (2024-2025)

**⚠️ These may be outdated. Always verify against current HTML.**

Example patterns observed:
- Listing cards: `article`, `[role="article"]`, `[class*="ListingCard"]`
- Price: `[class*="Price"]`, may include currency symbol in different locations
- Address: May be split into multiple elements (street, city, postal)
- MLS: Often in URL as last segment: `/real-estate/12345678`
- Photos: `img[src*="amazonaws.com"]` or similar CDN

Realtor.ca uses:
- React (client-side rendering)
- Possibly CSS-in-JS (hashed class names like `.css-abc123`)
- Map-based search (listings load dynamically)
- Incapsula bot protection

## Success Criteria

✅ Tests pass with real HTML fixtures
✅ `npm run scrape` returns > 0 listings
✅ Database has new rows in `listing` table
✅ Dashboard displays scraped listings
✅ No errors in scraper logs

Once all criteria are met, the scraper is fixed! 🎉
