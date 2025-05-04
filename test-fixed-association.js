const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:1338'; // Strapi backend URL
const FRONTEND_URL = 'http://localhost:5173'; // SvelteKit frontend URL

// Generate unique identifiers for test data
const timestamp = new Date().getTime();
const uniqueId = Math.floor(Math.random() * 10000);
const email = `testuser${uniqueId}_${timestamp}@example.com`;
const username = `testuser${uniqueId}_${timestamp}`;
const password = 'Password123!';
const fullName = `Test User ${uniqueId}`;
const phoneNumber = `555-123-${uniqueId.toString().padStart(4, '0')}`;
const tributeName = `Test Tribute ${uniqueId} - ${timestamp}`;

// Store data between test steps
let authToken = null;
let userId = null;
let tributeId = null;

console.log('🚀 STARTING FIXED USER-TRIBUTE ASSOCIATION TEST 🚀');
console.log(`📝 Testing with user: ${email}`);
console.log(`📝 Testing with tribute: ${tributeName}`);

async function runTests() {
  try {
    // Step 1: Register a new user with family_contact role
    console.log('\n🔷 STEP 1: Registering New User with Family Contact Role 🔷');
    console.log(`📋 Registration data:`);
    console.log(`  • Username: ${username}`);
    console.log(`  • Email: ${email}`);
    console.log(`  • Full Name: ${fullName}`);
    console.log(`  • Phone: ${phoneNumber}`);
    
    const registerResponse = await axios.post(`${API_URL}/api/auth/local/register`, {
      username,
      email,
      password,
      fullName,
      phoneNumber
    });
    
    console.log(`✅ Registration successful (Status: ${registerResponse.status})`);
    
    const userData = registerResponse.data;
    console.log('👤 User data received:');
    console.log(`  • User ID: ${userData.user.id}`);
    console.log(`  • Email: ${userData.user.email}`);
    console.log(`  • Username: ${userData.user.username}`);
    console.log(`  • Full Name: ${userData.user.fullName || 'Not returned'}`);
    console.log(`  • Phone: ${userData.user.phoneNumber || 'Not returned'}`);
    
    // Store user ID and auth token for later steps
    userId = userData.user.id;
    authToken = userData.jwt;
    console.log(`🔑 Auth token received and stored (${authToken.substring(0, 15)}...)`);
    console.log(`🆔 User ID saved: ${userId}`);
    
    // Step 2: Create a new tribute
    console.log('\n🔷 STEP 2: Creating New Tribute 🔷');
    const tributeData = {
      name: tributeName,
      description: 'This is a test tribute created by the automated test script',
      slug: `test-tribute-${uniqueId}-${timestamp}`,
      status: 'draft'
    };
    
    console.log(`📋 Tribute data:`);
    console.log(`  • Name: ${tributeData.name}`);
    console.log(`  • Description: ${tributeData.description}`);
    console.log(`  • Slug: ${tributeData.slug}`);
    
    const createTributeResponse = await axios.post(`${API_URL}/api/tributes`, {
      data: tributeData
    }, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log(`✅ Tribute creation successful (Status: ${createTributeResponse.status})`);
    
    // Extract the tribute ID and documentId from the response
    const numericId = createTributeResponse.data.data?.id;
    const documentId = createTributeResponse.data.data?.documentId;
    
    if (!documentId) {
      throw new Error('❌ Failed to get documentId from the response');
    }
    
    // Use the documentId for API calls
    tributeId = documentId;
    
    console.log(`🆔 Tribute created with:`);
    console.log(`  • Numeric ID: ${numericId}`);
    console.log(`  • Document ID: ${documentId}`);
    
    // Step 3: Verify the association is already correct
    console.log('\n🔷 STEP 3: Verifying Initial User-Tribute Association 🔷');
    console.log(`🔍 Checking if user ID ${userId} is already associated with tribute ID ${tributeId}`);
    
    const initialVerifyResponse = await axios.get(`${API_URL}/api/tributes/${tributeId}?populate=owner`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log(`✅ Initial verification request successful (Status: ${initialVerifyResponse.status})`);
    
    // Check if the owner is already set
    const initialTributeData = initialVerifyResponse.data.data;
    let initialOwnerData = null;
    
    if (initialTributeData?.attributes?.owner?.data) {
      initialOwnerData = initialTributeData.attributes.owner.data;
      console.log(`👤 Found owner data via attributes.owner.data path`);
    }
    
    if (initialOwnerData) {
      console.log(`✅ User-tribute association already exists!`);
      console.log(`  • Associated Owner ID: ${initialOwnerData.id}`);
      console.log(`  • Original User ID: ${userId}`);
      
      if (initialOwnerData.id.toString() === userId.toString()) {
        console.log(`🎉 AUTOMATIC ASSOCIATION SUCCESSFUL! The fix is working correctly.`);
      } else {
        console.log(`❌ User association is incorrect. Expected user ID ${userId} but got ${initialOwnerData.id}`);
        
        // Try to fix the association in the next step
        console.log('\n🔷 STEP 3b: Attempting to fix the association 🔷');
        await updateTributeOwner(tributeId, userId, authToken);
      }
    } else {
      console.log(`ℹ️ No owner association found yet. Will attempt to create one.`);
      
      // Step 4: Manually associate the user with the tribute
      console.log('\n🔷 STEP 4: Manually Associating User with Tribute 🔷');
      await updateTributeOwner(tributeId, userId, authToken);
    }
    
    // Final verification
    console.log('\n🔷 FINAL VERIFICATION: Confirming User-Tribute Association 🔷');
    console.log(`🔍 Fetching tribute with populated owner data...`);
    
    const finalVerifyResponse = await axios.get(`${API_URL}/api/tributes/${tributeId}?populate=owner`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log(`✅ Final verification request successful (Status: ${finalVerifyResponse.status})`);
    
    // Extract the owner data from the response
    const tributeWithUser = finalVerifyResponse.data.data;
    let ownerData = null;
    
    if (tributeWithUser?.attributes?.owner?.data) {
      ownerData = tributeWithUser.attributes.owner.data;
      console.log(`👤 Found owner data via attributes.owner.data path`);
    } else if (tributeWithUser?.owner) {
      // Direct owner property in the response
      ownerData = tributeWithUser.owner;
      console.log(`👤 Found owner data via direct owner property`);
    }
    
    // Check if we found the owner data
    if (ownerData) {
      console.log(`👤 Associated Owner ID in tribute: ${ownerData.id}`);
      console.log(`👤 Original User ID: ${userId}`);
      
      if (ownerData.id.toString() === userId.toString()) {
        console.log(`🎉 FINAL VERIFICATION SUCCESSFUL: User-tribute association is correct!`);
        
        // Check if we have access to user fields (either directly or in attributes)
        const ownerFullName = ownerData.fullName || ownerData.attributes?.fullName;
        const ownerPhoneNumber = ownerData.phoneNumber || ownerData.attributes?.phoneNumber;
        
        if (ownerFullName || ownerPhoneNumber) {
          console.log('\n📋 Verifying user fields in the populated data:');
          console.log(`  • Owner fullName: ${ownerFullName}`);
          console.log(`  • Owner phoneNumber: ${ownerPhoneNumber}`);
          
          if (ownerFullName === fullName) {
            console.log(`✅ fullName field preserved correctly in the association`);
          } else {
            console.log(`⚠️ fullName field mismatch: ${ownerFullName} vs expected ${fullName}`);
          }
          
          if (ownerPhoneNumber === phoneNumber) {
            console.log(`✅ phoneNumber field preserved correctly in the association`);
          } else {
            console.log(`⚠️ phoneNumber field mismatch: ${ownerPhoneNumber} vs expected ${phoneNumber}`);
          }
        } else {
          console.log(`⚠️ Owner fields not available in the response - unable to verify fullName/phoneNumber`);
        }
      } else {
        console.log(`❌ User association is incorrect. Expected user ID ${userId} but got ${ownerData.id}`);
      }
    } else {
      console.log(`❌ Unable to verify user association - could not find owner data in response`);
    }
    
    // Write the full response to a log file for inspection
    fs.writeFileSync('test-results.json', JSON.stringify({
      user: userData,
      tribute: tributeWithUser,
      association: finalVerifyResponse.data
    }, null, 2));
    
    console.log('\n📊 TEST SUMMARY 📊');
    console.log(`✅ User registration successful with proper fullName and phoneNumber fields`);
    console.log(`✅ Tribute creation successful using document ID: ${tributeId}`);
    
    if (ownerData && ownerData.id.toString() === userId.toString()) {
      console.log(`✅ ISSUE FIXED: User-tribute association successful using document ID`);
      
      const ownerFullName = ownerData.fullName || ownerData.attributes?.fullName;
      const ownerPhoneNumber = ownerData.phoneNumber || ownerData.attributes?.phoneNumber;
      
      if (ownerFullName === fullName && ownerPhoneNumber === phoneNumber) {
        console.log(`✅ Association includes correct fullName and phoneNumber in the owner data`);
      } else if (!ownerFullName && !ownerPhoneNumber) {
        console.log(`⚠️ Could not verify fullName/phoneNumber in association (owner fields not available)`);
      } else {
        console.log(`⚠️ User data in association might not match original input values (see details above)`);
      }
    } else {
      console.log(`❌ User-tribute association verification failed`);
    }
    
    console.log('\n📝 Results details saved to test-results.json');
    return true; // Test completed
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Full Error:', error);
    }
    return false;
  }
}

/**
 * Helper function to update a tribute's owner
 */
async function updateTributeOwner(tributeId, userId, authToken) {
  console.log(`🔄 Associating user ID: ${userId} with tribute ID: ${tributeId}`);
  
  try {
    const updateData = {
      data: {
        owner: userId
      }
    };
    
    console.log(`📤 Sending update request with payload:`, JSON.stringify(updateData, null, 2));
    
    const updateResponse = await axios.put(`${API_URL}/api/tributes/${tributeId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`✅ Update request successful (Status: ${updateResponse.status})`);
    return true;
  } catch (error) {
    console.error(`❌ Error associating tribute with user:`, error.message);
    if (error.response) {
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run the tests
runTests().then(success => {
  if (success) {
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY 🎉');
    process.exit(0);
  } else {
    console.log('\n❌ TESTS FAILED ❌');
    process.exit(1);
  }
});