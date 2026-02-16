# Realtor.ca Selector Discovery Guide

This guide helps you find the correct CSS selectors for Realtor.ca scraping.

## Current Status

❌ **Selectors are placeholder guesses** - They don't match the actual DOM structure.

## What We Need to Find

### 1. Search Results Page

#### Listing Cards
Find the container for each property listing:
- Look for repeated elements (one per property)
- Check for: `data-testid`, `data-listing-id`, or unique classes
- Common patterns: `article`, `[role="article"]`, `.card`, `.listing`

**What to look for in DevTools:**
```html
<!-- Example pattern (actual structure will differ) -->
<article data-testid="listing-card-12345678">
  <!-- Listing content here -->
</article>
```

#### Price
Within each card, find the price element:
- Usually has specific classes or data attributes
- Text format: `$299,000` or `299 000 $` (French)
- Look for: `[data-testid="price"]`, `.price`, `[class*="Price"]`

#### Address
Location/address within the card:
- May be split into street, city, postal code
- Look for: `[data-testid="address"]`, `.address`, `[itemprop="address"]`

#### Property Details
Within each card:
- **Bedrooms:** Look for bed icon + number
- **Bathrooms:** Look for bath icon + number
- **Square feet:** May be abbreviated as "sqft" or "m²"

#### MLS Number
Unique identifier for the listing:
- Format: 6-8 digit number (e.g., "12345678")
- May be labeled as "MLS®", "MLS#", or hidden in data attributes
- Check: `data-listing-id`, `data-mls`, or text content

#### Detail Page Link
Link to full listing details:
- Usually wraps the entire card or the address
- Should contain: `/real-estate/`, `/property/`, or similar path
- Get the `href` attribute

### 2. Detail Page

Once you click into a listing, find:

#### Core Information
- **Price:** Main price display (may differ from search results)
- **Full Address:** Complete address including postal code
- **MLS Number:** Usually displayed prominently

#### Property Specifications
- **Year Built:** e.g., "Built in 1985"
- **Lot Size:** e.g., "6,500 sqft"
- **Living Area:** e.g., "1,800 sqft"
- **Bedrooms:** Number or "3 bedrooms"
- **Bathrooms:** Number, may include half-baths
- **Stories:** e.g., "2 storey"
- **Property Type:** "Detached", "Semi-detached", "Townhouse", etc.

#### Rich Content
- **Description:** Long text block about the property
- **Photos:** Gallery images (get `src` attributes)
- **Broker/Agent:** Name and agency

#### Look for structured data
Check for:
- Schema.org markup (`<script type="application/ld+json">`)
- Meta tags (`<meta property="og:...">`)
- Data attributes on main containers

## How to Discover Selectors

### Method 1: Browser DevTools (Recommended)

1. **Open Realtor.ca search results**
2. **Right-click a listing card** → "Inspect" (F12)
3. **Find the parent container** for the entire card
4. **Note any `data-*` attributes** (these are the most stable)
5. **Check class names** (but they may change frequently)
6. **Test selector in Console:**
   ```javascript
   // Test if selector finds all cards
   document.querySelectorAll('YOUR_SELECTOR_HERE').length

   // Should return the number of listings on the page
   ```

### Method 2: Use the Capture Script

```bash
cd server
npm run capture-html
```

This opens a browser, lets you bypass CAPTCHAs, then saves the HTML.

### Method 3: Manual Save

1. Visit the search URL in your browser
2. Save page: `Ctrl+S` / `Cmd+S` → "Webpage, Complete"
3. Open saved HTML in VS Code or browser
4. Search for unique text (e.g., a property address you see)
5. Work backwards to find the parent container

## Testing Your Selectors

Once you have potential selectors, test them:

```javascript
// In browser console on Realtor.ca:

// 1. Find all listing cards
const cards = document.querySelectorAll('YOUR_SELECTOR');
console.log(`Found ${cards.length} cards`);

// 2. Test price extraction from first card
const firstCard = cards[0];
const priceEl = firstCard.querySelector('YOUR_PRICE_SELECTOR');
console.log('Price:', priceEl?.textContent);

// 3. Test address extraction
const addressEl = firstCard.querySelector('YOUR_ADDRESS_SELECTOR');
console.log('Address:', addressEl?.textContent);

// 4. Test link extraction
const linkEl = firstCard.querySelector('a[href*="/real-estate"]');
console.log('Link:', linkEl?.href);
```

## Selector Best Practices

### Prefer (in order):
1. **Data attributes:** `[data-testid="listing"]`, `[data-listing-id]`
2. **Semantic HTML:** `article`, `[role="article"]`, `<address>`
3. **Stable class names:** `.PropertyCard`, `.ListingCard` (nouns, not adjectives)
4. **Structure-based:** `main > div > article`, `.results-container > *`

### Avoid:
1. ❌ Utility classes: `.flex`, `.p-4`, `.text-lg` (Tailwind/CSS framework)
2. ❌ Obfuscated classes: `.css-abc123`, `._1a2b3c` (CSS-in-JS)
3. ❌ Position-based: `:nth-child(3)` (fragile)
4. ❌ Overly specific: `.container > .row > .col > .card > .content > .price`

## Common Realtor.ca Patterns (2024-2025)

**Note:** These may be outdated. Verify against current HTML.

- Realtor.ca is a React SPA (Single Page App)
- Uses client-side rendering (listings load via JS)
- May use data attributes like `data-testid` for testing
- Class names may be hashed (e.g., `.css-1a2b3c`)
- Price formatting: English `$299,000`, French `299 000 $`

## Updating the Selectors

Once you've identified the correct selectors:

1. Open `parser.service.ts`
2. Update the `SELECTORS` object
3. Add multiple fallback options:
   ```typescript
   price: '[data-testid="listing-price"], [class*="Price"], .price, [class*="price"]'
   ```
4. Run tests: `npm test`
5. Test with real scraper: `npm run scrape`

## Need Help?

If you're stuck:
1. Save the HTML and share a snippet showing one listing card
2. Share a screenshot of DevTools with a card element selected
3. Note any error messages from the scraper logs
