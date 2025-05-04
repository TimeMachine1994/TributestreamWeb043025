const fetch = require('node-fetch');

// Configuration
const STRAPI_URL = 'http://localhost:1338'; // Strapi backend URL

// Main test function
async function testCompleteWorkflow() {
  console.log('🚀 Starting complete workflow test...');
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
    console.log(`Registration response: ${JSON.stringify(registerData, null, 2)}`);
    
    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error?.message || JSON.stringify(registerData)}`);
    }
    
    userId = registerData.user.id;
    jwt = registerData.jwt;
    console.log(`✅ User registered successfully! User ID: ${userId}`);
    console.log(`JWT obtained: ${jwt ? 'Yes' : 'No'}`);
    
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
    
    console.log(`Tribute data: ${JSON.stringify(tributeData, null, 2)}`);
    
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
    console.log(`Create tribute response: ${JSON.stringify(createTributeData, null, 2)}`);
    
    if (!createTributeResponse.ok) {
      throw new Error(`Tribute creation failed: ${JSON.stringify(createTributeData)}`);
    }
    
    // Extract tribute ID from the response
    tributeId = createTributeData.data?.id;
    tributeDocumentId = createTributeData.data?.documentId;
    console.log(`✅ Tribute created successfully! Tribute ID: ${tributeId}, Document ID: ${tributeDocumentId}`);
    
    if (!tributeId) {
      throw new Error('Failed to get tribute ID from response');
    }
    
    // Step 3: List all tributes to check if the new tribute appears
    console.log('\n📋 Step 3: Listing all tributes...');
    
    const listTributesResponse = await fetch(`${STRAPI_URL}/api/tributes`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    const listTributesData = await listTributesResponse.json();
    console.log(`List tributes status: ${listTributesResponse.status}`);
    console.log(`Total tributes: ${listTributesData.data?.length || 0}`);
    
    // Find our newly created tribute in the list
    const foundTribute = listTributesData.data?.find(item => 
      item.id === tributeId || 
      item.id === tributeId.toString() || 
      item.attributes?.documentId === tributeDocumentId
    );
    
    if (foundTribute) {
      console.log(`✅ Found newly created tribute in the list!`);
      console.log(`Found tribute: ${JSON.stringify(foundTribute, null, 2)}`);
    } else {
      console.log(`❌ Could not find newly created tribute in the tribute list.`);
      console.log(`First few tributes in list: ${JSON.stringify(listTributesData.data?.slice(0, 2), null, 2)}`);
    }
    
    // Step 4: Try accessing the tribute with different ID formats
    console.log('\n🔍 Step 4: Trying different formats to access the tribute...');
    
    // Try with the numeric ID
    console.log(`Trying with numeric ID: ${tributeId}`);
    const getByIdResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeId}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    console.log(`Get by ID status: ${getByIdResponse.status}`);
    if (getByIdResponse.ok) {
      const getByIdData = await getByIdResponse.json();
      console.log(`Get by ID success! Response: ${JSON.stringify(getByIdData, null, 2)}`);
    } else {
      console.log(`Get by ID failed.`);
    }
    
    // Try with the document ID if it exists
    if (tributeDocumentId) {
      console.log(`\nTrying with document ID: ${tributeDocumentId}`);
      const getByDocIdResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeDocumentId}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      console.log(`Get by document ID status: ${getByDocIdResponse.status}`);
      if (getByDocIdResponse.ok) {
        const getByDocIdData = await getByDocIdResponse.json();
        console.log(`Get by document ID success! Response: ${JSON.stringify(getByDocIdData, null, 2)}`);
      } else {
        console.log(`Get by document ID failed.`);
      }
    }
    
    // Step 5: Try updating a tribute by ID or using an association
    console.log('\n🔄 Step 5: Attempting to associate user with tribute...');
    
    // If we found a tribute in the list, try to use that ID
    const idToUse = foundTribute ? (foundTribute.id || foundTribute.attributes?.id) : tributeId;
    console.log(`Using ID: ${idToUse} for association attempt`);
    
    const associationData = {
      data: {
        owner: userId
      }
    };
    
    console.log(`Association data: ${JSON.stringify(associationData, null, 2)}`);
    
    const associateResponse = await fetch(`${STRAPI_URL}/api/tributes/${idToUse}`, {
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
      console.log(`Association successful! Response: ${JSON.stringify(associateData, null, 2)}`);
      console.log(`✅ Tribute associated with user successfully!`);
    } else {
      console.log(`❌ Association failed`);
      try {
        const errorData = await associateResponse.json();
        console.log(`Error response: ${JSON.stringify(errorData, null, 2)}`);
      } catch (e) {
        console.log(`Could not parse error response: ${e.message}`);
      }
    }
    
    // Verify the workflow status
    const success = registerResponse.ok && createTributeResponse.ok;
    if (success) {
      console.log('\n✅ Basic workflow test completed successfully!');
      console.log(`User registration: ✅`);
      console.log(`Tribute creation: ✅`);
      console.log(`Tribute association: ${associateResponse.ok ? '✅' : '❌'}`);
    } else {
      console.log('\n❌ Workflow test failed');
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

testCompleteWorkflow();