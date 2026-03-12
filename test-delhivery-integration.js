// Test file for Delhivery API integration
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN || '5e7e9b8bfc46279733d74e9717a90b3842394771';

// Test 1: Get waybill numbers
async function testGetWaybill() {
  try {
    
    const response = await axios.get(
      `https://track.delhivery.com/waybill/api/bulk/json/?token=${DELHIVERY_TOKEN}&cl=BHARATGRAM%20B2C&count=3`
    );
    
    console.log('✅ Waybill Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Waybill Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Create shipment
async function testCreateShipment(waybill) {
  try {
    console.log('\n🧪 Testing Delhivery Shipment Creation...');
    
    const payload = {
      format: 'json',
      data: JSON.stringify({
        pickup_location: {
          name: "BHARATGRAM B2C"
        },
        shipments: [
          {
            waybill: waybill,
            order: "TEST_ORDER_" + Date.now(),
            weight: 100,
            shipment_height: 10,
            shipment_width: 11,
            shipment_length: 12,
            seller_inv: "TEST_INVOICE_" + Date.now(),
            pin: "600001",
            products_desc: "Test Product Description",
            add: "Test Consignee Address, Test Area",
            state: "TAMIL NADU",
            city: "CHENNAI", 
            phone: "9654395588",
            payment_mode: "Prepaid",
            order_date: new Date().toISOString(),
            name: "Test Consignee Name",
            total_amount: 4250,
            country: "India"
          }
        ]
      })
    };

    const response = await axios.post(
      'https://track.delhivery.com/api/cmu/create.json',
      payload,
      {
        headers: {
          Authorization: `Token ${DELHIVERY_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error) {
    return null;
  }
}

// Test 3: Track shipment
async function testTrackShipment(waybill) {
  try {
    console.log('\n🧪 Testing Delhivery Shipment Tracking...');
    
    const response = await axios.get(
      `https://track.delhivery.com/api/v1/packages/json/?waybill=${waybill}`,
      {
        headers: {
          Authorization: `Token ${DELHIVERY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Tracking Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Tracking Error:', error.response?.data || error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Delhivery API Integration Tests...\n');
  
  // Test waybill generation
  const waybills = await testGetWaybill();
  
  if (waybills && waybills.length > 0) {
    const testWaybill = waybills[0];
    console.log(`\n📋 Using waybill: ${testWaybill} for testing`);
    
    // Test shipment creation
    const shipmentResult = await testCreateShipment(testWaybill);
    
    // Test tracking (might not work immediately for new shipments)
    await testTrackShipment(testWaybill);
  }
  
  console.log('\n🏁 Tests completed!');
}

// Execute tests if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testGetWaybill, testCreateShipment, testTrackShipment };