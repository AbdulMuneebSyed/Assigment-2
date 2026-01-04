#!/usr/bin/env node

/**
 * CloudFront CDN Testing Script
 * Tests if CloudFront is properly configured and caching content
 */

require("dotenv").config();
const https = require("https");
const { s3Config } = require("./config/s3");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

/**
 * Test a URL and measure response time
 */
function testUrl(url, label) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    https
      .get(url, (res) => {
        const duration = Date.now() - startTime;
        const headers = res.headers;

        // Consume response data
        res.on("data", () => {});
        res.on("end", () => {
          resolve({
            label,
            url,
            status: res.statusCode,
            duration,
            headers: {
              "x-cache": headers["x-cache"] || "N/A",
              "x-amz-cf-id": headers["x-amz-cf-id"] || "N/A",
              via: headers.via || "N/A",
              "content-type": headers["content-type"] || "N/A",
              "content-length": headers["content-length"] || "N/A",
            },
          });
        });
      })
      .on("error", (error) => {
        resolve({
          label,
          url,
          error: error.message,
        });
      });
  });
}

/**
 * Print test results
 */
function printResults(result) {
  console.log(
    `\n${colors.cyan}${colors.bold}--- ${result.label} ---${colors.reset}`
  );

  if (result.error) {
    console.log(`${colors.red}❌ Error: ${result.error}${colors.reset}`);
    return;
  }

  const statusColor = result.status === 200 ? colors.green : colors.red;
  console.log(`${statusColor}Status: ${result.status}${colors.reset}`);
  console.log(`${colors.yellow}Duration: ${result.duration}ms${colors.reset}`);

  // Check if CloudFront is working
  const isCloudFront = result.headers.via.includes("cloudfront");
  const cacheStatus = result.headers["x-cache"];

  if (isCloudFront) {
    console.log(`${colors.green}✅ CloudFront: ACTIVE${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ CloudFront: NOT DETECTED${colors.reset}`);
  }

  if (cacheStatus !== "N/A") {
    const cacheColor = cacheStatus.includes("Hit")
      ? colors.green
      : colors.yellow;
    console.log(`${cacheColor}Cache Status: ${cacheStatus}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}Headers:${colors.reset}`);
  Object.entries(result.headers).forEach(([key, value]) => {
    if (value !== "N/A") {
      console.log(`  ${key}: ${value}`);
    }
  });
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════╗
║       CloudFront CDN Integration Test            ║
╚══════════════════════════════════════════════════╝
${colors.reset}`);

  // Check configuration
  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`  USE_CLOUDFRONT: ${process.env.USE_CLOUDFRONT || "false"}`);
  console.log(
    `  CLOUDFRONT_DOMAIN: ${s3Config.cloudFrontDomain || "Not configured"}`
  );
  console.log(`  S3_BUCKET: ${s3Config.bucketName || "Not configured"}`);

  if (!s3Config.cloudFrontDomain) {
    console.log(
      `\n${colors.yellow}⚠️  Warning: CLOUDFRONT_DOMAIN not configured in .env${colors.reset}`
    );
    console.log(
      `${colors.yellow}Add this to your .env file: CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net${colors.reset}`
    );
  }

  // Test URL (you'll need to replace this with an actual video key from your bucket)
  const testKey = "videos/test-video.mp4"; // Change this to an actual file key
  const cloudFrontUrl = s3Config.cloudFrontDomain
    ? `https://${s3Config.cloudFrontDomain}/${testKey}`
    : null;
  const s3Url = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${testKey}`;

  console.log(
    `\n${colors.yellow}Note: Make sure '${testKey}' exists in your S3 bucket${colors.reset}`
  );
  console.log(
    `${colors.yellow}Or update the 'testKey' variable in this script to test a real file${colors.reset}\n`
  );

  if (cloudFrontUrl) {
    // Test 1: First CloudFront request (should be cache MISS)
    console.log(
      `${colors.bold}Test 1: CloudFront (First Request - Expected MISS)${colors.reset}`
    );
    const cfTest1 = await testUrl(cloudFrontUrl, "CloudFront Request #1");
    printResults(cfTest1);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Second CloudFront request (should be cache HIT)
    console.log(
      `\n${colors.bold}Test 2: CloudFront (Second Request - Expected HIT)${colors.reset}`
    );
    const cfTest2 = await testUrl(cloudFrontUrl, "CloudFront Request #2");
    printResults(cfTest2);

    // Test 3: Direct S3 (for comparison)
    console.log(
      `\n${colors.bold}Test 3: Direct S3 (For Comparison)${colors.reset}`
    );
    const s3Test = await testUrl(s3Url, "S3 Direct");
    printResults(s3Test);

    // Summary
    console.log(`\n${colors.cyan}${colors.bold}Summary:${colors.reset}`);
    if (cfTest2.headers["x-cache"].includes("Hit")) {
      console.log(
        `${colors.green}✅ CloudFront is working correctly and caching content!${colors.reset}`
      );
      console.log(
        `${colors.green}✅ Second request was ${Math.round(
          ((s3Test.duration - cfTest2.duration) / s3Test.duration) * 100
        )}% faster than S3 direct${colors.reset}`
      );
    } else {
      console.log(
        `${colors.yellow}⚠️  CloudFront is configured but caching may not be working as expected${colors.reset}`
      );
    }
  } else {
    console.log(
      `\n${colors.red}Cannot run tests: CLOUDFRONT_DOMAIN not configured${colors.reset}`
    );
    console.log(
      `${colors.yellow}Please add to .env: USE_CLOUDFRONT=true${colors.reset}`
    );
    console.log(
      `${colors.yellow}                      CLOUDFRONT_DOMAIN=your-domain.cloudfront.net${colors.reset}`
    );
  }

  console.log(`\n${colors.cyan}${colors.bold}Test Complete!${colors.reset}\n`);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});
