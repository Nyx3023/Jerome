const axios = require('axios');
const mysql = require('mysql2/promise');

// Test configuration
const API_BASE = 'http://localhost:5000';
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'clinic_db'
};

// Test scenarios for complex timing and race conditions
const TIMING_SCENARIOS = [
  {
    name: 'Late Patient Time Bomb',
    description: 'Test broken time parsing for late arrivals',
    test: async () => {
      try {
        // Create booking for 8:00 AM
        const bookingResponse = await axios.post(`${API_BASE}/api/book-appointment`, {
          user_id: 1,
          service_type: 'Prenatal',
          date: '2024-01-15',
          time_slot: '8:00-8:30AM',
          notes: 'Test late arrival'
        });
        
        const bookingId = bookingResponse.data.bookingId;
        
        // Try to check in 45 minutes late (8:45 AM)
        const checkinResponse = await axios.post(`${API_BASE}/api/check-in`, {
          booking_id: bookingId,
          date: '2024-01-15',
          time_slot: '8:00-8:30AM'
        });
        
        console.log('❌ Late check-in should fail but got:', checkinResponse.data);
        return false;
      } catch (error) {
        console.log('✅ Late check-in properly rejected:', error.response?.data);
        return true;
      }
    }
  },
  
  {
    name: 'Double Booking Race Condition',
    description: 'Simulate simultaneous bookings for same slot',
    test: async () => {
      const bookingPromises = [];
      
      // Two patients try to book same slot simultaneously
      for (let i = 0; i < 2; i++) {
        bookingPromises.push(
          axios.post(`${API_BASE}/api/book-appointment`, {
            user_id: i + 100, // Different users
            service_type: 'Prenatal',
            date: '2024-01-16',
            time_slot: '9:00-9:30AM',
            notes: `Race test ${i}`
          })
        );
      }
      
      try {
        const results = await Promise.allSettled(bookingPromises);
        const successes = results.filter(r => r.status === 'fulfilled').length;
        
        if (successes > 1) {
          console.log(`❌ RACE CONDITION: ${successes} bookings succeeded for same slot!`);
          return false;
        } else {
          console.log('✅ Race condition properly handled');
          return true;
        }
      } catch (error) {
        console.log('✅ Booking race properly prevented');
        return true;
      }
    }
  },
  
  {
    name: 'Service Duration Mismatch',
    description: 'Book 60-min service into 30-min slot',
    test: async () => {
      try {
        // First, ensure we have a 60-minute service
        await axios.post(`${API_BASE}/api/admin/services`, {
          service_name: 'Ultrasound',
          duration: 60,
          description: '60 minute ultrasound'
        });
        
        // Try to book as walk-in (should reserve 2 slots but currently only reserves 1)
        const walkinResponse = await axios.post(`${API_BASE}/api/admin/walkins`, {
          first_name: 'Test',
          last_name: 'Patient',
          phone: '09123456789',
          service_type: 'Ultrasound',
          date: '2024-01-17',
          time_slot: '10:00-10:30AM'
        });
        
        console.log('Walk-in booked:', walkinResponse.data);
        
        // Check if system reserved enough slots
        const connection = await mysql.createConnection(DB_CONFIG);
        const [slots] = await connection.execute(
          'SELECT * FROM slots WHERE date = ? AND booking_id = ?',
          ['2024-01-17', walkinResponse.data.bookingId]
        );
        
        await connection.end();
        
        if (slots.length < 2) {
          console.log(`❌ DURATION MISMATCH: Only ${slots.length} slot(s) reserved for 60-min service`);
          return false;
        } else {
          console.log('✅ Duration properly handled');
          return true;
        }
      } catch (error) {
        console.log('Duration test error:', error.response?.data || error.message);
        return false;
      }
    }
  },
  
  {
    name: 'Early Check-in Overlap',
    description: 'Check in early and potentially overlap with previous appointment',
    test: async () => {
      try {
        // Book two consecutive appointments
        const booking1 = await axios.post(`${API_BASE}/api/book-appointment`, {
          user_id: 200,
          service_type: 'Prenatal',
          date: '2024-01-18',
          time_slot: '8:00-8:30AM'
        });
        
        const booking2 = await axios.post(`${API_BASE}/api/book-appointment`, {
          user_id: 201,
          service_type: 'Prenatal',
          date: '2024-01-18',
          time_slot: '8:30-9:00AM'
        });
        
        // Try to check in second patient 30 minutes early (8:00 AM)
        const earlyCheckin = await axios.post(`${API_BASE}/api/check-in`, {
          booking_id: booking2.data.bookingId,
          date: '2024-01-18',
          time_slot: '8:30-9:00AM'
        });
        
        console.log('Early check-in result:', earlyCheckin.data);
        
        // Check if both appointments are marked ongoing simultaneously
        const connection = await mysql.createConnection(DB_CONFIG);
        const [appointments] = await connection.execute(
          'SELECT * FROM booking WHERE date = ? AND appointment_status = ?',
          ['2024-01-18', 'ongoing']
        );
        
        await connection.end();
        
        if (appointments.length > 1) {
          console.log(`❌ OVERLAP: ${appointments.length} appointments ongoing simultaneously`);
          return false;
        } else {
          console.log('✅ No overlap detected');
          return true;
        }
      } catch (error) {
        console.log('Early check-in error:', error.response?.data);
        return false;
      }
    }
  },
  
  {
    name: 'No-Show Chain Reaction',
    description: 'Test if no-show properly triggers next patient call',
    test: async () => {
      try {
        // Create a booking and mark as no-show
        const booking = await axios.post(`${API_BASE}/api/book-appointment`, {
          user_id: 300,
          service_type: 'Prenatal',
          date: '2024-01-19',
          time_slot: '9:00-9:30AM'
        });
        
        // Mark as no-show
        await axios.post(`${API_BASE}/api/admin/release-no-show`, {
          booking_id: booking.data.bookingId
        });
        
        // Check if slot was freed
        const connection = await mysql.createConnection(DB_CONFIG);
        const [slots] = await connection.execute(
          'SELECT COUNT(*) AS cnt FROM slots WHERE booking_id = ?',
          [booking.data.bookingId]
        );
        await connection.end();
        const noneRemain = (slots && slots[0] && Number(slots[0].cnt) === 0);
        if (!noneRemain) {
          console.log(`❌ NO-SHOW: Slot reservation rows remain`);
          return false;
        }
        console.log('✅ No-show properly handled');
        return true;
      } catch (error) {
        console.log('No-show test error:', error.response?.data);
        return false;
      }
    }
  }
];

// Run all timing scenarios
async function runTimingScenarios() {
  console.log('🧪 Running Complex Timing & Race Condition Tests\n');
  
  const results = [];
  
  for (const scenario of TIMING_SCENARIOS) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    
    try {
      const passed = await scenario.test();
      results.push({
        name: scenario.name,
        passed,
        status: passed ? '✅ PASSED' : '❌ FAILED'
      });
    } catch (error) {
      console.log(`💥 Test crashed:`, error.message);
      results.push({
        name: scenario.name,
        passed: false,
        status: '💥 CRASHED'
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary report
  console.log('\n📊 TIMING SCENARIOS TEST SUMMARY');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
  });
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📈 Overall: ${passed}/${total} scenarios passed`);
  
  if (passed < total) {
    console.log('\n⚠️  CRITICAL ISSUES DETECTED:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  runTimingScenarios()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runTimingScenarios, TIMING_SCENARIOS };
