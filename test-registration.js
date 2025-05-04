const fetch = require('node-fetch');

async function testRegistration() {
  const testUser = {
    username: "testuser" + Date.now(),
    email: `testuser${Date.now()}@example.com`,
    password: "Password123!",
    fullName: "Test User",
    phoneNumber: "5551234567"
  };
  
  console.log("Testing registration with user data:", testUser);
  
  try {
    const response = await fetch('http://localhost:1338/api/auth/local/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("✅ Registration successful! The issue has been fixed.");
      return true;
    } else {
      console.log("❌ Registration failed:", data.error?.message || "Unknown error");
      return false;
    }
  } catch (error) {
    console.error("Error making request:", error);
    return false;
  }
}

testRegistration();