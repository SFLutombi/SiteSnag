import { checkDomainAvailability } from '../utils/domainChecker';

async function testDomainChecker() {
  // Test domains (mix of likely taken and possibly available)
  const domains = [
    'google',           // Definitely taken
    'microsoft',        // Definitely taken
    'ajk38dh3k2j',     // Likely available (random string)
    'testdomainxyz123', // Likely available
    'snagsight',        // Your domain to check
  ];

  console.log('Starting domain availability check...\n');

  try {
    const results = await checkDomainAvailability(domains);
    
    // Display results in a formatted way
    results.forEach(result => {
      console.log(`Domain: ${result.domain}`);
      console.log(`Available: ${result.available}`);
      console.log(`Source: ${result.source}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      console.log('-------------------');
    });
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the test
testDomainChecker();
