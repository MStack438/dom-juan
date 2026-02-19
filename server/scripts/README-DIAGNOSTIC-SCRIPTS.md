# Diagnostic Scripts for Realtor.ca Parser

These scripts were created during parser debugging and are kept for future maintenance.

## Quick Tests
- **test-parser-fix.ts** - Validates that parser correctly extracts detail links
- **test-realtor-only.ts** - End-to-end test of Realtor scraper with stealth features
- **test-selector-matching.ts** - Tests each selector individually to debug matching issues

## URL/View Investigation  
- **test-list-view-url.ts** - Tests list view URL (working)
- **test-map-view.ts** - Tests map view URL (doesn't work)
- **test-map-stealth.ts** - Tests map view with stealth enabled

## HTML Capture
- **capture-map-html.ts** - Captures map view HTML for offline analysis
- **capture-realtor-structure.ts** - Captures search results structure

## Database Management
- **check-tracking-lists.ts** - Lists all tracking lists in database
- **update-test-list-url.ts** - Updates test list URL (used to fix map→list issue)

## Usage
Most scripts can be run with:
```bash
npx tsx server/scripts/[script-name].ts
```

## When to Use
- Parser stops working after Realtor.ca updates their DOM
- Need to investigate new selector patterns
- Debugging link extraction issues
