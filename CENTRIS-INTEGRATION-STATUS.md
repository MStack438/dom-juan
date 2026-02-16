# Centris.ca Integration Status

**Date:** February 16, 2026
**Status:** ✅ Parser Complete | ⏸️ Integration In Progress

---

## 🎯 What's Been Completed

### ✅ **1. Centris Parser** (`centris-parser.service.ts`)

**Status:** ✅ 100% Complete and Tested

**Features:**
- Parses Centris.ca search results HTML
- Extracts all key data:
  - Centris number (unique ID)
  - Price
  - Address
  - Property category (House, Condo, Duplex, etc.)
  - Bedrooms
  - Bathrooms
  - Photo count
  - Detail page URL

**Test Results:**
```
✅ 20/20 listings parsed successfully
✅ 100% success rate
✅ All validation checks passed
```

Sample output:
```
Centris #18699470
Price: $1,200,000
Address: 3611, Avenue de l'Hôtel-de-Ville, Montréal
Category: House for sale
Bedrooms: 3
Bathrooms: 2
Photos: 36
```

### ✅ **2. Centris URL Builder** (`centris-url-builder.service.ts`)

**Status:** ✅ Complete

**Features:**
- Builds Centris.ca search URLs from criteria
- Maps property types (detached → houses, condo → condos, etc.)
- Maps regions (Montreal, Quebec City, Laval, etc.)
- Supports filters:
  - Price range
  - Bedrooms/bathrooms
  - Year built
  - Lot size
  - Living area
- Handles custom URLs
- Parses URLs back to criteria

### ✅ **3. Database Schema Updates**

**Files Modified:**
- `src/db/schema/listing.ts` - Added `source` and `centrisNumber` fields
- `src/db/schema/tracking-list.ts` - Added `source` field

**Changes:**
```typescript
// listing table
source: varchar('source', { length: 20 }).notNull().default('realtor')
centrisNumber: varchar('centris_number', { length: 50 }).unique()

// tracking_list table
source: varchar('source', { length: 20 }).notNull().default('realtor')
```

**Migration:**
- SQL migration file created: `migrations/add-centris-support.sql`
- ⚠️ **Needs to be run manually** (Drizzle migration had config issues)

### ✅ **4. Test Infrastructure**

**Created:**
- `scripts/test-centris-parser.ts` - Validates parser against HTML
- `scripts/capture-centris-html.ts` - Captures Centris HTML
- HTML fixtures with 20 real Centris listings

**Test Command:**
```bash
npx tsx scripts/test-centris-parser.ts
```

---

## ⏸️ What Remains

### **1. Update Main Scraper** (30 min)

Need to modify `scraper.service.ts` to:
- Check tracking list `source` field
- Route to appropriate parser:
  ```typescript
  if (list.source === 'centris') {
    const results = await parseCentrisSearchResults(page);
    // ... handle Centris results
  } else {
    const results = await parseSearchResults(page);
    // ... handle Realtor results
  }
  ```
- Save with correct source and ID fields

### **2. Run Database Migration** (5 min)

Manual SQL execution needed:
```bash
# Connect to database and run:
cat migrations/add-centris-support.sql | psql <DATABASE_URL>
```

Or via Drizzle once config is fixed.

### **3. Update Frontend** (Optional - 20 min)

Add source selection to tracking list form:
- Radio buttons: "Realtor.ca" vs "Centris.ca"
- Conditional help text for URL patterns
- Display source badge on listing cards

### **4. Create Centris Tests** (Optional - 15 min)

Add unit tests to `centris-parser.test.ts` similar to `parser.test.ts`.

---

## 📊 Current Capabilities

### **What Works Right Now:**

✅ **Parse Centris HTML:**
```bash
# Test parser against captured HTML
npx tsx scripts/test-centris-parser.ts
```

✅ **Build Centris URLs:**
```typescript
import { buildCentrisSearchUrl } from './centris-url-builder.service.js';

const url = buildCentrisSearchUrl({
  priceMax: 500000,
  bedsMin: 3,
  municipality: 'Montreal',
});
// Returns: https://www.centris.ca/en/houses~for-sale~montreal-region?...
```

