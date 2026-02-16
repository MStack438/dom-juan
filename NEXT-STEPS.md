# ⚡ NEXT STEPS - Quick Reference

**Status:** Infrastructure complete, waiting for manual HTML capture to discover selectors.

---

## 🎯 What You Need To Do Now

### **Step 1: Manually Capture HTML** (5 minutes)

The automated script can't capture listing data because Realtor.ca loads it dynamically via JavaScript. You need to do this manually **once**.

#### Quick Method:

1. **Open in your browser:**
   ```
   https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&LatitudeMax=45.70244&LongitudeMax=-73.06393&LatitudeMin=45.31398&LongitudeMin=-74.05941&Sort=6-D&PropertyTypeGroupID=1&PropertySearchTypeId=1&TransactionTypeId=2&PriceMax=300000&BuildingTypeId=1&BedRange=3-0&Currency=CAD
   ```

2. **Wait until you see:**
   - Property listings with addresses
   - Prices like "$299,000"
   - Property photos
   - (If page shows no results, try removing filters or using a different region)

3. **Save the page:**
   - Mac: `Cmd+S` → Choose "Webpage, Complete"
   - Windows: `Ctrl+S` → Choose "Webpage, Complete"
   - Save as: `realtor-search-results.html`

4. **Copy to project:**
   ```bash
   cp ~/Downloads/realtor-search-results.html /Users/mariejoseeherard/Desktop/dom-juan/server/src/services/scraper/fixtures/
   ```

5. **Verify it worked:**
   ```bash
   cd /Users/mariejoseeherard/Desktop/dom-juan/server
   npm run check-selectors
   ```

   **Expected:** Should show `✅ Listing Cards X matches` where X > 5

   **If still 0 or 1:** The HTML was saved before listings loaded. Try again and wait longer.

---

### **Step 2: Find Correct Selectors** (10 minutes)

Once you have good HTML:

```bash
cd /Users/mariejoseeherard/Desktop/dom-juan/server
npm run test-selectors
```

**Interactive commands:**
```
> cards                          # Test common listing card selectors
> count YOUR_SELECTOR            # Count elements matching selector
> text YOUR_SELECTOR             # Get text content of matches
> html YOUR_SELECTOR             # See HTML structure
> quit                           # Exit
```

**What to find:**
- Listing card container (the outer wrapper for each property)
- Price element (within the card)
- Address element
- Link to detail page
- MLS number

---

### **Step 3: Update Selectors** (5 minutes)

Edit: `/Users/mariejoseeherard/Desktop/dom-juan/server/src/services/scraper/parser.service.ts`

Update the `SELECTORS` object with what you discovered:

```typescript
export const SELECTORS = {
  searchResults: {
    listingCard: 'YOUR_DISCOVERED_SELECTOR',  // e.g., '[data-testid="listing"]'
    price: 'YOUR_PRICE_SELECTOR',             // e.g., '[data-testid="price"]'
    address: 'YOUR_ADDRESS_SELECTOR',         // e.g., '.address'
    detailLink: 'a[href*="/real-estate/"]',   // Link selector
    mlsNumber: 'YOUR_MLS_SELECTOR',           // MLS number location
    // ... rest
  },
};
```

---

### **Step 4: Test** (2 minutes)

```bash
# Verify selectors work
npm run check-selectors

# Expected: All critical selectors ✅

# Try real scraper
npm run scrape

# Expected: "Found X listing cards", "Parse complete: X success, 0 failed"
```

---

### **Step 5: Verify in Database**

```bash
# Option 1: Visual UI
npm run db:studio

# Option 2: Start app
npm run dev
# Then visit: http://localhost:5000

# Should see scraped listings!
```

---

## 📚 Detailed Guides

If you get stuck, see:

| Issue | Guide |
|-------|-------|
| Can't capture HTML | `server/MANUAL-HTML-CAPTURE.md` |
| Don't know how to find selectors | `server/src/services/scraper/SELECTOR-GUIDE.md` |
| Selectors not working | `server/SCRAPER-FIX-GUIDE.md` |
| Want full context | `server/QUICK-START.md` |

---

## 🆘 Troubleshooting

**"No listings visible on Realtor.ca"**
- Try this simpler URL (fewer filters, more results):
  ```
  https://www.realtor.ca/map#ZoomLevel=12&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&Currency=CAD
  ```

**"check-selectors still shows 0 or 1 matches"**
- You saved the page before listings loaded
- Try again and wait 30-60 seconds for listings to appear
- Scroll down on the page before saving (triggers lazy loading)

**"test-selectors shows errors"**
- Make sure you're in the server directory: `cd server`
- Make sure HTML file is in: `src/services/scraper/fixtures/`

**"I don't know what selector to use"**
1. Open the saved HTML file in Chrome
2. Right-click a listing → "Inspect"
3. Look for `data-testid`, `data-*` attributes, or class names
4. Test in Console: `document.querySelectorAll('YOUR_SELECTOR').length`

---

## ⏱️ Time Estimate

- **Step 1 (Capture):** 5 minutes
- **Step 2 (Find selectors):** 10-15 minutes
- **Step 3 (Update code):** 5 minutes
- **Step 4 (Test):** 2 minutes

**Total:** ~20-30 minutes

---

## 🎯 Success Criteria

✅ `check-selectors` shows all critical selectors passing
✅ `npm run scrape` returns listings
✅ Database contains new listing rows
✅ Dashboard displays properties

---

## 💡 Why Manual Capture?

Realtor.ca is a React SPA that loads listing data via JavaScript **after** the initial page load. Automated tools capture too early and only get an empty page shell. Manual capture (with visual confirmation) ensures we have actual data to work with.

This is a **one-time step**. Once selectors are discovered, the automated scraper will work fine for daily scrapes.

---

**Ready to start? Begin with Step 1 above! 🚀**
