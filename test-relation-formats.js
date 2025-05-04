const fetch = require('node-fetch');

// Configuration
const STRAPI_URL = 'http://localhost:1338'; // Strapi backend URL

// Main test function
async function testRelationFormats() {
  console.log('🚀 Starting relation formats test...');
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
    
    // Extract tribute IDs from the response
    tributeId = createTributeData.data?.id;
    tributeDocumentId = createTributeData.data?.documentId;
    console.log(`✅ Tribute created successfully!`);
    console.log(`Tribute numeric ID: ${tributeId}`);
    console.log(`Tribute document ID: ${tributeDocumentId}`);
    
    // Try different relation formats
    const relationFormats = [
      {
        name: "Format 1: Direct ID",
        data: {
          data: {
            owner: userId
          }
        }
      },
      {
        name: "Format 2: Object with ID",
        data: {
          data: {
            owner: {
              id: userId
            }
          }
        }
      },
      {
        name: "Format 3: Connect array",
        data: {
          data: {
            owner: {
              connect: [{ id: userId }]
            }
          }
        }
      },
      {
        name: "Format 4: Set array",
        data: {
          data: {
            owner: [userId]
          }
        }
      },
      {
        name: "Format 5: Set ID as string",
        data: {
          data: {
            owner: userId.toString()
          }
        }
      }
    ];
    
    // Try each format
    let successfulFormat = null;
    
    for (const format of relationFormats) {
      console.log(`\n🔄 Testing ${format.name}...`);
      console.log(`Payload: ${JSON.stringify(format.data, null, 2)}`);
      
      const associateResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeDocumentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(format.data)
      });
      
      console.log(`Status: ${associateResponse.status}`);
      
      if (associateResponse.ok) {
        console.log(`✅ PUT request successful`);
        const associateData = await associateResponse.json();
        
        // Verify the association
        const verifyResponse = await fetch(`${STRAPI_URL}/api/tributes/${tributeDocumentId}?populate=owner`, {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const ownerData = verifyData.data?.attributes?.owner?.data;
          
          console.log(`Owner data:`, JSON.stringify(ownerData, null, 2));
          
          if (ownerData && ownerData.id && ownerData.id.toString() === userId.toString()) {
            console.log(`✅ ASSOCIATION VERIFIED! Format "${format.name}" works correctly!`);
            successfulFormat = format.name;
            break;
          } else {
            console.log(`❌ Association not verified in response.`);
          }
        } else {
          console.log(`❌ Verification request failed.`);
        }
      } else {
        console.log(`❌ PUT request failed`);
        try {
          const errorData = await associateResponse.json();
          console.log(`Error:`, JSON.stringify(errorData, null, 2));
        } catch (e) {
          console.log(`Could not parse error response`);
        }
      }
    }
    
    if (successfulFormat) {
      console.log(`\n✅ SUCCESS! Found working relation format: "${successfulFormat}"`);
      console.log(`\nSummary of fixes required:`);
      console.log(`1. User registration: Fixed by sending fullName and phoneNumber as top-level fields ✅`);
      console.log(`2. Tribute-user association: Must use document ID (not numeric ID) when accessing tributes ✅`);
      console.log(`3. Tribute-user association: Must use the relation format "${successfulFormat}" ✅`);
    } else {
      console.log(`\n❌ FAILED: None of the tested relation formats worked correctly.`);
    }
    
    return !!successfulFormat;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

testRelationFormats();