#!/usr/bin/env tsx

// Test the Realtor.ca API based on the GitHub wrapper info
async function main() {
  console.log('🔍 Testing Realtor.ca API endpoints...\n');

  // Try different API versions mentioned in search results
  const endpoints = [
    'https://api37.realtor.ca/Listing.svc/PropertySearch_Post',
    'https://api2.realtor.ca/Listing.svc/PropertySearch_Post',
  ];

  // Sample request body based on GitHub wrapper
  const requestBody = {
    ApplicationId: '1',
    CultureId: '1',
    PropertySearchTypeId: '1',
    TransactionTypeId: '2', // Sale
    PriceMax: '300000',
    LatitudeMin: '45.4',
    LatitudeMax: '45.7',
    LongitudeMin: '-73.8',
    LongitudeMax: '-73.5',
    RecordsPerPage: '12',
    CurrentPage: '1',
  };

  for (const endpoint of endpoints) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Testing: ${endpoint}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log(`\n✅ SUCCESS! API is accessible`);
        console.log(`Response keys:`, Object.keys(data));
        
        if (data.Results) {
          console.log(`Total results: ${data.Results.length}`);
          console.log(`\nFirst result sample:`, JSON.stringify(data.Results[0], null, 2).substring(0, 500));
        }
      } else {
        const text = await response.text();
        console.log(`\n❌ Failed - Response:`, text.substring(0, 500));
      }
    } catch (error) {
      console.log(`\n❌ Error:`, error instanceof Error ? error.message : error);
    }
  }
}

main().catch(console.error);
