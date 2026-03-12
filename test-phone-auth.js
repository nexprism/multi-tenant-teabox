// Test script for Phone/OTP Authentication API
// Run with: node test-phone-auth.js

const API_BASE = 'http://localhost:3000/api';

async function testPhoneAuth() {
  console.log('🚀 Testing Phone/OTP Authentication Flow\n');

  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const otpResponse = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '7014628523'
      })
    });

    const otpResult = await otpResponse.json();
    console.log('OTP Response:', otpResult);

    if (!otpResult.success) {
      throw new Error('Failed to request OTP');
    }

    // Step 2: Verify OTP
    console.log('\n🔐 Step 2: Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '7014628523',
        otp: '123456' // Fixed OTP for testing
      })
    });

    const verifyResult = await verifyResponse.json();
    console.log('Verify Response:', verifyResult);

    if (!verifyResult.success) {
      throw new Error('Failed to verify OTP');
    }

    // Check if user is new (status 206) or existing (status 200)
    if (verifyResponse.status === 206) {
      // Step 3: Complete Registration for new users
      console.log('\n👤 Step 3: Completing registration for new user...');
      
      // Extract cookies from verify response for session
      const cookies = verifyResponse.headers.get('set-cookie');
      
      const registrationResponse = await fetch(`${API_BASE}/auth/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'securePassword123'
        })
      });

      const registrationResult = await registrationResponse.json();
      console.log('Registration Response:', registrationResult);

      if (registrationResult.success) {
        console.log('\n✅ Registration completed successfully!');
        console.log('User ID:', registrationResult.data.user._id);
        console.log('Access Token:', registrationResult.data.tokens.accessToken.substring(0, 50) + '...');
      }
    } else if (verifyResponse.status === 200) {
      console.log('\n✅ Existing user logged in successfully!');
      console.log('User ID:', verifyResult.data.user._id);
      console.log('Access Token:', verifyResult.data.tokens.accessToken.substring(0, 50) + '...');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test with different scenarios
async function testExistingUser() {
  console.log('\n🔄 Testing existing user login...');
  // This would test the flow for a user that already exists
  // The phone number would return isNewUser: false in step 1
  // And step 2 would return status 200 with user data
}

async function testInvalidOTP() {
  console.log('\n❌ Testing invalid OTP...');
  try {
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '7014628523',
        otp: '000000' // Invalid OTP
      })
    });

    const result = await verifyResponse.json();
    console.log('Invalid OTP Response:', result);
  } catch (error) {
    console.error('Error testing invalid OTP:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testPhoneAuth()
    .then(() => testInvalidOTP())
    .then(() => console.log('\n🎉 All tests completed!'))
    .catch(console.error);
}

module.exports = { testPhoneAuth, testExistingUser, testInvalidOTP };
