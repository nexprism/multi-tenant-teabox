// Test file for the Shipping API
// Run this with: node test-shipping-api.js

const testCreateShipping = async () => {
  const apiUrl = "http://localhost:3000/api/shipping/create"; // Update with your domain

  const testData = {
    orderId: "64f8a12b5e4d3c2a1b9f8e7d", // Replace with actual order ID
    shipping_method: "dtdc",
    service_type_id: "B2C PRIORITY",
    dimensions: {
      length: 20,
      width: 15,
      height: 10,
    },
    weight: 2.5,
  };

  try {
    console.log("Testing Shipping API...");
    console.log("Request Data:", JSON.stringify(testData, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant": "your-tenant-name", // Update with your tenant
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ Shipping created successfully!");
      console.log("Tracking Number:", result.data.tracking_number);
    } else {
      console.log("❌ Failed to create shipping");
      console.log("Errors:", result.errors || [result.message]);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
};

// Test cases for different scenarios
const runAllTests = async () => {
  console.log("=== Running Shipping API Tests ===\n");

  // Test 1: Valid DTDC request
  console.log("Test 1: Valid DTDC Request");
  await testCreateShipping();
  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Missing orderId
  console.log("Test 2: Missing orderId");
  await testInvalidRequest(
    {
      shipping_method: "dtdc",
      service_type_id: "B2C PRIORITY",
    },
    "Should fail without orderId"
  );
  console.log("\n" + "=".repeat(50) + "\n");

  // Test 3: Invalid shipping method
  console.log("Test 3: Invalid shipping method");
  await testInvalidRequest(
    {
      orderId: "64f8a12b5e4d3c2a1b9f8e7d",
      shipping_method: "invalid_method",
    },
    "Should fail with invalid shipping method"
  );
  console.log("\n" + "=".repeat(50) + "\n");

  // Test 4: Blue Dart request (should show not implemented)
  console.log("Test 4: Blue Dart Request");
  await testInvalidRequest(
    {
      orderId: "64f8a12b5e4d3c2a1b9f8e7d",
      shipping_method: "bluedart",
      service_type_id: "EXPRESS",
    },
    "Should show Blue Dart not implemented"
  );
};

const testInvalidRequest = async (data, description) => {
  const apiUrl = "http://localhost:3000/api/shipping/create";

  try {
    console.log("Description:", description);
    console.log("Request Data:", JSON.stringify(data, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant": "your-tenant-name",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test error:", error.message);
  }
};

// Run the tests
runAllTests();

// Export for use in other files
module.exports = {
  testCreateShipping,
  testInvalidRequest,
  runAllTests,
};
