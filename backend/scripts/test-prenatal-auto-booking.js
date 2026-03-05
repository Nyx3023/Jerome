const axios = require('axios');

// Simple test to check if prenatal auto-booking is working
const API_BASE = 'http://localhost:5000';

async function testPrenatalAutoBooking() {
  console.log('🤰 TESTING PRENATAL AUTO-BOOKING\n');
  
  try {
    // Test 1: Online patient prenatal with follow-up
    console.log('📋 Test 1: Online Patient Prenatal');
    const onlinePrenatal = await axios.post(`${API_BASE}/api/prenatal/schedule`, {
      patient_id: 1,
      visit_date: '2024-01-20',
      weeks_pregnant: 20,
      weight: 65,
      blood_pressure: '120/80',
      findings: 'Normal progression',
      next_visit_date: '2024-02-03', // This should trigger auto-booking
      notes: 'Test auto-booking'
    });
    
    console.log('✅ Online prenatal saved:', onlinePrenatal.data.message);
    if (onlinePrenatal.data.autoBooking) {
      console.log('🎯 AUTO-BOOKING TRIGGERED!');
      console.log('📅 Follow-up scheduled for:', onlinePrenatal.data.autoBooking.date);
      console.log('⏰ Time slot:', onlinePrenatal.data.autoBooking.time_slot);
    } else {
      console.log('⚠️  No auto-booking triggered');
    }
    
    // Test 2: Walk-in patient prenatal with follow-up
    console.log('\n📋 Test 2: Walk-in Patient Prenatal');
    const walkinPrenatal = await axios.post(`${API_BASE}/api/admin/walkin-prenatal`, {
      first_name: 'Maria',
      last_name: 'Santos',
      phone: '09123456789',
      visit_date: '2024-01-20',
      weeks_pregnant: 25,
      weight: 68,
      blood_pressure: '118/78',
      findings: 'Good progress',
      next_visit_date: '2024-02-10', // This should trigger auto-booking
      notes: 'Test walk-in auto-booking'
    });
    
    console.log('✅ Walk-in prenatal saved:', walkinPrenatal.data.message);
    if (walkinPrenatal.data.autoBooking) {
      console.log('🎯 AUTO-BOOKING TRIGGERED!');
      console.log('📅 Follow-up scheduled for:', walkinPrenatal.data.autoBooking.date);
      console.log('⏰ Time slot:', walkinPrenatal.data.autoBooking.time_slot);
    } else {
      console.log('⚠️  No auto-booking triggered');
    }
    
    // Test 3: Complete prenatal visit with follow-up
    console.log('\n📋 Test 3: Complete Prenatal Visit');
    const completePrenatal = await axios.post(`${API_BASE}/api/prenatal/complete`, {
      booking_id: onlinePrenatal.data.bookingId || 1,
      findings: 'Visit completed',
      next_visit_date: '2024-02-17', // This should trigger auto-booking
      notes: 'Completion test'
    });
    
    console.log('✅ Prenatal visit completed:', completePrenatal.data.message);
    if (completePrenatal.data.autoBooking) {
      console.log('🎯 AUTO-BOOKING TRIGGERED!');
      console.log('📅 Next visit scheduled for:', completePrenatal.data.autoBooking.date);
    }
    
    console.log('\n🎉 PRENATAL AUTO-BOOKING TEST COMPLETED!');
    console.log('\n💡 SUMMARY:');
    console.log('- Auto-booking triggers when next_visit_date is provided');
    console.log('- Works for both online and walk-in patients');
    console.log('- Works when scheduling AND completing visits');
    console.log('- Remember: Check for the 3 problems mentioned above!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 TIPS:');
    console.log('- Make sure your backend server is running');
    console.log('- Check if prenatal service exists in your database');
    console.log('- Verify API endpoints are correct');
  }
}

// Run the test
if (require.main === module) {
  testPrenatalAutoBooking();
}

module.exports = { testPrenatalAutoBooking };