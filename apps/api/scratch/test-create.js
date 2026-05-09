
const fetch = require('node-fetch');

async function test() {
  // Login as Super Admin to get token
  const loginRes = await fetch('http://localhost:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@example.com', password: 'password123' }) // Assuming this is the admin
  });
  const { accessToken } = await loginRes.json();

  const res = await fetch('http://localhost:4000/templates', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      name: 'Admin Test Design',
      design: { objects: [] }
    })
  });
  
  const data = await res.json();
  console.log('Result:', data);
}

test().catch(console.error);
