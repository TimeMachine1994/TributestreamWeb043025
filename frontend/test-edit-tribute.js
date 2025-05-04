// Simple test script to verify the edit functionality
const tributeId = 2; // Replace with an actual tribute ID from your database
const newName = "Updated Tribute Name " + new Date().toISOString().slice(0, 16);

// Get the JWT token from cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function testEditTribute() {
  console.log("🧪 Testing edit tribute functionality");
  console.log(`🔍 Updating tribute ID: ${tributeId} with new name: "${newName}"`);
  
  const jwt = getCookie('jwt');
  if (!jwt) {
    console.error("❌ No JWT token found in cookies. Please log in first.");
    return;
  }
  
  try {
    // Make the API call to update the tribute
    const response = await fetch(`/api/tributes/${tributeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ name: newName })
    });
    
    const result = await response.json();
    
    console.log("📊 API Response:", {
      status: response.status,
      ok: response.ok,
      result
    });
    
    if (response.ok && result.success) {
      console.log("✅ Tribute updated successfully!");
      console.log("📝 Updated data:", result.data);
    } else {
      console.error("❌ Failed to update tribute:", result.error || "Unknown error");
    }
  } catch (err) {
    console.error("💥 Exception during API call:", err);
  }
}

// Execute the test
testEditTribute();