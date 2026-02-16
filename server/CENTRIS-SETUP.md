# Adding Centris.ca Support

Centris.ca is Quebec's official MLS (Multiple Listing Service) and typically has more Quebec listings than Realtor.ca.

---

## 🎯 Step 1: Manually Capture Centris HTML

Since Centris.ca (like Realtor.ca) may block automated browsers, let's capture HTML manually.

### **Open Centris.ca in your browser:**

```
https://www.centris.ca/en/properties~for-sale~montreal-region?view=Thumbnail
```

Or try this URL with filters:
```
https://www.centris.ca/en/properties~for-sale~montreal-region~montreal?view=Thumbnail
```

### **Wait for listings to load:**
- You should see property cards with photos, prices, addresses
- Scroll down a bit to trigger lazy-loading

### **Save the page:**
- Press `Cmd+S` (Mac) or `Ctrl+S` (Windows)
- Choose "Webpage, Complete"
- Save as: `centris-with-listings.html`

### **Copy to project:**
```bash
cp ~/Downloads/centris-with-listings.html /Users/mariejoseeherard/Desktop/dom-juan/server/src/services/scraper/fixtures/
```

---

## 🔍 Step 2: Analyze Centris Structure

Once you have the HTML, I'll help you:

1. **Identify selectors** for listing cards, prices, addresses
2. **Create `centris-parser.service.ts`** with Centris-specific parsing logic
3. **Create `centris-url-builder.service.ts`** for building search URLs
4. **Update the main scraper** to support both sources

---

## 📊 What to Look For

When inspecting Centris.ca in DevTools:

### **Listing Cards:**
- Centris uses classes like `.property-thumbnail-item` or similar
- Each card represents one property
- Look for `data-id` or similar attributes

### **Property Data:**
- **Price:** Usually in a `.price` or similar class
- **Address:** May be split into street, city
- **MLS/Centris Number:** Unique identifier (different from Realtor.ca MLS)
- **Bedrooms/Bathrooms:** Usually with icons + numbers
- **Link:** Detail page URL

### **Centris-Specific Fields:**
- Centris number (not MLS number)
- Municipality/borough
- Property type (may use different terms than Realtor.ca)

---

## 🛠️ Implementation Plan

Once we have good HTML, I'll create:

### **1. Parser (`centris-parser.service.ts`)**
```typescript
export const CENTRIS_SELECTORS = {
  searchResults: {
    listingCard: '.property-thumbnail-item',
    price: '.price',
    address: '.address',
    centrisNumber: '[data-id]',
    // ... etc
  },
  detailPage: {
    // Detail page selectors
  },
};

export async function parseCentrisSearchResults(page: Page): Promise<CentrisResult[]> {
  // Parsing logic
}
```

### **2. URL Builder (`centris-url-builder.service.ts`)**
```typescript
export function buildCentrisSearchUrl(criteria: TrackingCriteria): string {
  // Build Centris.ca search URLs
  // Example: https://www.centris.ca/en/properties~for-sale~montreal?...
}
```

### **3. Update Main Scraper**
```typescript
// In scraper.service.ts:
const source = list.source || 'realtor'; // 'realtor' or 'centris'

if (source === 'centris') {
  const results = await parseCentrisSearchResults(page);
} else {
  const results = await parseSearchResults(page); // Realtor.ca
}
```

### **4. Update Database Schema**
```typescript
// Add 'source' field to listings and tracking lists
export const listing = pgTable('listing', {
  // ...
  source: text('source').notNull().default('realtor'), // 'realtor' or 'centris'
  centrisNumber: text('centris_number'), // For Centris listings
});
```

---

## 💡 Advantages of Centris.ca

1. **More Quebec listings** - Centris is Quebec's official MLS
2. **Bilingual** - Supports English and French
3. **Comprehensive data** - More property details
4. **Different bot protection** - May be easier/harder to scrape than Realtor.ca

---

## 🚀 Next Steps

**Please do this now:**

1. Open https://www.centris.ca/en/properties~for-sale~montreal-region?view=Thumbnail in your browser
2. Wait for listings to appear
3. Save page as HTML
4. Copy to `server/src/services/scraper/fixtures/centris-with-listings.html`
5. Let me know when done

Then I'll analyze the HTML structure and create all the necessary code!

---

## 📝 Notes

- Centris uses different property IDs than Realtor.ca (not "MLS numbers")
- Centris may have different property types/categories
- URL structure is different from Realtor.ca
- We'll need to handle both sources in the database

---

**Ready when you are!** Once you've saved the Centris HTML, let me know and I'll build out the full integration. 🚀
