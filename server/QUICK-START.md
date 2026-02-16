# Quick Start: Fix the Scraper in 5 Steps

**Goal:** Get the Realtor.ca scraper working and returning listings.

## Prerequisites

```bash
cd /Users/mariejoseeherard/Desktop/dom-juan/server
npm install
```

## Step 1: Capture Real HTML (5 minutes)

```bash
npm run capture-html
```

**What happens:**
- Browser window opens
- Navigates to Realtor.ca search URL
- If CAPTCHA appears, **complete it manually**
- Once listings are visible, press **Enter** in terminal
- HTML saved to `fixtures/realtor-search-YYYY-MM-DD.html`

**Manual alternative:**
1. Visit Realtor.ca in your browser
2. Save page: `Cmd+S` → "Webpage, Complete"
3. Copy to: `src/services/scraper/fixtures/`

## Step 2: Check Current Selectors (1 minute)

```bash
npm run check-selectors
```

**Expected output:**
```
❌ Listing Cards        0 matches  (critical)
❌ Price                0 matches  (critical)
...
```

This shows which selectors are broken.

## Step 3: Find Correct Selectors (10-15 minutes)

**Option A: Interactive Tool**

```bash
npm run test-selectors
```

Commands:
```
> cards                          # Test common card selectors
> count article                  # Count <article> elements
> text [data-testid="price"]    # Extract price text
> quit                           # Exit
```

**Option B: Browser DevTools**

1. Open the saved HTML:
   ```bash
   open src/services/scraper/fixtures/realtor-search-*.html
   ```

2. Right-click a listing → "Inspect Element" (F12)

3. Find the parent container (the card)

4. Note any `data-*` attributes or class names

5. Test in Console:
   ```javascript
   document.querySelectorAll('YOUR_SELECTOR').length
   ```

**What you need to find:**
- Listing card container (e.g., `article`, `[data-testid="listing"]`)
- Price element within card
- Address element
- Link to detail page (`<a href="/real-estate/...">`)
- MLS number (6-8 digit number)

## Step 4: Update Selectors (5 minutes)

Edit `src/services/scraper/parser.service.ts`:

```typescript
export const SELECTORS = {
  searchResults: {
    // Replace with your discovered selectors:
    listingCard: '[data-testid="listing-card"]',  // ← UPDATE THIS
    price: '[data-testid="listing-price"]',       // ← UPDATE THIS
    address: '[data-testid="listing-address"]',   // ← UPDATE THIS
    detailLink: 'a[href*="/real-estate/"]',       // ← UPDATE THIS
    mlsNumber: '[data-mls-number]',               // ← UPDATE THIS
    // ... rest
  },
};
```

**Pro tip:** Use multiple fallbacks:
```typescript
price: '[data-testid="price"], [class*="Price"], .price'
```

Save the file.

## Step 5: Verify It Works (2 minutes)

### Check selectors again:

```bash
npm run check-selectors
```

**Expected (success):**
```
✅ Listing Cards       12 matches  (critical)
✅ Price               12 matches  (critical)
✅ Address             12 matches  (critical)
...

💰 Price:      $299,000
📍 Address:    123 Rue Example, Montréal
🔗 Link:       /real-estate/12345678
🏷️  MLS:        12345678
```

### Run tests:

```bash
npm test
```

(Tests may fail initially, but update them with real HTML as needed)

### Try a real scrape:

```bash
npm run scrape
```

**Expected:**
```
[Parser] Found 12 listing cards
[Parser] ✓ First listing parsed successfully:
[Parser]   MLS: 12345678
[Parser]   Price: $299,000
[Parser]   Address: 123 Rue Example, Montréal
[Parser] Parse complete: 12 success, 0 failed
```

### Check database:

```bash
npm run db:studio
```

Or:
```bash
npm run dev
```

Then visit: http://localhost:5000 (frontend dashboard)

Should see scraped listings!

## Troubleshooting

### "Found 0 listing cards"

→ `listingCard` selector is wrong. Go back to Step 3.

### "No price found" / "No MLS number found"

→ Child selectors (price, address, etc.) are wrong. Update them in Step 4.

### "Bot protection detected"

→ Realtor.ca blocked the request. Try:
- Using manual HTML capture (Step 1, manual alternative)
- Adding longer delays in scraper.service.ts
- Running scraper during off-peak hours

### Tests fail

→ Update `parser.test.ts` with real HTML snippets from your fixture.

## Success Criteria

✅ `npm run check-selectors` → All critical selectors passing
✅ `npm run scrape` → Returns > 0 listings
✅ Database has new listings
✅ Dashboard displays properties

## Need More Help?

- 📖 **Detailed guide:** `SCRAPER-FIX-GUIDE.md`
- 🔍 **Selector help:** `src/services/scraper/SELECTOR-GUIDE.md`
- 📊 **Status:** `../SCRAPER-STATUS.md`

## Time Estimate

- **Fast path:** 20-30 minutes (if HTML capture works smoothly)
- **Slow path:** 1-2 hours (if you need to manually capture or deal with bot protection)

Good luck! 🚀
