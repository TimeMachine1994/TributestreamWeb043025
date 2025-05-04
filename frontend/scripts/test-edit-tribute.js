// Simple Node.js script to test the edit tribute functionality
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:5173';
const TRIBUTE_ID = 2; // Replace with an actual tribute ID from your database
const NEW_NAME = "Updated Tribute Name " + new Date().toISOString().slice(0, 16);
const JWT_TOKEN = process.env.JWT_TOKEN || ''; // Pass JWT token as environment variable

async function testEditTribute() {
  console.log("🧪 Testing edit tribute functionality");
  console.log(`🔍 Updating tribute ID: ${TRIBUTE_ID} with new name: "${NEW_NAME}"`);
  
  if (!JWT_TOKEN) {
    console.error("❌ No JWT token provided. Please set the JWT_TOKEN environment variable.");
    console.error("   Example: JWT_TOKEN=your_token node scripts/test-edit-tribute.js");
    process.exit(1);
  }
  
  try {
    // Make the API call to update the tribute
    const response = await fetch(`${BASE_URL}/api/tributes/${TRIBUTE_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify({ name: NEW_NAME })
    });
    
    const result = await response.json();
    
    console.log("📊 API Response:", {
      status: response.status,
      ok: response.ok,
      result
    });
    
    if (response.ok && result.success) {
      console.log("✅ Tribute updated successfully!");
      console.log("📝 Updated data:", JSON.stringify(result.data, null, 2));
    } else {
      console.error("❌ Failed to update tribute:", result.error || "Unknown error");
    }
  } catch (err) {
    console.error("💥 Exception during API call:", err);
  }
}

// Execute the test
testEditTribute();