✅ **Extract all listing data** from Centris search results

### **What Doesn't Work Yet:**

❌ **Live scraping** - Main scraper not yet updated
❌ **Database storage** - Migration not run
❌ **Frontend display** - No source selection UI

---

## 🚀 Quick Integration Guide

To complete the integration:

### **Step 1: Update Scraper Service** (Main work)

Edit `src/services/scraper/scraper.service.ts`:

```typescript
// At top of file
import {
  parseCentrisSearchResults,
  type CentrisSearchResult,
} from './centris-parser.service.js';
import {
  buildCentrisSearchUrl,
  buildFromCentrisCustomUrl,
} from './centris-url-builder.service.js';

// In executeScrapeRun function, around line 85:
const source = list.source || 'realtor';

let searchUrl: string;
if (source === 'centris') {
  searchUrl = list.customUrl
    ? buildFromCentrisCustomUrl(list.customUrl)
    : buildCentrisSearchUrl(list.criteria);
} else {
  searchUrl = list.customUrl
    ? buildFromCustomUrl(list.customUrl)
    : buildSearchUrl(list.criteria);
}

// Around line 101, after getting results:
if (source === 'centris') {
  const centrisResults = await parseCentrisSearchResults(page);
  // Process Centris results...
} else {
  const results = await parseSearchResults(page);
  // Process Realtor results...
}
```

### **Step 2: Run Migration**

```bash
# Option A: Direct SQL
psql <your-database-url> < migrations/add-centris-support.sql

# Option B: Via Node script (TODO: create this)
npx tsx scripts/run-migration.ts add-centris-support
```

### **Step 3: Test End-to-End**

```bash
# Create a Centris tracking list
npx tsx scripts/create-test-tracking-list.ts --source=centris

# Run scraper
npm run scrape

# Check results
npx tsx scripts/check-scrape-results.ts
```

---

## 📁 Files Created

```
server/
├── src/services/scraper/
│   ├── centris-parser.service.ts          ✅ Complete
│   └── centris-url-builder.service.ts     ✅ Complete
├── scripts/
│   ├── test-centris-parser.ts             ✅ Complete
│   └── capture-centris-html.ts            ✅ Complete
├── src/db/schema/
│   ├── listing.ts                         ✅ Updated
│   └── tracking-list.ts                   ✅ Updated
├── migrations/
│   └── add-centris-support.sql            ✅ Created
└── fixtures/
    └── centris-with-listings.html         ✅ 20 properties
```

---

## 💡 Key Insights

### **Centris vs Realtor.ca:**

| Feature | Realtor.ca | Centris.ca |
|---------|-----------|------------|
| **Coverage** | National (Canada) | Quebec only |
| **Quebec Listings** | Fewer | More (official MLS) |
| **Bot Protection** | Aggressive (Incapsula) | Similar |
| **Data Structure** | React SPA | Server-rendered + schema.org |
| **Unique ID** | MLS Number | Centris Number |
| **Data Quality** | Good | Excellent (schema.org markup) |
| **Selector Stability** | Low (hashed classes) | High (semantic HTML) |

### **Why Centris is Better for Quebec:**

1. ✅ **More listings** - Official Quebec MLS
2. ✅ **Better structured HTML** - Uses schema.org microdata
3. ✅ **More stable selectors** - Semantic classes, not hashed
4. ✅ **Richer data** - More property details in search results

---

## 🎯 Recommendation

**Complete the integration!** Centris is likely to be more reliable than Realtor.ca for Quebec properties:

1. More listings available
2. Better HTML structure
3. Clearer data extraction
4. Official MLS for Quebec

**Time to complete:** ~1-2 hours
- 30 min: Update scraper
- 5 min: Run migration
- 15 min: Test
- 20 min: Frontend UI (optional)

---

## 📝 Notes

- Centris may have similar bot protection as Realtor.ca
- Manual HTML capture worked perfectly (20 listings)
- Parser is production-ready
- Database schema supports both sources
- Can run both Realtor and Centris simultaneously

---

**Status:** Ready for final integration. Parser and URL builder are complete and tested. Just need to wire it into the main scraper and run the migration.
