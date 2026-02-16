# Test Fixtures

This directory contains HTML snapshots from Realtor.ca used for testing the parser.

## Capturing Fresh HTML

Run the capture script:

```bash
cd server
npm run capture-html
```

This will:
1. Open a browser window
2. Navigate to the configured Realtor.ca search URL
3. Wait for you to complete any CAPTCHA if needed
4. Save the HTML to this directory

## Manual Capture (Alternative)

If the script doesn't work:

1. **Visit Realtor.ca in your browser:**
   - https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668...

2. **Wait for listings to fully load**
   - Scroll down to trigger lazy-loading
   - Ensure all listing cards are visible

3. **Save the page:**
   - Chrome/Edge: `Ctrl+S` / `Cmd+S` → "Webpage, Complete"
   - Firefox: `Ctrl+S` / `Cmd+S` → "Web Page, complete"

4. **Copy HTML to fixtures:**
   ```bash
   cp ~/Downloads/Realtor.ca*.html fixtures/realtor-search-results.html
   ```

5. **Repeat for detail page:**
   - Click any listing to open detail page
   - Save as `realtor-detail-page.html`

## Analyzing Selectors

Once you have the HTML:

```bash
# Open in VS Code
code fixtures/realtor-search-results.html

# Or use browser dev tools
open fixtures/realtor-search-results.html
```

Look for:
- Listing card containers
- Price elements
- Address/location elements
- MLS number
- Links to detail pages
- `data-*` attributes (best for stable selectors)
