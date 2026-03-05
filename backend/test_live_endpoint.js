require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';

// Generate a test token for a staff user
const token = jwt.sign({ id: 1, role: 'staff' }, SECRET_KEY, { expiresIn: '1h' });
console.log('Test token:', token);
console.log('\nNow testing the endpoint...');

const http = require('http');
const options = {
    hostname: 'localhost',
    port: 8081,
    path: '/api/staff/appointments',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode !== 200) {
            console.log('Response body:', data);
        } else {
            const parsed = JSON.parse(data);
            console.log('✅ Success! Got', parsed.length, 'appointments');
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
    process.exit(1);
});

req.end();
