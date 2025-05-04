const fetch = require('node-fetch');

// Configuration
const STRAPI_URL = 'http://localhost:1338'; // Strapi backend URL

// Main test function
async function testDocumentIdAssociation() {
  console.log('🚀 Starting document ID association test...');
  let userId = null;
  let jwt = null;
  let tributeId = null;
  let tributeDocumentId = null;

  try {
    // Step 1: Register a new user
    console.log('\n📝 Step 1: Registering a new user...');
    const testUser = {
      username: "testuser" + Date.now(),
      email: `testuser${Date.now()}@example.com`,
      password: "Password123!",
      fullName: "Test User",
      phoneNumber: "5551234567"
    };
    
    console.log(`User data: ${JSON.stringify(testUser, null, 2)}`);
    
    const registerResponse = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    console.log(`Registration status: ${registerResponse.status}`);
    
    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error?.message || JSON.stringify(registerData)}`);
    }
    
    userId = registerData.user.id;
    jwt = registerData.jwt;
    console.log(`✅ User registered successfully! User ID: ${userId}`);
    
    // Step 2: Create a new tribute
    console.log('\n🏺 Step 2: Creating a new tribute...');
    const tributeData = {
      data: {
        name: `Test Tribute ${Date.now()}`,
        description: "A test tribute created for testing the complete workflow.",
        status: "draft",
        slug: `test-tribute-${Date.now()}`
      }
    };
    
    const createTributeResponse = await fetch(`${STRAPI_URL}/api/tributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(tributeData)
    });
    
    const createTributeData = await createTributeResponse.json();
    console.log(`Create tribute status: ${createTributeResponse.status}`);
    
    if (!createTributeResponse.ok) {
      throw new Error(`Tribute creation failed: ${JSON.stringify(createTributeData)}`);
    }
    
    // Extract tribute ID from the response
    tributeId = createTributeData.data?.id;
    tributeDocumentId = createTributeData.data?.documentId;
    console.log(`✅ Tribute created successfully!`);
    console.log(`Tribute numeric ID: ${tributeId}`);
    console.log(`Tribute document ID: ${tributeDocumentId}`);
    
    // Step 3: Try to associate using document ID
    console.log('\n🔄 Step 3: Associating the tribute with the user using document ID...');
    const associationData = {
      data: {
        owner: userId
      }
    };
    
    console.log(`Association data: ${JSON.stringify(associationData, null, 2)}`);
    
    const associateResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeDocumentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(associationData)
    });
    
    console.log(`Associate status: ${associateResponse.status}`);
    
    if (associateResponse.ok) {
      const associateData = await associateResponse.json();
      console.log(`Association successful! Response:`);
      console.log(JSON.stringify(associateData, null, 2));
      
      // Verify the association
      console.log('\n🔍 Step 4: Verifying the association...');
      
      const verifyResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeDocumentId}?populate=owner`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log(`Verification successful! Tribute-user association data:`);
        console.log(JSON.stringify(verifyData.data?.attributes?.owner, null, 2));
        
        // Check if the owner field is properly populated
        const ownerData = verifyData.data?.attributes?.owner?.data;
        
        if (ownerData && ownerData.id.toString() === userId.toString()) {
          console.log(`\n✅ TEST PASSED! Tribute is properly associated with user.`);
          console.log(`This confirms that document ID must be used for tribute operations instead of numeric ID.`);
          console.log(`\nFix summary:`);
          console.log(`1. The frontend API must use document ID (not numeric ID) when accessing tributes`);
          console.log(`2. The "owner" field for user ID is correctly formatted`);
        } else {
          console.log(`\n❌ TEST FAILED! Association did not work properly.`);
          console.log(`Owner data:`, ownerData);
        }
      } else {
        console.log(`\n❌ Verification failed! Status: ${verifyResponse.status}`);
      }
    } else {
      console.log(`\n❌ Association failed even with document ID!`);
      try {
        const errorData = await associateResponse.json();
        console.log(`Error:`, JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log(`Could not parse error response`);
      }
    }
    
    return associateResponse.ok;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

testDocumentIdAssociation();