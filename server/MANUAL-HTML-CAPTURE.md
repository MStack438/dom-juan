# Manual HTML Capture Guide

Since Realtor.ca uses a React SPA with dynamic content loading, the most reliable way to capture HTML is manually.

## Quick Steps (5 minutes)

### Step 1: Open Realtor.ca in Your Browser

Visit this URL in Chrome, Firefox, or Safari:

```
https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&LatitudeMax=45.70244&LongitudeMax=-73.06393&LatitudeMin=45.31398&LongitudeMin=-74.05941&Sort=6-D&PropertyTypeGroupID=1&PropertySearchTypeId=1&TransactionTypeId=2&PriceMax=300000&BuildingTypeId=1&BedRange=3-0&Currency=CAD
```

### Step 2: Wait for Listings to Load

**What you should see:**
- Map of Montreal area
- Property pins on the map
- **List or cards of properties** (this is critical!)

**Wait until:**
- Properties are visible in the sidebar or list view
- You can see addresses, prices, and photos
- The loading spinner has stopped

**If listings don't appear:**
- Try clicking the "List" view button (if it's in map-only mode)
- Try zooming in/out on the map
- Try panning to a different area with more properties
- Check if there's a filter preventing results

### Step 3: Save the Complete Page

#### Chrome / Edge:
1. Press `Cmd+S` (Mac) or `Ctrl+S` (Windows)
2. Choose **"Webpage, Complete"** from the format dropdown
3. Save as `realtor-search-results.html`

#### Firefox:
1. Press `Cmd+S` (Mac) or `Ctrl+S` (Windows)
2. Choose **"Web Page, complete"** from the format dropdown
3. Save as `realtor-search-results.html`

#### Safari:
1. Press `Cmd+S` (Mac)
2. Choose **"Page Source"** from the format dropdown
3. Save as `realtor-search-results.html`

### Step 4: Move HTML to Fixtures

```bash
cd /Users/mariejoseeherard/Desktop/dom-juan/server

# Copy the file
cp ~/Downloads/realtor-search-results.html src/services/scraper/fixtures/

# Or if saved elsewhere:
cp /path/to/realtor-search-results.html src/services/scraper/fixtures/
```

### Step 5: Verify It Worked

```bash
npm run check-selectors
```

**Expected output:**
```
✅ Listing Cards       X matches  (critical)
```

Where X > 0 (ideally 10-20 depending on how many listings were visible)

---

## Troubleshooting

### "No listings visible on the page"

**Option A:** Try a simpler search URL with more results:
```
https://www.realtor.ca/map#ZoomLevel=12&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&Currency=CAD
```

(This removes filters like price and bedroom count)

**Option B:** Use a different region:
```
https://www.realtor.ca/map#ZoomLevel=12&Center=43.653226%2C-79.3831843&Sort=6-D&TransactionTypeId=2&Currency=CAD
```

(Toronto area, typically has many listings)

### "Realtor.ca won't load or shows error"

- Clear your browser cache
- Try incognito/private mode
- Try a different browser
- Wait a few minutes (their site may be down)

### "I saved the HTML but check-selectors still shows 0 matches"

The HTML might be from before listings loaded. Try again and:
1. Wait longer (30-60 seconds) for listings to fully appear
2. Scroll down on the page before saving (triggers lazy loading)
3. Click on a listing to ensure the page is interactive

### "The file is very small (< 100KB)"

You likely saved before the React app finished loading. Try again and wait for:
- Network activity to stop (check browser DevTools Network tab)
- Listings to be visually present on screen
- At least 30 seconds after page load

---

## Alternative: Use Browser DevTools

If saving doesn't work, you can copy HTML directly:

1. Open DevTools: `F12` or `Cmd+Option+I`
2. Go to **Elements** tab
3. Right-click `<html>` at the top
4. Select **"Copy" → "Copy outerHTML"**
5. Paste into a new file: `src/services/scraper/fixtures/realtor-search-results.html`

---

## What's Next?

Once you have the HTML file:

1. **Check selectors:**
   ```bash
   npm run check-selectors
   ```

2. **If selectors fail, test interactively:**
   ```bash
   npm run test-selectors
   ```
   Use the `cards` command to find listing elements.

3. **Update selectors in `parser.service.ts`**

4. **Test the real scraper:**
   ```bash
   npm run scrape
   ```

---

## Why Manual Capture?

Realtor.ca uses:
- **Incapsula bot protection** - Blocks automated browsers
- **React SPA** - Content loads dynamically after page load
- **Map-based UI** - Listings load based on viewport, not static HTML

Manual capture sidesteps all these issues by using a real browser session where we can visually confirm the data is loaded.

This is a one-time step. Once selectors are discovered and working, the automated scraper will work fine for daily scrapes.
